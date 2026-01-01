'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, ZoomIn, ZoomOut, RotateCcw, RotateCw, Search, Crosshair, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface RadarViewProps {
    venues: any[];
    userLocation: { lat: number; lng: number } | null;
    onUpdateLocation: (coords: { lat: number; lng: number } | null) => void;
}

// Ensure you set this in .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// --- HELPERS ---

// Distance in meters
function getDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

export default function RadarView({ venues, userLocation, onUpdateLocation }: RadarViewProps) {
    const router = useRouter();

    // Controls
    const [zoom, setZoom] = useState(1); // 1 = View whole 20min ring. >1 = zoom in.
    const [rotation, setRotation] = useState(0); // Degrees offset

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [hasManuallySearched, setHasManuallySearched] = useState(false);

    // Center logic
    const centerLat = userLocation?.lat || -26.3957; // Noosa default
    const centerLng = userLocation?.lng || 153.0905;

    // Max Ring = 15 mins walking (~1200m) for the edge
    // We want 15 min to be near the edge (say 90% or 100%)
    const MAX_RADIUS_M = 1200;

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        if (!MAPBOX_TOKEN) {
            alert("Mapbox Token Missing");
            return;
        }

        setIsSearching(true);
        try {
            // Geocode US -> AU preference
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=au&limit=1`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                onUpdateLocation({ lat, lng });
                setHasManuallySearched(true);
                // Don't clear query immediately so user sees what they searched
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
        onUpdateLocation(null); // Reset to GPS
        setHasManuallySearched(false);
        setSearchQuery("");
        setRotation(0);
        setZoom(1);
    };

    const mappedVenues = useMemo(() => {
        if (!venues.length) return [];

        // 1. Initial Calculation (Distance & Bearing)
        let points = venues.map(venue => {
            if (!venue.lat || !venue.lng) return null;

            const dist = getDist(centerLat, centerLng, Number(venue.lat), Number(venue.lng));
            const bearing = getBearing(centerLat, centerLng, Number(venue.lat), Number(venue.lng));

            // Non-Linear Scaling (Square Root-ish)
            // This spreads out the center (nearby stuff) and squashes the edge.
            // rRaw = 0..1
            let rRaw = dist / MAX_RADIUS_M;
            if (rRaw < 0.05) rRaw = 0.05; // clamp center

            // Apply Power Curve: r^0.6 -> Grows fast initially (spreads center), slows down later.
            let r = Math.pow(rRaw, 0.6);

            // Clamp far items visually so they don't fly off screen instantly,
            // but mark them as "far" if logic needs it.
            const isFar = dist > MAX_RADIUS_M * 1.5;

            return {
                ...venue,
                dist,
                originalBearing: bearing,
                bearing, // We will nudge this
                r,
                isFar
            };
        }).filter(v => v !== null && !v.isFar) as any[];

        // 2. Collision Avoidance (Iterative Nudging)
        // We want to push apart items that are visually too close.
        // "Visually close" depends on r and bearing difference.
        // Arc length ~ r * dTheta.

        const ITERATIONS = 10;
        const MIN_DIST_PCT = 0.12; // Min distance between items (as % of radius) ~ roughly icon size

        for (let i = 0; i < ITERATIONS; i++) {
            // Compare every pair
            for (let a = 0; a < points.length; a++) {
                for (let b = a + 1; b < points.length; b++) {
                    const pA = points[a];
                    const pB = points[b];

                    // Approximate polar distance
                    // dr = radial difference
                    const dr = pA.r - pB.r;

                    // da = angular difference (in radians for arc length calc)
                    let da = deg2rad(pA.bearing - pB.bearing);
                    // Handle wrap around -180/180
                    if (da > Math.PI) da -= 2 * Math.PI;
                    if (da < -Math.PI) da += 2 * Math.PI;

                    // Arc length distance along the "average" radius
                    const avgR = (pA.r + pB.r) / 2;
                    const arcLen = avgR * da;

                    // Euclidian-ish distance in normalized polar space
                    // Weight radial distance more (keep content in rings)
                    // Nudge angular distance easily.
                    const distSq = (dr * dr) + (arcLen * arcLen); // simplified

                    if (distSq < (MIN_DIST_PCT * MIN_DIST_PCT)) {
                        // Too close! Push apart angularly.
                        const overlap = MIN_DIST_PCT - Math.sqrt(distSq);

                        // Direction to push (angularly only to preserve rings)
                        const push = overlap * 1500 * (1 / (avgR + 0.1)); // Empirical tuning

                        if (da > 0) {
                            pA.bearing += push;
                            pB.bearing -= push;
                        } else {
                            pA.bearing -= push;
                            pB.bearing += push;
                        }
                    }
                }
            }
        }

        return points;
    }, [venues, centerLat, centerLng]);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center select-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]">

            {/* Cosmos Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-black to-black opacity-100" />
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen" />

            {/* Controls Overlay */}
            <div className="absolute bottom-28 md:bottom-32 left-0 right-0 z-50 flex flex-col items-center justify-center gap-4 pointer-events-none px-4">

                {/* Search Bar - Teleport */}
                <div className="flex items-center gap-2 pointer-events-auto w-full max-w-sm">
                    <div className="flex-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-2xl flex items-center pr-1 transition-all focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20">
                        <input
                            className="bg-transparent border-none text-white text-xs px-4 py-3 w-full focus:outline-none placeholder:text-white/30 font-mono"
                            placeholder="Teleport: e.g. Hastings St..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="p-2 bg-orange-600 rounded-full text-white hover:bg-orange-500 transition-colors disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Recenter Button */}
                    {hasManuallySearched && (
                        <button
                            onClick={handleRecenter}
                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-95"
                            title="Reset to my location"
                        >
                            <Crosshair className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Interaction Box (Zoom/Rotate) */}
                <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-auto">

                    {/* Rotation */}
                    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                        <button onClick={() => setRotation(r => r - 45)} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <span className="text-[10px] font-mono text-white/50 w-8 text-center">{Math.round(rotation)}°</span>
                        <button onClick={() => setRotation(r => r + 45)} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                            <RotateCw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className="text-[10px] font-mono text-white/50 w-8 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(4, z + 0.5))} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SOLAR SYSTEM CONTAINER --- */}
            {/* We rotate and scale this entire div */}
            <motion.div
                className="relative aspect-square w-full max-w-[800px] flex items-center justify-center p-12 md:p-0 cursor-grab active:cursor-grabbing"
                animate={{ scale: zoom, rotate: rotation }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                style={{ transformOrigin: 'center center' }}
                drag
                dragMomentum={false}
                onDragEnd={(e, info) => {
                    // Calculate Panning Delta
                    const dx = info.offset.x;
                    const dy = info.offset.y;

                    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return; // Ignore clicks

                    // We need to convert screen pixels -> meters -> lat/lng
                    // 1. Zoom factor: Higher zoom = fewer meters per pixel.
                    // At zoom 1, radius (400px typically) = MAX_RADIUS_M (1200m).
                    // So pixels per meter = (containerWidth / 2) / MAX_RADIUS_M * zoom
                    // OR meters per pixel = MAX_RADIUS_M / ((containerWidth / 2) * zoom)

                    // Let's approximate containerWidth as 800px (max-w) or just use the radius logic.
                    // Visual Radius = 50% of container.
                    // Let's assume container is roughly 800px on desktop, maybe 400px on mobile.
                    // A safe approximation for "Movement Feel" is:
                    // 1200m / (300px * zoom) = ~4 meters per pixel at zoom 1.

                    const metersPerPixel = MAX_RADIUS_M / (300 * zoom);

                    // 2. Rotation Compensation
                    // If rotated 90deg (bearing 90), "Up" (dy < 0) is actually "East".
                    // We need to rotate the movement vector [dx, dy] by -rotation.
                    const rotRad = deg2rad(-rotation);
                    const rx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
                    const ry = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

                    const dEastM = -rx * metersPerPixel;  // Drag Right -> Move Map Left -> Go East? Wait.
                    // Dragging MAP to Right means viewing West.
                    // So Delta Location is -Move.
                    const dNorthM = ry * metersPerPixel; // Drag Down -> Move Map Up -> Go North

                    // 3. Convert Meters to Lat/Lng
                    // 1 deg Lat ~= 111,320m
                    // 1 deg Lng ~= 111,320m * cos(lat)
                    const dLat = dNorthM / 111320;
                    const dLng = dEastM / (111320 * Math.cos(deg2rad(centerLat)));

                    // Update Location
                    onUpdateLocation({
                        lat: centerLat + dLat,
                        lng: centerLng + dLng
                    });
                    setHasManuallySearched(true);
                }}
            >

                {/* -- RINGS (Distances) -- */}
                {/* Based on MAX_RADIUS_M = 1200m (15 min) */}
                {/* Using Power Curve: r_visual = (dist / 1200)^0.6 */}

                {/* 15 min (1200m) -> 1.0^0.6 = 100% */}
                <div className="absolute w-[100%] h-[100%] rounded-full border border-dashed border-white/5" />

                {/* 10 min (800m) -> (800/1200)^0.6 = 0.66^0.6 = ~78% size */}
                <div className="absolute w-[78%] h-[78%] rounded-full border border-dashed border-white/5" />

                {/* 5 min (400m) -> (400/1200)^0.6 = 0.33^0.6 = ~51% size */}
                <div className="absolute w-[51%] h-[51%] rounded-full border border-dashed border-white/10" />

                {/* 2 min (160m) -> (160/1200)^0.6 = 0.133^0.6 = ~30% size */}
                <div className="absolute w-[30%] h-[30%] rounded-full border border-dotted border-white/20" />


                {/* Labels */}
                <div className="absolute top-[0%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-black tracking-widest text-white/20">15m</div>
                <div className="absolute top-[11%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-black tracking-widest text-white/20">10m</div>
                <div className="absolute top-[24.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-black tracking-widest text-white/25">5m</div>
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-black tracking-widest text-white/30">2m</div>


                {/* Radial Lines (Cardinal Directions) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-[1px] h-full bg-white" />
                    <div className="h-[1px] w-full bg-white" />
                </div>

                {/* -- PLANETS -- */}
                {mappedVenues.map((venue: any) => {
                    const angleRad = deg2rad(venue.bearing - 90);
                    const xPct = 50 + (venue.r * 50 * Math.cos(angleRad));
                    const yPct = 50 + (venue.r * 50 * Math.sin(angleRad));

                    const isMatch = venue.isMatch !== false;

                    // Name Trimming: Remove (...) content
                    const cleanName = venue.name.replace(/\s*\(.*?\)\s*/g, '').trim();

                    // Simple Category Icons (Lucide/Standard)
                    // We use these INSTEAD of images for now to be "clean & transparent"
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
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="relative flex flex-col items-center justify-center cursor-pointer"
                                onClick={() => {
                                    const town = venue.town_slug || 'noosa';
                                    router.push(`/venues/${town}/${venue.slug}`);
                                }}
                            >
                                {/* THE PLANET/STAR - Simple Transparent Emojis */}
                                <div className={cn(
                                    "transform transition-all duration-300 hover:scale-150 flex items-center justify-center drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] filter grayscale-[0.3] hover:grayscale-0",
                                )}>
                                    {PlanetIcon}
                                </div>

                                {/* LABEL */}
                                <div className="absolute top-full mt-1 whitespace-nowrap opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                                    <span className={cn(
                                        "px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-orange-200 shadow-black drop-shadow-md bg-black/40 rounded-sm border border-orange-500/10",
                                        isMatch ? "text-orange-100" : "text-gray-400"
                                    )}>
                                        {cleanName}
                                    </span>
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
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-[10px] text-white font-mono tracking-widest opacity-50 whitespace-nowrap">
                    {hasManuallySearched ? "SCOPED LOC" : "YOU"}
                </div>
            </div>

        </div>
    );
}
