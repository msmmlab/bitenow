'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Search, Crosshair, Loader2 } from 'lucide-react';
import { useGesture } from '@use-gesture/react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Venue {
    id: string | number;
    name: string;
    slug: string;
    town_slug?: string;
    lat?: string | number;
    lng?: string | number;
    category?: string;
    best_for?: string[];
    isMatch?: boolean;
    [key: string]: any; // Allow for other properties
}

interface MappedVenue extends Venue {
    dist: number;
    originalBearing: number;
    bearing: number;
    r: number;
    isFar: boolean;
}

interface RadarViewProps {
    venues: Venue[];
    userLocation: { lat: number; lng: number } | null;
    onUpdateLocation: (coords: { lat: number; lng: number } | null) => void;
    initialSearchQuery?: string;
}

// Ensure you set this in .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// --- HELPERS ---

// Distance in meters
function getDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

// Bearing in degrees (0 = North)
function getBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
    const startLatRad = deg2rad(startLat);
    const startLngRad = deg2rad(startLng);
    const destLatRad = deg2rad(destLat);
    const destLngRad = deg2rad(destLng);

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
    const brng = Math.atan2(y, x);
    const brngDeg = (brng * 180) / Math.PI;
    return (brngDeg + 360) % 360;
}

export default function RadarView({ venues, userLocation, onUpdateLocation, initialSearchQuery }: RadarViewProps) {
    const router = useRouter();

    // Controls
    const [zoom, setZoom] = useState(1); // 1 = View whole 20min ring. >1 = zoom in.
    const [rotation, setRotation] = useState(0); // Degrees offset
    const [offset, setOffset] = useState({ x: 0, y: 0 }); // Pan offset

    // Gesture Handling
    const bind = useGesture(
        {
            onDrag: ({ offset: [x, y] }) => {
                setOffset({ x, y });
            },
            onPinch: ({ offset: [d, r] }) => {
                setZoom(d);
                setRotation(r);
            },
        },
        {
            drag: { from: () => [offset.x, offset.y] },
            pinch: {
                from: () => [zoom, rotation],
                scaleBounds: { min: 0.5, max: 5 },
            }
        }
    );

    // Search State
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");
    const [isSearching, setIsSearching] = useState(false);
    const [hasManuallySearched, setHasManuallySearched] = useState(!!initialSearchQuery);

    // Center logic
    const centerLat = userLocation?.lat || -26.3957; // Noosa default
    const centerLng = userLocation?.lng || 153.0905;

    // Max Ring = 15 mins walking (~1200m) for the edge
    const MAX_RADIUS_M = 1200;

    const handleSearch = async (queryOverride?: string) => {
        const query = (queryOverride || searchQuery).trim();
        if (!query) return;

        // Sync local input state if we're overriding (e.g. from URL)
        if (queryOverride) setSearchQuery(queryOverride);

        if (!MAPBOX_TOKEN) {
            alert("Mapbox Token Missing");
            return;
        }

        setIsSearching(true);
        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=au&limit=1`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                onUpdateLocation({ lat, lng });
                setHasManuallySearched(true);
            } else {
                alert("Location not found");
            }
        } catch (e) {
            console.error(e);
            alert("Error searching location");
        } finally {
            setIsSearching(false);
        }
    };

    const handleRecenter = () => {
        onUpdateLocation(null);
        setHasManuallySearched(false);
        setSearchQuery("");
        setRotation(0);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    // Auto-search if initial query provided
    useEffect(() => {
        if (initialSearchQuery && initialSearchQuery.trim()) {
            // Small delay to ensure parent state and context are ready
            const timer = setTimeout(() => {
                handleSearch(initialSearchQuery);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [initialSearchQuery]); // Run when initialSearchQuery changes (e.g. navigation)

    const mappedVenues = useMemo(() => {
        if (!venues.length) return [];

        let points = venues.map(venue => {
            if (!venue.lat || !venue.lng) return null;

            const dist = getDist(centerLat, centerLng, Number(venue.lat), Number(venue.lng));
            const bearing = getBearing(centerLat, centerLng, Number(venue.lat), Number(venue.lng));

            const rRaw = Math.max(0.05, dist / MAX_RADIUS_M);
            const r = Math.pow(rRaw, 0.6);
            const isFar = dist > MAX_RADIUS_M * 1.5;

            return {
                ...venue,
                dist,
                originalBearing: bearing,
                bearing,
                r,
                isFar
            } as MappedVenue;
        }).filter((v): v is MappedVenue => v !== null && !v.isFar);

        // 2. Pre-Spread Clusters (If bearings are too similar, nudge them)
        points.sort((a, b) => a.bearing - b.bearing);
        for (let i = 1; i < points.length; i++) {
            const diff = Math.abs(points[i].bearing - points[i - 1].bearing);
            if (diff < 5) {
                // Nudge apart to give collision avoidance a head start
                points[i].bearing += (5 - diff);
            }
        }

        // 3. Collision Avoidance (Iterative Nudging)
        const ITERATIONS = 50;
        const MIN_DIST_PCT = 0.22; // More breathing room

        for (let i = 0; i < ITERATIONS; i++) {
            for (let a = 0; a < points.length; a++) {
                for (let b = a + 1; b < points.length; b++) {
                    const pA = points[a];
                    const pB = points[b];

                    const dr = pA.r - pB.r;
                    let da = deg2rad(pA.bearing - pB.bearing);
                    if (da > Math.PI) da -= 2 * Math.PI;
                    if (da < -Math.PI) da += 2 * Math.PI;

                    const avgR = (pA.r + pB.r) / 2;
                    const arcLen = avgR * da;
                    const visualDist = Math.sqrt((dr * dr) + (arcLen * arcLen));

                    if (visualDist < MIN_DIST_PCT) {
                        const overlap = MIN_DIST_PCT - visualDist;
                        const force = overlap * 0.6; // Stronger push

                        // Push angularly
                        const anglePush = (force / (avgR + 0.1)) * (180 / Math.PI);
                        if (da > 0) {
                            pA.bearing += anglePush;
                            pB.bearing -= anglePush;
                        } else {
                            pA.bearing -= anglePush;
                            pB.bearing += anglePush;
                        }

                        // Push radially
                        const rPush = force * (dr > 0 ? 1 : -1) * 0.3;
                        pA.r = Math.min(1.05, Math.max(0.05, pA.r + rPush));
                        pB.r = Math.min(1.05, Math.max(0.05, pB.r - rPush));
                    }
                }
            }
        }

        const hasActiveFilter = venues.some(v => v.isMatch === false);
        if (hasActiveFilter) {
            points = points.filter(p => p.isMatch !== false);
        }

        return points;
    }, [venues, centerLat, centerLng]);

    return (
        <div className="relative w-full h-full bg-white dark:bg-black overflow-hidden flex flex-col select-none">
            {/* RADAR CONTENT AREA */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                {/* Cosmos Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-black to-black opacity-100" />
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen pointer-events-none" />

                {/* --- SOLAR SYSTEM CONTAINER --- */}
                <motion.div
                    {...(bind() as any)}
                    className="relative aspect-square w-full max-w-[min(800px,85vh)] flex items-center justify-center p-8 md:p-12 touch-none cursor-grab active:cursor-grabbing"
                    animate={{
                        scale: zoom,
                        rotate: rotation,
                        x: offset.x,
                        y: offset.y
                    }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                    style={{ transformOrigin: 'center center' }}
                >
                    {/* -- ZONE SHADING (Concentric layered depth) -- */}
                    <div className="absolute w-[100%] h-[100%] rounded-full bg-indigo-500/[0.03]" />
                    <div className="absolute w-[78%] h-[78%] rounded-full bg-indigo-500/[0.04]" />
                    <div className="absolute w-[51%] h-[51%] rounded-full bg-indigo-500/[0.05]" />

                    {/* -- RINGS -- */}
                    <div className="absolute w-[100%] h-[100%] rounded-full border border-dashed border-white/30" />
                    <div className="absolute w-[78%] h-[78%] rounded-full border border-dashed border-white/30" />
                    <div className="absolute w-[51%] h-[51%] rounded-full border border-dotted border-white/40" />

                    {/* Labels - Counter-rotating to stay upright, on all 4 axes */}
                    {[
                        { axis: 'top', pos: 'top-[0%] left-1/2 -translate-x-1/2 -translate-y-1/2', dist: '15m', opacity: 'text-white/60' },
                        { axis: 'top', pos: 'top-[11%] left-1/2 -translate-x-1/2 -translate-y-1/2', dist: '10m', opacity: 'text-white/50' },
                        { axis: 'top', pos: 'top-[24.5%] left-1/2 -translate-x-1/2 -translate-y-1/2', dist: '5m', opacity: 'text-white/40' },

                        { axis: 'bottom', pos: 'bottom-[0%] left-1/2 -translate-x-1/2 translate-y-1/2', dist: '15m', opacity: 'text-white/60' },
                        { axis: 'bottom', pos: 'bottom-[11%] left-1/2 -translate-x-1/2 translate-y-1/2', dist: '10m', opacity: 'text-white/50' },
                        { axis: 'bottom', pos: 'bottom-[24.5%] left-1/2 -translate-x-1/2 translate-y-1/2', dist: '5m', opacity: 'text-white/40' },

                        { axis: 'right', pos: 'right-[0%] top-1/2 translate-x-1/2 -translate-y-1/2', dist: '15m', opacity: 'text-white/60' },
                        { axis: 'right', pos: 'right-[11%] top-1/2 translate-x-1/2 -translate-y-1/2', dist: '10m', opacity: 'text-white/50' },
                        { axis: 'right', pos: 'right-[24.5%] top-1/2 translate-x-1/2 -translate-y-1/2', dist: '5m', opacity: 'text-white/40' },

                        { axis: 'left', pos: 'left-[0%] top-1/2 -translate-x-1/2 -translate-y-1/2', dist: '15m', opacity: 'text-white/60' },
                        { axis: 'left', pos: 'left-[11%] top-1/2 -translate-x-1/2 -translate-y-1/2', dist: '10m', opacity: 'text-white/50' },
                        { axis: 'left', pos: 'left-[24.5%] top-1/2 -translate-x-1/2 -translate-y-1/2', dist: '5m', opacity: 'text-white/40' },
                    ].map((label, idx) => (
                        <motion.div
                            key={idx}
                            animate={{ rotate: -rotation }}
                            className={cn(
                                "absolute text-[9px] font-black tracking-widest z-10 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]",
                                label.pos,
                                label.opacity
                            )}
                        >
                            {label.dist}
                        </motion.div>
                    ))}

                    {/* Radial Lines */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-[1px] h-full bg-white" />
                        <div className="h-[1px] w-full bg-white" />
                    </div>

                    {/* -- PLANETS -- */}
                    {mappedVenues.map((venue: MappedVenue) => {
                        const angleRad = deg2rad(venue.bearing - 90);
                        const xPct = 50 + (venue.r * 50 * Math.cos(angleRad));
                        const yPct = 50 + (venue.r * 50 * Math.sin(angleRad));

                        const isMatch = venue.isMatch !== false;
                        const cleanName = venue.name.replace(/\s*\(.*?\)\s*/g, '').trim();

                        let PlanetIcon = <div className="w-2 h-2 rounded-full bg-white/50" />;
                        const cat = (venue.category || "").toLowerCase();
                        const bestFor = (venue.best_for || []).join(" ");

                        if (cat.includes("coffee") || cat.includes("cafe")) PlanetIcon = <span className="text-xl">☕</span>;
                        else if (cat.includes("burger")) PlanetIcon = <span className="text-xl">🍔</span>;
                        else if (cat.includes("pizza")) PlanetIcon = <span className="text-xl">🍕</span>;
                        else if (cat.includes("asian") || cat.includes("thai") || cat.includes("japanese")) PlanetIcon = <span className="text-xl">🥢</span>;
                        else if (cat.includes("bar") || cat.includes("pub") || bestFor.includes("drinks")) PlanetIcon = <span className="text-xl">🍺</span>;
                        else if (cat.includes("ice cream") || cat.includes("gelato")) PlanetIcon = <span className="text-xl">🍦</span>;
                        else if (bestFor.includes("fancy")) PlanetIcon = <span className="text-xl">✨</span>;
                        else PlanetIcon = <span className="text-xl">🍽️</span>;

                        return (
                            <motion.div
                                key={venue.id}
                                className="absolute w-0 h-0 flex items-center justify-center z-20 group"
                                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                            >
                                <motion.button
                                    animate={{ rotate: -rotation, scale: 1 / Math.max(0.7, Math.sqrt(zoom)) }}
                                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                    className="relative flex flex-col items-center justify-center cursor-pointer"
                                    onClick={() => {
                                        const town = venue.town_slug || 'noosa';
                                        const searchParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
                                        router.push(`/venues/${town}/${venue.slug}?from=radar${searchParam}`);
                                    }}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] filter grayscale-[0.3] hover:grayscale-0 transition-transform duration-300 hover:scale-150",
                                    )}>
                                        {PlanetIcon}
                                    </div>
                                    <div className={cn(
                                        "absolute top-full -mt-1 flex flex-col items-center pointer-events-none -space-y-[2.5px] bg-black/90 px-2 py-1.5 rounded-xl border shadow-lg", // <-- mt-XX for icon distance, -space-y-[XX] for word density
                                        isMatch ? "border-orange-500/30" : "border-white/10"
                                    )}>
                                        {cleanName.split(' ').map((word: string, i: number) => (
                                            <span
                                                key={i}
                                                className={cn(
                                                    "text-[0.42rem] font-black uppercase tracking-widest leading-tight whitespace-nowrap",
                                                    isMatch ? "text-orange-100" : "text-gray-400"
                                                )}
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* CENTER SUN (YOU) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
                    <div className={cn(
                        "w-4 h-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)] animate-pulse transition-colors duration-500",
                        hasManuallySearched ? "bg-orange-500 shadow-orange-500/50" : "bg-white shadow-white/50"
                    )} />
                </div>
            </div>

            {/* FIXED BOTTOM MENU - MATCH HEADER STYLE (Top Menu -> Radar -> Bottom Menu) */}
            <div className="shrink-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 px-4 pt-6 pb-12 md:pb-8 flex flex-col items-center gap-4 z-50">
                {/* Interaction Box (Zoom/Rotate) */}
                <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-zinc-800/80 px-8 py-4 rounded-full border border-gray-200/50 dark:border-white/5 shadow-inner w-full max-w-sm justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setRotation(r => r - 45)} className="text-gray-900 dark:text-white hover:text-orange-500 transition-colors">
                            <RotateCcw className="w-8 h-8" />
                        </button>
                        <span className="text-[10px] font-mono font-black text-gray-500 dark:text-white/50 w-10 text-center uppercase tracking-tighter">
                            {Math.round(((rotation % 360) + 360) % 360)}°
                        </span>
                        <button onClick={() => setRotation(r => r + 45)} className="text-gray-900 dark:text-white hover:text-orange-500 transition-colors">
                            <RotateCw className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-2" />

                    <div className="flex items-center gap-4">
                        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="text-gray-900 dark:text-white hover:text-orange-500 transition-colors">
                            <ZoomOut className="w-8 h-8" />
                        </button>
                        <span className="text-[10px] font-mono font-black text-gray-500 dark:text-white/50 w-10 text-center uppercase tracking-tighter">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(4, z + 0.5))} className="text-gray-900 dark:text-white hover:text-orange-500 transition-colors">
                            <ZoomIn className="w-8 h-8" />
                        </button>
                    </div>
                </div>

                {/* Search Bar - Teleport */}
                <div className="flex items-center gap-2 w-full max-w-sm">
                    <div className="flex-1 bg-gray-100/80 dark:bg-zinc-800/80 rounded-full border border-gray-200/50 dark:border-white/5 shadow-inner flex items-center pr-1 transition-all focus-within:ring-2 focus-within:ring-orange-500/30">
                        <input
                            className="bg-transparent border-none text-gray-900 dark:text-white text-sm px-6 py-4 w-full focus:outline-none placeholder:text-gray-400 dark:placeholder:text-white/20 font-mono tracking-tight"
                            placeholder="Teleport: e.g. Hastings St..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={() => handleSearch()}
                            disabled={isSearching}
                            className="p-3 bg-orange-600 rounded-full text-white hover:bg-orange-500 transition-all active:scale-90 disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </div>
                    {hasManuallySearched && (
                        <button
                            onClick={handleRecenter}
                            className="p-4 bg-gray-100 dark:bg-zinc-800 border border-gray-200/50 dark:border-white/5 rounded-full text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                        >
                            <Crosshair className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
