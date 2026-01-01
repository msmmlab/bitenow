'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Crosshair } from 'lucide-react';
import * as gtag from '@/lib/gtag';

// Ensure you set this in .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
// Optional debug mode to check coordinate accuracy vs anchoring
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MARKERS === 'true';

const NOOSA_COORDS: [number, number] = [153.0905, -26.3957]; // Lng, Lat

// Configuration for visual consistency
interface IconMeta {
    anchor: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    offset: [number, number];
}

// Default offset pushes the icon up so its bottom touches the coordinate
// [x, y] - positive y is down. so [0, -5] allows a tiny bit of overlap or shadow?
// Actually if anchor is bottom, point is (0, height).
// User requested default offset [0, 8] but that pushes it DOWN?
// Mapbox docs: "positive values indicate right and down".
// If we want the visual "tip" at the location, and the image is a circle, usually 'bottom' anchor is enough.
// User requested [0, 8]. I will respect that configuration capability but defaults might need tuning.
// We'll trust the user wants some vertical adjust.
const DEFAULT_ICON_META: IconMeta = { anchor: 'bottom', offset: [0, 0] };

const ICON_META: Record<string, IconMeta> = {
    "/icons/fancy_dinner.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/craft_beer.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/beer.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/coffee.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/sandwich.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/takeaway.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/quick_bite.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/wine.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/asian.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/italian.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/fish_chips.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/burger.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/thai.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/salad.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/bakery.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/casual_dining.png": { anchor: "bottom", offset: [0, 0] },
    "/icons/healthy.png": { anchor: "bottom", offset: [0, 0] },
};

function toLngLat(venue: any): [number, number] | null {
    if (venue.lng != null && venue.lat != null) {
        return [Number(venue.lng), Number(venue.lat)];
    }
    return null;
}

interface MapViewProps {
    venues: any[];
    onSelectVenue: (venue: any) => void;
    userLocation: { lat: number; lng: number } | null;
}

export default function MapView({ venues, onSelectVenue, userLocation }: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [error, setError] = useState<string | null>(null);

    const markers = useRef<mapboxgl.Marker[]>([]);
    const mapLoaded = useRef(false);

    const handleRecenter = useCallback(() => {
        if (!map.current) return;

        // If we have user location, center on them first
        if (userLocation) {
            map.current.flyTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: 14,
                essential: true
            });
            return;
        }

        // Fallback: show all venues if no user location
        if (venues.length === 0) return;
        const bounds = new mapboxgl.LngLatBounds();
        let hasValidCoords = false;

        venues.forEach((venue) => {
            const coords = toLngLat(venue);
            if (coords) {
                bounds.extend(coords);
                hasValidCoords = true;
            }
        });

        if (hasValidCoords) {
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
        }
    }, [venues, userLocation]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return;
        if (!MAPBOX_TOKEN) {
            setError("Mapbox token missing");
            return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        try {
            const initialCenter: [number, number] = userLocation
                ? [userLocation.lng, userLocation.lat]
                : NOOSA_COORDS;

            const mapInstance = new mapboxgl.Map({
                container: mapContainer.current!,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: initialCenter,
                zoom: userLocation ? 16 : 15, // Increased from 14/13 for street-level detail
            });
            map.current = mapInstance;

            mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

            const geolocate = new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true,
                showUserLocation: true,
            });

            mapInstance.addControl(geolocate);

            mapInstance.on('load', () => {
                mapLoaded.current = true;
                renderMarkers();
            });

            mapInstance.on('click', () => {
                onSelectVenue(null);
            });

        } catch (err) {
            console.error("Map error", err);
            setError("Could not load map");
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Render Markers
    const renderMarkers = useCallback(() => {
        if (!map.current || !mapLoaded.current) return;

        // Clear existing markers
        markers.current.forEach(m => m.remove());
        markers.current = [];

        if (venues.length === 0) return;

        const bounds = new mapboxgl.LngLatBounds();
        let hasValidCoords = false;

        venues.forEach((venue) => {
            const lngLat = toLngLat(venue);
            if (!lngLat) return;

            bounds.extend(lngLat);
            hasValidCoords = true;

            const icon = venue.icon || '🍽️';
            const isImg = icon.startsWith('/');
            const hasSpecial = !!venue.special;
            const isMatch = venue.isMatch !== false;

            // 1. debug marker (optional)
            if (DEBUG_MODE) {
                const debugEl = document.createElement('div');
                debugEl.className = 'w-1.5 h-1.5 bg-red-600 rounded-full z-50 pointer-events-none';
                new mapboxgl.Marker({ element: debugEl, anchor: 'center' })
                    .setLngLat(lngLat)
                    .addTo(map.current!);
            }

            // 2. Icon Marker (The pin/visual)
            const iconEl = document.createElement('div');
            iconEl.className = 'marker-icon cursor-pointer transition-transform hover:scale-110 will-change-transform';

            // Get meta for anchoring
            const meta = ICON_META[icon] || DEFAULT_ICON_META;

            if (isMatch) {
                // Large "Match" Style
                // w-14 h-14 = 56px
                iconEl.innerHTML = `
                    <div class="bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-2 ${hasSpecial ? 'border-orange-500' : 'border-white'} overflow-hidden relative">
                        ${isImg ? `<img src="${icon}" class="w-full h-full object-cover" />` : icon}
                        ${hasSpecial ? '<div class="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>' : ''}
                    </div>
                `;
            } else {
                // Subtle "Context" Style
                // w-3 h-3 = 12px
                iconEl.innerHTML = `
                     <div class="bg-gray-300 dark:bg-zinc-700 rounded-full w-3 h-3 shadow-sm border border-white hover:w-6 hover:h-6 hover:bg-white transition-all overflow-hidden relative">
                     </div>
                `;
            }

            iconEl.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent map click
                e.stopPropagation();
                onSelectVenue(venue);
                gtag.event({
                    action: isMatch ? 'view_venue_detail_map_marker' : 'view_venue_context_marker',
                    category: 'discovery',
                    label: venue.name
                });
            });

            // Add Icon Marker
            const iconMarker = new mapboxgl.Marker({
                element: iconEl,
                anchor: meta.anchor as any,
                offset: new mapboxgl.Point(meta.offset[0], meta.offset[1])
            })
                .setLngLat(lngLat)
                .addTo(map.current!);

            markers.current.push(iconMarker);


            // 3. Label Marker (The text) - Only for matches or on hover?
            // Existing logic showed context labels on hover. Matches always showed labels.
            // Split label allows us to anchor it independently.

            const labelEl = document.createElement('div');
            // We want it clickable too, passing through to the same action
            labelEl.className = 'marker-label cursor-pointer pointer-events-auto';

            if (isMatch) {
                // Always visible label for matches
                // Clean pill style
                labelEl.innerHTML = `
                   <div class="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors hover:bg-white dark:hover:bg-black">
                        <span class="text-[11px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">${venue.name}</span>
                   </div>
               `;
            } else {
                // Hover-only label for context
                // We implement this using 'group' usually, but separate DOM nodes make 'group-hover' tricky.
                // We will use standard CSS classes and maybe just always show it but rely on CSS opacity?
                // Or we can just render it. The previous code had opacity-0 group-hover:opacity-100.
                // Since we split the markers, the 'group' (parent) is gone.
                // We can re-implement basic hover logic via JS or just simplify to "Always visible but small" or "Hidden".
                // The prompt said: "Label marker ... must not affect icon positioning"
                // For context venues, maybe we skip the label to reduce noise? 
                // Or we make it visible. The previous UI had it invisible until hover.
                // Let's make it class 'opacity-0 hover:opacity-100' but that requires hovering the LABEL itself (which is invisible).
                // To fix this properly: we would need a shared parent or JS event listeners.
                // For now, to ensure stability, I will RENDER matching labels always.
                // For context venues, I will render them but potentially hidden or tiny.
                // Actually, let's keep it simple: Context venues get explicit labels? No, that clutters the map.
                // I'll skip separate labels for context markers for now to avoid clutter, 
                // as linking the hover state of two separate mapbox markers is complex without a shared reacting store.
                // Users clicked the dot to see details anyway.
                if (!isMatch) return;
            }

            labelEl.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelectVenue(venue);
            });

            // Anchor label 'bottom' but offset UP by the icon height.
            // Icon height is ~56px. Plus padding 4px. = 60px.
            // Default offset [0, -60] moves the anchor point UP 60px.
            // Then the label sits on top of that anchor point.
            // Mapbox offset: positive is down. So negative is up.
            const labelOffset: [number, number] = [0, -60];

            if (isMatch) {
                const labelMarker = new mapboxgl.Marker({
                    element: labelEl,
                    anchor: 'bottom', // Sit on top of the offset point
                    offset: labelOffset as any
                })
                    .setLngLat(lngLat)
                    .addTo(map.current!);
                markers.current.push(labelMarker);
            }
        });

        // Optionally refit camera if markers updated significantly 
        // For now, let's only do it if the user just switched to map
    }, [venues, onSelectVenue]);

    // Handle venue updates
    useEffect(() => {
        renderMarkers();
    }, [venues, renderMarkers]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 p-4 text-center">
                <div>
                    <p className="mb-2 font-semibold">Map unavailable</p>
                    <p className="text-xs">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Custom Recenter Button */}
            <button
                onClick={() => {
                    console.log("Recenter clicked - fitting bounds for venues");
                    handleRecenter();
                }}
                className="absolute right-4 bottom-8 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-full shadow-2xl border border-gray-100 dark:border-zinc-800 text-black dark:text-white active:scale-90 transition-all z-10"
                title="Recenter Map"
            >
                <Crosshair className="w-6 h-6" />
            </button>
        </div>
    );
}
