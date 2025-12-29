'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Crosshair } from 'lucide-react';

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
                zoom: userLocation ? 14 : 13,
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
                if (venues.length === 0) return;

                const bounds = new mapboxgl.LngLatBounds();
                let hasValidCoords = false;

                venues.forEach((venue) => {
                    let lngLat: [number, number];
                    if (venue.lng && venue.lat) {
                        lngLat = [Number(venue.lng), Number(venue.lat)];
                    } else {
                        const offsetLat = (Math.random() - 0.5) * 0.02;
                        const offsetLng = (Math.random() - 0.5) * 0.02;
                        lngLat = [NOOSA_COORDS[0] + offsetLng, NOOSA_COORDS[1] + offsetLat];
                    }

                    bounds.extend(lngLat);
                    hasValidCoords = true;

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

                if (!userLocation && hasValidCoords) {
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
