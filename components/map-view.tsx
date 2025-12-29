'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Ensure you set this in .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const NOOSA_COORDS: [number, number] = [153.0905, -26.3957]; // Lng, Lat

interface MapViewProps {
    specials: any[];
    onSelectSpecial: (special: any) => void;
}

export default function MapView({ specials, onSelectSpecial }: MapViewProps) {
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

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
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

            map.current.on('load', () => {
                specials.forEach((special) => {
                    let lngLat: [number, number] = NOOSA_COORDS;
                    if (special.coordinates && special.coordinates.length === 2 && special.coordinates[0] !== null) {
                        lngLat = special.coordinates;
                    } else {
                        const offsetLat = (Math.random() - 0.5) * 0.02;
                        const offsetLng = (Math.random() - 0.5) * 0.02;
                        lngLat = [NOOSA_COORDS[0] + offsetLng, NOOSA_COORDS[1] + offsetLat];
                    }

                    // Marker Element
                    const el = document.createElement('div');
                    el.className = 'marker';
                    const icon = special.icon || '🍽️';
                    el.innerHTML = `<div class="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white text-3xl hover:scale-110 transition-transform cursor-pointer transform -translate-y-1/2">${icon}</div>`;

                    // Click Listener -> Set React State
                    el.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent map click
                        onSelectSpecial(special);

                        // Optional: Pan to marker
                    });

                    new mapboxgl.Marker(el)
                        .setLngLat(lngLat)
                        .addTo(map.current!);
                });
            });

            // Close modal on map click
            map.current.on('click', () => {
                onSelectSpecial(null);
            });

        } catch (err) {
            console.error("Map error", err);
            setError("Could not load map");
        }

    }, [specials, onSelectSpecial]);

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
