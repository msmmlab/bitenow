
import { createClient } from '@supabase/supabase-js';
import { MapPin, Clock, Navigation, Share2, Sparkles, Phone, ArrowLeft, Star, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// Supabase client (Server Side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
    params: Promise<{
        town: string;
        slug: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
    const { data: venues } = await supabase
        .from('restaurants')
        .select('town_slug, slug');

    return venues?.map((v) => ({
        town: v.town_slug || 'noosa',
        slug: v.slug,
    })) || [];
}

async function getVenue(slug: string) {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) return null;
    return data;
}

export default async function VenuePage(props: Props) {
    const resolvedParams = await props.params;
    const searchParams = await props.searchParams;
    const venue = await getVenue(resolvedParams.slug);

    const from = searchParams.from as string;
    const q = searchParams.q as string;
    const backHref = from === 'radar' ? `/?view=radar${q ? `&q=${encodeURIComponent(q)}` : ''}` : '/';
    const backText = from === 'radar' ? 'Back to Radar' : 'Back to feed';

    if (!venue) {
        notFound();
    }

    const {
        name,
        category,
        icon,
        address,
        known_for_bullets = [],
        price_risk,
        walk_in_friendliness,
        service_speed,
        vibe_tags = [],
        booking_likely,
        specials = [],
        opening_hours_json,
    } = venue;

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayKey = days[new Date().getDay()];

    const formatHours = (hours: any) => {
        if (!hours || !hours[todayKey] || hours[todayKey].length === 0) return 'Closed today';
        return hours[todayKey].map((p: any) => `${p.open.slice(0, 2)}:${p.open.slice(2)} - ${p.close.slice(0, 2)}:${p.close.slice(2)}`).join(', ');
    };

    const isImg = icon && icon.startsWith('/');

    return (
        <main className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 font-sans selection:bg-orange-100 dark:selection:bg-orange-900/30">
            {/* Hero / Navigation */}
            <div className="max-w-4xl mx-auto px-6 pt-8 pb-12">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-12 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {backText}
                </Link>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-[40px] bg-white dark:bg-zinc-900 shadow-2xl flex items-center justify-center text-5xl overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0">
                        {isImg ? (
                            <Image src={icon} alt={name} fill className="object-cover" />
                        ) : (
                            <span>{icon || '🍽️'}</span>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-200/50 dark:border-orange-800/50">
                                {category}
                            </span>
                            {price_risk === 'high' && (
                                <span className="px-3 py-1 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-widest">
                                    Premium
                                </span>
                            )}
                        </div>
                        <h1 className="font-serif text-5xl md:text-6xl font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
                            {name}
                        </h1>
                        <p className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 mt-4 text-base font-medium">
                            <MapPin className="w-4 h-4 shrink-0" />
                            {address}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-12">

                {/* Main Column */}
                <div className="md:col-span-2 space-y-12">

                    {/* Specials Section */}
                    <section>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            What's On Now
                        </h2>
                        {specials && specials.length > 0 ? (
                            <div className="grid gap-4">
                                {specials.map((s: any, i: number) => (
                                    <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                                        <h3 className="text-xl font-bold dark:text-white mb-2">{s.title}</h3>
                                        <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-[15px]">{s.description}</p>
                                        {s.price && <p className="mt-4 font-black text-orange-600">{s.price}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-zinc-900/50 border border-dashed border-gray-200 dark:border-zinc-800 p-8 rounded-[32px] text-center">
                                <p className="text-gray-400 text-sm font-medium italic">No special offers today, but popular for its atmosphere!</p>
                            </div>
                        )}
                    </section>

                    {/* Known For */}
                    <section>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Known For</h2>
                        <ul className="space-y-4">
                            {known_for_bullets.map((bullet: string, i: number) => (
                                <li key={i} className="flex items-start gap-4 text-xl font-serif font-semibold text-gray-800 dark:text-zinc-200 leading-relaxed group">
                                    <div className="mt-1 transition-transform group-hover:scale-110">
                                        <Image src="/icon-monster.png" alt="" width={32} height={32} />
                                    </div>
                                    {bullet}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(`${name}, ${address}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-3 bg-black text-white dark:bg-white dark:text-black py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Navigation className="w-4 h-4" />
                            Let's go
                        </a>
                        <button className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 text-black dark:text-white py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
                            <Share2 className="w-4 h-4" />
                            Tell Friends
                        </button>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-[32px] p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm border border-gray-100 dark:border-zinc-800">
                                <Clock className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hours Today</p>
                                <p className="text-sm font-bold dark:text-white">
                                    {opening_hours_json ? formatHours(opening_hours_json) : (service_speed === 'fast' ? 'Quick & Snappy' : 'Relaxed Pace')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm border border-gray-100 dark:border-zinc-800">
                                <Star className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Walk-ins</p>
                                <p className="text-sm font-bold dark:text-white capitalize">
                                    {walk_in_friendliness === 'high' ? 'Always Welcome' : 'Usually Fine'}
                                </p>
                            </div>
                        </div>

                        {booking_likely && (
                            <div className="pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1 flex items-center gap-1">
                                    <Heart className="w-3 h-3 fill-current" />
                                    Highly Recommended
                                </p>
                                <p className="text-sm font-bold dark:text-white italic">Best to book ahead for peak times.</p>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 pt-4">
                        {vibe_tags.map((tag: string, i: number) => (
                            <span key={i} className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-lg capitalize">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
