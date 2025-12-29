'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Clock, Timer, Car, Footprints, Share2, Tag, Music, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SpecialModalProps {
    special: any | null; // This is now a Venue object
    onClose: () => void;
    userLocation: { lat: number, lng: number } | null;
}

export default function SpecialModal({ special, onClose, userLocation }: SpecialModalProps) {
    const [showNavOptions, setShowNavOptions] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // Travel Times (Mocked for MVP based on random proximity to "user")
    const [travelTime, setTravelTime] = useState<{ walk: number, drive: number } | null>(null);

    const calculateDistances = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;

        // Walk: 5km/h, Drive: 50km/h (standard average)
        const walk = Math.round((dist / 5) * 60);
        const drive = Math.round((dist / 50) * 60);

        return { walk, drive: Math.max(drive, 1) };
    };

    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

        if (special && userLocation) {
            const venueLat = special.lat;
            const venueLng = special.lng;
            const times = calculateDistances(userLocation.lat, userLocation.lng, venueLat, venueLng);
            setTravelTime(times);
        } else if (special) {
            // Fallback if no user location is available yet
            setTravelTime(null);
        }
    }, [special, userLocation]);

    if (!special) return null;

    const handleNavigate = (type: 'google' | 'apple') => {
        const lat = special.lat;
        const lng = special.lng;
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

    // Normalize data
    const venue = special;
    const icon = venue.icon || '🍽️';
    const venueName = venue.name;
    const category = venue.category;
    const hasSpecial = !!venue.special;

    // Fallback activation phone
    const activationPhone = venue.activation_phone || process.env.NEXT_PUBLIC_ACTIVATION_PHONE || '+61 400 000 000';

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
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                        {hasSpecial ? 'ON NOW' : 'NOT LISTED'}
                    </span>
                </div>

                {/* Content Scrollable */}
                <div className="overflow-y-auto no-scrollbar">
                    {/* Hero Section */}
                    <div className={cn(
                        "p-6 relative text-white text-center pb-10 rounded-b-[2.5rem]",
                        hasSpecial
                            ? "bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400"
                            : "bg-gradient-to-br from-gray-500 to-gray-400"
                    )}>
                        <div className="text-6xl mb-3 drop-shadow-md flex justify-center">
                            {icon && icon.startsWith('/') ? (
                                <img src={icon} alt={venueName} className="w-20 h-20 object-contain" />
                            ) : (
                                icon
                            )}
                        </div>
                        <h2 className="font-extrabold text-3xl leading-none drop-shadow-md mb-1 text-center">{venueName}</h2>
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
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-left space-y-4">
                            {hasSpecial ? (
                                <>
                                    {/* Structured Deal Info */}
                                    <div className="flex items-start gap-3">
                                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg shrink-0">
                                            <Tag className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-gray-900 leading-tight tracking-tight">
                                                {venue.special.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pl-1">
                                        <div className="flex items-center gap-3 text-gray-700 font-semibold text-sm">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>Today • 4–6pm</span>
                                        </div>

                                        <div className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                                            <Info className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                                            <span>{venue.special.description || 'Flash deal - strictly limited time!'}</span>
                                        </div>

                                        <div className="flex items-center gap-3 text-gray-400 text-xs pt-1">
                                            <Timer className="w-3.5 h-3.5" />
                                            <span>Updated 2h ago</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-2">
                                    <h3 className="font-black text-xl text-gray-400 leading-tight italic mb-2">
                                        Awaiting today&apos;s specials
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Check back later — venues can update their specials daily.
                                    </p>
                                    {venue.recommended_for && (
                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl text-left border border-gray-100 dark:border-zinc-800">
                                            <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                                                <span className="font-bold text-gray-700 dark:text-zinc-300">Known for</span> {venue.recommended_for}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-gray-50">
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 text-left border border-yellow-100 dark:border-yellow-900/30">
                                            <h4 className="font-black text-[10px] text-yellow-700 dark:text-yellow-500 uppercase tracking-[0.2em] mb-3">Own this place?</h4>
                                            <p className="text-sm text-yellow-900 dark:text-yellow-400 font-bold leading-tight mb-2">
                                                Activate specials
                                            </p>
                                            <p className="text-xs text-yellow-800 dark:text-yellow-500/80 leading-relaxed mb-4">
                                                Text your lunch special or a photo of today&apos;s specials board. <span className="font-black text-yellow-900 dark:text-yellow-400">No login required.</span>
                                            </p>

                                            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mb-4 font-mono text-sm border border-yellow-200/50">
                                                <span className="text-xs text-yellow-600 block mb-1">Text to:</span>
                                                <span className="font-black text-lg text-yellow-900 dark:text-yellow-400 break-all">{activationPhone}</span>
                                            </div>

                                            <div className="space-y-2 opacity-80">
                                                <p className="text-[10px] text-yellow-700 italic">Example: &quot;$15 lunch schnitzel 12–3&quot;</p>
                                                <p className="text-[10px] text-yellow-700 italic">Example: &quot;2-for-1 Aperol Spritz 4–6&quot;</p>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-yellow-200/30 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                                                <p className="text-[10px] font-bold text-yellow-800 dark:text-yellow-600">
                                                    We&apos;ll turn it into a deal card automatically.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 flex flex-col gap-3 shrink-0 border-t border-gray-100 mt-auto">
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

                    <button className="flex items-center justify-center gap-2 text-gray-500 hover:text-black transition-colors text-sm font-bold py-1">
                        <Share2 className="w-4 h-4" />
                        <span>Share this deal</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
