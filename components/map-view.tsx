'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Ensure you set this in .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const NOOSA_COORDS: [number, number] = [153.0905, -26.3957]; // Lng, Lat

interface MapViewProps {
    venues: any[];
    onSelectVenue: (venue: any) => void;
}

export default function MapView({ venues, onSelectVenue }: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return;
        if (!MAPBOX_TOKEN) {
            setError("Mapbox token missing");
            return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        console.log("MapView: Initializing with venues:", venues.length);

        try {
            const mapInstance = new mapboxgl.Map({
                container: mapContainer.current!,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: NOOSA_COORDS,
                zoom: 13,
            });
            map.current = mapInstance;

            mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
            mapInstance.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: { enableHighAccuracy: true },
                    trackUserLocation: true,
                    showUserHeading: true,
                })
            );

            mapInstance.on('load', () => {
                console.log("MapView: Map loaded, adding markers");
                if (venues.length === 0) return;

                const bounds = new mapboxgl.LngLatBounds();
                let hasValidCoords = false;

                venues.forEach((venue) => {
                    let lngLat: [number, number];
                    if (venue.lng && venue.lat) {
                        lngLat = [Number(venue.lng), Number(venue.lat)];
                    } else {
                        // Fallback to jittered Noosa center
                        const offsetLat = (Math.random() - 0.5) * 0.02;
                        const offsetLng = (Math.random() - 0.5) * 0.02;
                        lngLat = [NOOSA_COORDS[0] + offsetLng, NOOSA_COORDS[1] + offsetLat];
                    }

                    bounds.extend(lngLat);
                    hasValidCoords = true;

                    // Marker Element
                    const el = document.createElement('div');
                    el.className = 'marker';
                    const icon = venue.icon || '🍽️';
                    const isImg = icon.startsWith('/');
                    el.innerHTML = `
                        <div class="bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-2 border-white text-3xl hover:scale-110 transition-transform cursor-pointer transform -translate-y-1/2 overflow-hidden">
                            ${isImg ? `<img src="${icon}" class="w-full h-full object-cover" />` : icon}
                        </div>
                    `;

                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        onSelectVenue(venue);
                    });

                    new mapboxgl.Marker(el)
                        .setLngLat(lngLat)
                        .addTo(mapInstance);
                });

                if (hasValidCoords && venues.length > 1) {
                    mapInstance.fitBounds(bounds, { padding: 80, maxZoom: 15 });
                }
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

    }, [venues, onSelectVenue]);

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
        </div>
    );
}
