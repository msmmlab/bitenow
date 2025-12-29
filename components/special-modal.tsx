'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Clock, Timer, Car, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SpecialModalProps {
    special: any | null;
    onClose: () => void;
}

export default function SpecialModal({ special, onClose }: SpecialModalProps) {
    const [showNavOptions, setShowNavOptions] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // Travel Times (Mocked for MVP based on random proximity to "user")
    const [travelTime, setTravelTime] = useState<{ walk: number, drive: number } | null>(null);

    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

        if (special) {
            // Mock travel time calculation
            // Base walk: 5-20 mins
            // Base drive: 2-8 mins
            const walk = Math.floor(Math.random() * 15) + 5;
            const drive = Math.floor(walk / 3) + 1;
            setTravelTime({ walk, drive });
        }
    }, [special]);

    if (!special) return null;

    const handleNavigate = (type: 'google' | 'apple') => {
        const [lng, lat] = special.restaurant ? [special.restaurant.lng, special.restaurant.lat] : special.coordinates;
        const url = type === 'google'
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : `http://maps.apple.com/?daddr=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const handleMainNavigate = () => {
        if (isIOS) {
            setShowNavOptions(true);
        } else {
            handleNavigate('google');
        }
    };

    // Normalize data (handle both raw Supabase data and Mapbox formatted data)
    const icon = special.restaurant?.icon || special.icon || '🍽️';
    const venueName = special.restaurant?.name || special.venue;
    const category = special.restaurant?.category || special.category;
    const title = special.title;
    const description = special.description;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border border-gray-100 flex flex-col w-full max-w-sm max-h-[85vh] relative z-10 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header / Badge */}
                <div className="bg-black text-white px-4 py-2 text-center relative z-10 shrink-0">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400 animate-pulse">Running Now</span>
                </div>

                {/* Content Scrollable */}
                <div className="overflow-y-auto no-scrollbar">
                    {/* Hero Section */}
                    <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 p-6 relative text-white text-center pb-10 rounded-b-[2.5rem]">
                        <div className="text-6xl mb-3 drop-shadow-md">{icon}</div>
                        <h2 className="font-extrabold text-3xl leading-none drop-shadow-md mb-1">{venueName}</h2>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-90">{category}</p>

                        {/* Travel Time Badge */}
                        {travelTime && (
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <div className="bg-black/20 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 border border-white/10">
                                    <Footprints className="w-3 h-3 text-white" />
                                    <span className="text-xs font-bold">{travelTime.walk} min</span>
                                </div>
                                <div className="bg-black/20 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 border border-white/10">
                                    <Car className="w-3 h-3 text-white" />
                                    <span className="text-xs font-bold">{travelTime.drive} min</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deal Details */}
                    <div className="px-5 -mt-8 relative z-10 pb-4">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center">
                            <h3 className="font-black text-2xl text-gray-900 leading-tight mb-3 tracking-tight">
                                {title}
                            </h3>
                            <div className="h-1.5 w-16 bg-yellow-400 mx-auto rounded-full mb-4"></div>
                            <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 flex flex-col gap-2 shrink-0 border-t border-gray-100 mt-auto">
                    {!showNavOptions ? (
                        <button
                            onClick={handleMainNavigate}
                            className="w-full bg-black text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Navigation className="w-4 h-4" />
                            <span>Navigate There</span>
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                            <button
                                onClick={() => handleNavigate('apple')}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <span>🍎 Maps</span>
                            </button>
                            <button
                                onClick={() => handleNavigate('google')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <span>G Maps</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
