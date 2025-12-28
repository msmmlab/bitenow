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
    const [selectedSpecial, setSelectedSpecial] = useState<any | null>(null);
    const [showNavOptions, setShowNavOptions] = useState(false);

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
                        setSelectedSpecial(special);
                        setShowNavOptions(false); // Reset nav choice

                        // Optional: Pan to marker
                        map.current?.flyTo({ center: lngLat, zoom: 14, offset: [0, 100] }); // Offset vertically so pin is visible below modal if needed, or just center
                    });

                    new mapboxgl.Marker(el)
                        .setLngLat(lngLat)
                        .addTo(map.current!);
                });
            });

            // Close modal on map click
            map.current.on('click', () => {
                setSelectedSpecial(null);
            });

        } catch (err) {
            console.error("Map error", err);
            setError("Could not load map");
        }

    }, [specials]);

    const handleNavigate = (type: 'google' | 'apple') => {
        if (!selectedSpecial) return;
        const [lng, lat] = selectedSpecial.coordinates;
        const url = type === 'google'
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : `http://maps.apple.com/?daddr=${lat},${lng}`;
        window.open(url, '_blank');
    };

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

            {/* FIXED OVERLAY MODAL */}
            {selectedSpecial && (
                <div className="absolute top-[5px] left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-sm">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border border-gray-100 flex flex-col max-h-[80vh] animate-in slide-in-from-top-4 duration-300">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedSpecial(null)}
                            className="absolute top-2 right-2 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        {/* Header / Badge */}
                        <div className="bg-black text-white px-4 py-2 text-center relative z-10 shrink-0">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400 animate-pulse">Running Now</span>
                        </div>

                        {/* Content Scrollable if needed */}
                        <div className="overflow-y-auto">
                            <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 p-4 relative text-white text-center pb-8 rounded-b-[2rem]">
                                <div className="text-6xl mb-2">{selectedSpecial.icon}</div>
                                <h2 className="font-extrabold text-2xl leading-none drop-shadow-md">{selectedSpecial.venue}</h2>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{selectedSpecial.category}</p>
                            </div>

                            <div className="px-5 -mt-6 relative z-10">
                                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 text-center">
                                    <h3 className="font-black text-2xl text-gray-900 leading-tight mb-2 tracking-tight">
                                        {selectedSpecial.title}
                                    </h3>
                                    <div className="h-1 w-16 bg-yellow-400 mx-auto rounded-full mb-3"></div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {selectedSpecial.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-gray-50 flex flex-col gap-2 shrink-0 border-t border-gray-100 mt-2">
                            {!showNavOptions ? (
                                <button
                                    onClick={() => setShowNavOptions(true)}
                                    className="w-full bg-black text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <span>📍</span> Navigate There
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                                    <button
                                        onClick={() => handleNavigate('apple')}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        🍎 Apple Maps
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('google')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        G Google Maps
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
