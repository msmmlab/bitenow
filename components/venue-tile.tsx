import { MapPin, Bell, Clock, Navigation, ChevronRight, Wine, Sparkles, Phone, ArrowRight, Car, PersonStanding, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export interface Venue {
    id: string;
    name: string;
    slug: string;
    category: string;
    icon: string;
    lat: number;
    lng: number;
    address: string;
    is_active: boolean;
    best_for?: string[];
    known_for_bullets?: string[];
    price_risk?: 'low' | 'medium' | 'high';
    walk_in_friendliness?: 'low' | 'medium' | 'high';
    service_speed?: 'fast' | 'medium' | 'slow';
    formality_level?: number;
    vibe_tags?: string[];
    booking_likely?: boolean;
    distance?: string;
    distanceValue?: number;
    isOpen?: boolean;
    town_slug?: string;
    specials_array?: any[]; // For the new    public_phone?: string;
    special?: {
        id: string;
        title: string;
        description: string;
        updated_at: string;
    } | null;
    system_sms_number?: string;
    venue_mobile_number?: string;
    google_place_id?: string;
    opening_hours_json?: {
        [key: string]: Array<{ open: string, close: string }>;
    };
}

interface VenueTileProps {
    venue: Venue;
    onClick: () => void;
    onNavigate: (e: React.MouseEvent) => void;
    onSuggest: (e: React.MouseEvent) => void;
    timeFilter: string;
    getVenueSignal: (venue: Venue, timeFilter: string) => string;
}

export default function VenueTile({
    venue,
    onClick,
    onNavigate,
    onSuggest,
    timeFilter,
    getVenueSignal
}: VenueTileProps) {
    const {
        name,
        category,
        icon,
        address,
        known_for_bullets = [],
        price_risk,
        walk_in_friendliness,
        service_speed,
        formality_level = 0,
        vibe_tags = [],
        booking_likely,
        special,
        best_for = []
    } = venue;

    // VARIANT SELECTION LOGIC
    let variant: 1 | 2 | 3 = 1;
    if (price_risk === 'high' || booking_likely === true || service_speed === 'slow') {
        variant = 2;
    } else if (vibe_tags.length > 0 || formality_level >= 2) {
        variant = 3;
    }

    // OPTIONAL VISUAL LABEL
    let pillLabel = null;
    if (price_risk === 'high') pillLabel = 'Premium';
    else if (service_speed === 'fast') pillLabel = 'Relaxed'; // As per prompt requirement
    else if (vibe_tags.includes('date')) pillLabel = 'Date night';
    else if (formality_level <= 1) pillLabel = 'Casual';

    // TRAVEL TIME CALCULATION
    const getTravelTimes = () => {
        if (!venue.distanceValue) return null;

        const distanceKm = venue.distanceValue;
        const walkingSpeed = 5; // km/h
        const drivingSpeed = 50; // km/h

        const walkMinutes = Math.round((distanceKm / walkingSpeed) * 60);
        const driveMinutes = Math.round((distanceKm / drivingSpeed) * 60);

        return { walkMinutes, driveMinutes };
    };

    const travelTimes = getTravelTimes();

    const renderBullets = (limit = 3) => {
        return known_for_bullets.slice(0, limit).map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[15px] text-gray-500 dark:text-zinc-400 leading-snug">
                <Image
                    src="/icon-monster.png"
                    alt=""
                    width={18}
                    height={18}
                    className="mt-0.5 shrink-0"
                />
                <span>{bullet}</span>
            </li>
        ));
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareText = `Hey! How about this place?`;
        // Generate deep link: /venues/town-slug/venue-slug
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const town = venue.town_slug || 'noosa';
        const shareUrl = `${origin}/venues/${town}/${venue.slug}`;

        if (navigator.share) {
            navigator.share({
                title: name,
                text: shareText,
                url: shareUrl,
            }).catch(console.error);
        } else {
            // Fallback: WhatsApp direct link
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    return (
        <div
            className="group relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-gray-100 dark:border-zinc-800 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col min-h-[480px] overflow-hidden"
        >
            {/* Visual Pill Label */}
            {pillLabel && (
                <div className="absolute top-6 left-6 z-10">
                    <span className="px-4 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[11px] font-black uppercase tracking-widest backdrop-blur-sm">
                        {pillLabel}
                    </span>
                </div>
            )}

            {/* Header Info: Logo and Name */}
            <div className="flex items-center gap-4 mt-10 mb-2">
                <div className="relative w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-3xl overflow-hidden border border-gray-100 dark:border-zinc-700 shrink-0 shadow-sm">
                    {icon && icon.startsWith('/') ? (
                        <Image src={icon} alt={name} fill className="object-cover" />
                    ) : (
                        <span>{icon || '🍽️'}</span>
                    )}
                </div>
                <div className="flex flex-col">
                    <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 leading-[1.1] pr-4">
                        {name}
                    </h3>

                    {/* Variant Header Text */}
                    <div className="mt-1 flex items-center gap-1">
                        {variant === 1 && (
                            <p className="text-sm font-bold text-gray-600 dark:text-zinc-400">Reliable choice today</p>
                        )}
                        {variant === 2 && (
                            <p className="text-sm font-bold text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                                Best for a planned dinner
                            </p>
                        )}
                        {variant === 3 && (
                            <p className="text-sm font-bold text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                                {(() => {
                                    // Smart tag selection
                                    let displayTag = best_for[0];
                                    const lowerFilter = timeFilter.toLowerCase();

                                    if (lowerFilter === 'tonight' || lowerFilter === 'later') {
                                        const dinnerTag = best_for.find(t => ['dinner', 'date', 'drinks', 'cocktails', 'late'].some(k => t.toLowerCase().includes(k)));
                                        if (dinnerTag) displayTag = dinnerTag;
                                    } else if (lowerFilter === 'now') {
                                        // If it's evening hours (after 5pm), prioritize dinner/drinks
                                        const hour = new Date().getHours();
                                        if (hour >= 17) {
                                            const eveningTag = best_for.find(t => ['dinner', 'date', 'drinks', 'cocktails'].some(k => t.toLowerCase().includes(k)));
                                            if (eveningTag) displayTag = eveningTag;
                                        }
                                    }

                                    return `Great for ${displayTag}`;
                                })()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Line: Travel Times or Category */}
            <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-zinc-500 mt-2">
                {variant === 3 && travelTimes ? (
                    <>
                        <div className="flex items-center gap-1.5">
                            <PersonStanding className="w-4 h-4" />
                            <span className="font-medium">{travelTimes.walkMinutes}min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Car className="w-4 h-4" />
                            <span className="font-medium">{travelTimes.driveMinutes}min</span>
                        </div>
                    </>
                ) : (
                    <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-medium">
                            {category} {variant === 2 && address && ` • ${address}`}
                        </span>
                    </>
                )}
            </div>

            {/* Availability/Signal */}
            <div className={cn(
                "flex items-center gap-2 mt-2 text-sm font-bold",
                venue.isOpen ? "text-green-600 dark:text-green-500" : "text-orange-600 dark:text-orange-500"
            )}>
                <span className={cn(
                    "w-2 h-2 rounded-full",
                    venue.isOpen ? "bg-green-500 animate-pulse" : "bg-orange-500"
                )} />
                <span>{getVenueSignal(venue, timeFilter)}</span>
            </div>

            {/* Body Content */}
            <div className="mt-6 flex-grow">
                {special ? (
                    <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 rounded-2xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Special Today</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{special.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">{special.description}</p>
                    </div>
                ) : null}

                {variant === 3 ? (
                    <ul className="space-y-3">
                        {known_for_bullets.slice(0, 2).map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <Image
                                    src="/icon-monster.png"
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="mt-0.5 shrink-0"
                                />
                                <span className="text-xl font-serif font-semibold text-gray-800 dark:text-zinc-200 leading-relaxed">
                                    {bullet}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="space-y-3">
                        {renderBullets(3)}
                    </ul>
                )}
            </div>

            {/* Expectation / Confidence Footer */}
            <div className="mt-4 mb-6">
                {variant === 2 ? (
                    <div className="bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100/30 dark:border-orange-900/20 rounded-2xl p-4 flex flex-col gap-2">
                        {booking_likely && (
                            <div className="flex items-center gap-2 text-sm font-bold text-orange-800 dark:text-orange-300">
                                <Bell className="w-4 h-4" />
                                <span>Booking recommended</span>
                            </div>
                        )}
                        {service_speed === 'slow' && (
                            <div className="flex items-center gap-2 text-sm text-orange-700/70 dark:text-orange-400/70">
                                <Clock className="w-4 h-4" />
                                <span>Slower service • Designed to be enjoyed</span>
                            </div>
                        )}
                        {price_risk === 'high' && (
                            <p className="text-xs font-black uppercase tracking-widest text-orange-600/60 ml-6">Premium experience</p>
                        )}
                    </div>
                ) : variant === 1 ? (
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50 dark:border-zinc-800/50">
                        {(walk_in_friendliness === 'high' || walk_in_friendliness === 'medium') && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{walk_in_friendliness === 'high' ? 'Walk-ins welcome' : 'Walk-ins usually fine'}</span>
                            </div>
                        )}
                        {(service_speed === 'fast' || service_speed === 'medium') && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                <Navigation className="w-3.5 h-3.5" />
                                <span>{service_speed === 'fast' ? 'Quick service' : 'Relaxed pace'}</span>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={onNavigate}
                    className="w-full flex items-center justify-center gap-3 bg-black text-white dark:bg-white dark:text-black py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all"
                >
                    <Navigation className="w-4 h-4" />
                    Navigate There
                </button>

                <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-3 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border border-gray-200/50 dark:border-zinc-700/50 hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
                >
                    <Share2 className="w-4 h-4" />
                    Take your friends
                </button>

                {variant === 2 && (
                    <button className="flex items-center justify-center gap-1 py-1 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        Good to know <ArrowRight className="w-4 h-4" />
                    </button>
                )}

                <button
                    onClick={onSuggest}
                    className="w-full text-center text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2 group-hover:translate-x-1 transition-all flex items-center justify-center gap-1"
                >
                    Own this place? <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
