'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Ensure you set this in .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const NOOSA_COORDS: [number, number] = [153.0905, -26.3957]; // Lng, Lat

interface MapViewProps {
    specials: any[];
}

export default function MapView({ specials }: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return; // initialize once
        if (!MAPBOX_TOKEN) {
            setError("Mapbox token missing");
            return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12', // or light-v11
                center: NOOSA_COORDS,
                zoom: 13,
            });

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
            map.current.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: { enableHighAccuracy: true },
                    trackUserLocation: true,
                    showUserHeading: true,
                })
            );

            // Add markers
            map.current.on('load', () => {
                specials.forEach((special) => {
                    // If we have coordinates passed
                    let lngLat: [number, number] = NOOSA_COORDS;
                    if (special.coordinates && special.coordinates.length === 2 && special.coordinates[0] !== null) {
                        lngLat = special.coordinates;
                    } else {
                        // Fallback offset
                        const offsetLat = (Math.random() - 0.5) * 0.02;
                        const offsetLng = (Math.random() - 0.5) * 0.02;
                        lngLat = [NOOSA_COORDS[0] + offsetLng, NOOSA_COORDS[1] + offsetLat];
                    }

                    // Create a DOM element for the marker
                    const el = document.createElement('div');
                    el.className = 'marker';
                    const icon = special.icon || '🍽️';
                    el.innerHTML = `<div class="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white text-3xl hover:scale-110 transition-transform cursor-pointer transform -translate-y-1/2">${icon}</div>`;

                    // Fun, colorful popup
                    const popupHTML = `
                        <div class="font-sans w-[280px] filter drop-shadow-2xl hover:z-50">
                            <!-- Header / Badge -->
                            <div class="bg-black text-white px-4 py-2 text-center rounded-t-xl relative z-10">
                                <span class="text-xs font-black uppercase tracking-[0.2em] text-yellow-400 animate-pulse">Running Now</span>
                            </div>
                            
                            <!-- Main Card -->
                            <div class="bg-white rounded-b-xl overflow-hidden flex flex-col min-h-[320px] relative border-b-8 border-yellow-400">
                                
                                <!-- Decorative BG Pattern (CSS) -->
                                <div class="absolute inset-0 bg-yellow-50 opacity-50 z-0"></div>

                                <div class="relative z-10 p-5 flex flex-col h-full">
                                    
                                    <!-- Venue -->
                                    <div class="flex items-center justify-center gap-2 mb-4 opacity-80">
                                        <span class="text-xl">${icon}</span>
                                        <span class="font-extrabold text-sm uppercase tracking-wide text-gray-400">${special.venue}</span>
                                    </div>

                                    <!-- THE DEAL (Big Typography) -->
                                    <div class="mb-4 text-center">
                                        <h3 class="font-black text-3xl leading-[0.95] text-gray-900 tracking-tight transform -rotate-1 mb-2">
                                            ${special.title}
                                        </h3>
                                        <div class="h-1 w-20 bg-yellow-400 mx-auto rounded-full"></div>
                                    </div>

                                    <!-- Description -->
                                    <p class="text-gray-600 font-medium text-center leading-relaxed mb-auto text-sm">
                                        ${special.description}
                                    </p>

                                    <!-- Time / CTA Footer -->
                                    <div class="mt-4 pt-4 border-t border-dashed border-gray-200 text-center">
                                        <div class="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-yellow-200">
                                            ⏰ Valid Today
                                        </div>
                                        <div class="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                            Tap to Navigate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '300px', className: 'custom-popup' })
                        .setHTML(popupHTML);

                    new mapboxgl.Marker(el)
                        .setLngLat(lngLat)
                        .setPopup(popup)
                        .addTo(map.current!);
                });
            });

        } catch (err) {
            console.error("Map error", err);
            setError("Could not load map");
        }

        return () => {
            // Cleanup usually not needed closely for single page app effectively
        };
    }, [specials]);

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

    return <div ref={mapContainer} className="w-full h-full" />;
}
