'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Crosshair } from 'lucide-react';
import * as gtag from '@/lib/gtag';

// Ensure you set this in .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const NOOSA_COORDS: [number, number] = [153.0905, -26.3957]; // Lng, Lat

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
            if (venue.lng && venue.lat) {
                bounds.extend([Number(venue.lng), Number(venue.lat)]);
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
            let lngLat: [number, number];
            if (venue.lng && venue.lat) {
                lngLat = [Number(venue.lng), Number(venue.lat)];
            } else {
                return; // Skip if no coords
            }

            bounds.extend(lngLat);
            hasValidCoords = true;

            const el = document.createElement('div');
            el.className = 'marker';
            const icon = venue.icon || '🍽️';
            const isImg = icon.startsWith('/');
            const hasSpecial = !!venue.special;
            const isMatch = venue.isMatch !== false; // Default to true if not provided

            if (isMatch) {
                el.innerHTML = `
                    <div class="flex flex-col items-center">
                        <div class="bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-2 ${hasSpecial ? 'border-orange-500' : 'border-white'} text-3xl hover:scale-110 transition-all cursor-pointer overflow-hidden relative mb-1">
                            ${isImg ? `<img src="${icon}" class="w-full h-full object-cover" />` : icon}
                            ${hasSpecial ? '<div class="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>' : ''}
                        </div>
                        <div class="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <span class="text-[11px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">${venue.name}</span>
                        </div>
                    </div>
                `;
            } else {
                // Subtle "Context" Marker
                el.innerHTML = `
                    <div class="group flex flex-col items-center">
                        <div class="bg-gray-300 dark:bg-zinc-700 rounded-full w-3 h-3 shadow-sm border border-white hover:w-6 hover:h-6 hover:bg-white transition-all cursor-pointer overflow-hidden relative">
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-100 dark:border-zinc-800 shadow-sm mt-1 z-20 pointer-events-none">
                            <span class="text-[9px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">${venue.name}</span>
                        </div>
                    </div>
                `;
            }

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelectVenue(venue);
                gtag.event({
                    action: isMatch ? 'view_venue_detail_map_marker' : 'view_venue_context_marker',
                    category: 'discovery',
                    label: venue.name
                });
            });

            const marker = new mapboxgl.Marker(el)
                .setLngLat(lngLat)
                .addTo(map.current!);

            markers.current.push(marker);
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
