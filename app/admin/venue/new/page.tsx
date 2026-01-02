'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Store, Phone, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewVenuePage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [phone, setPhone] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [confirmOverwrite, setConfirmOverwrite] = useState(false);

    useEffect(() => {
        setConfirmOverwrite(false);
        setError('');
    }, [name, phone]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (name.length < 2) {
                setSuggestions([]);
                return;
            }

            const { data } = await supabase
                .from('restaurants')
                .select('name, venue_mobile_number, slug')
                .ilike('name', `%${name}%`)
                .limit(5);

            setSuggestions(data || []);
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [name]);

    const getExpectedCode = () => {
        const d = new Date();
        const day = d.getDate().toString().padStart(2, '0');
        const year = d.getFullYear().toString();
        return `${day}${year}`;
    };

    const validateAUPhone = (num: string) => {
        // Basic AU validation: +614... or 04...
        const clean = num.replace(/\s+/g, '');
        return /^(\+614|04|614)\d{8}$/.test(clean);
    };

    const handleSelectVenue = (venue: any) => {
        setName(venue.name);
        setSelectedSlug(venue.slug);
        if (venue.venue_mobile_number) {
            setPhone(venue.venue_mobile_number);
        }
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // 1. Validate Code
        if (securityCode !== getExpectedCode()) {
            setError('Invalid security code.');
            setLoading(false);
            return;
        }

        // 2. Validate Phone
        if (!validateAUPhone(phone)) {
            setError('Please enter a valid AU mobile number (+614... or 04...)');
            setLoading(false);
            return;
        }

        if (!name.trim()) {
            setError('Restaurant name is required.');
            setLoading(false);
            return;
        }

        try {
            const slug = selectedSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            // Format phone to E.164
            let formattedPhone = phone.replace(/\s+/g, '');
            if (formattedPhone.startsWith('04')) {
                formattedPhone = '+61' + formattedPhone.slice(1);
            } else if (formattedPhone.startsWith('614')) {
                formattedPhone = '+' + formattedPhone;
            }

            // 3. Check if Venue exists and if it's already activated
            const { data: existingVenue } = await supabase
                .from('restaurants')
                .select('id, venue_mobile_number')
                .eq('slug', slug)
                .single();

            if (existingVenue?.venue_mobile_number && !confirmOverwrite) {
                setError('⚠️ This venue is already activated with a mobile number. Click "Activate" again to overwrite.');
                setConfirmOverwrite(true);
                setLoading(false);
                return;
            }

            let venue;

            if (existingVenue) {
                // UPDATE: Only update the mobile credentials, leave category/town/metadata alone
                const { data: updatedVenue, error: vError } = await supabase
                    .from('restaurants')
                    .update({
                        venue_mobile_number: formattedPhone,
                        system_sms_number: process.env.NEXT_PUBLIC_ACTIVATION_PHONE || '+61488852331',
                    })
                    .eq('id', existingVenue.id)
                    .select()
                    .single();

                if (vError) throw vError;
                venue = updatedVenue;
            } else {
                // INSERT: Brand new venue creation with defaults
                const { data: newVenue, error: vError } = await supabase
                    .from('restaurants')
                    .insert({
                        name,
                        slug,
                        venue_mobile_number: formattedPhone,
                        system_sms_number: process.env.NEXT_PUBLIC_ACTIVATION_PHONE || '+61488852331',
                        category: 'New Venue',
                        is_active: true,
                        town: 'Noosa',
                        town_slug: 'noosa'
                    })
                    .select()
                    .single();

                if (vError) throw vError;
                venue = newVenue;
            }

            // 4. Upsert Contact Link (Insert or Update if phone exists)
            const { error: cError } = await supabase
                .from('restaurant_contacts')
                .upsert({
                    restaurant_id: venue.id,
                    phone_e164: formattedPhone,
                    verified: true
                }, { onConflict: 'phone_e164' });

            if (cError) throw cError;

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Failed to update venue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black p-6 flex flex-col items-center justify-center">
            <Link
                href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Return Home
            </Link>

            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-gray-100 dark:border-zinc-800 p-8 relative overflow-visible">
                {success ? (
                    <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Venue Updated!</h2>
                        <p className="text-gray-500 dark:text-zinc-400">Redirecting to home...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center shrink-0">
                                <Store className="w-6 h-6 text-white dark:text-black" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide">Activate Venue</h1>
                                <p className="text-xs text-gray-500 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Admin Only</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Restaurant Name</label>
                                <div className="relative">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        type="text"
                                        required
                                        autoComplete="off"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setSelectedSlug(null);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
                                        placeholder="Type to search existing..."
                                    />

                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                                            {suggestions.map((v) => (
                                                <button
                                                    key={v.slug}
                                                    type="button"
                                                    onClick={() => handleSelectVenue(v)}
                                                    className="w-full text-left px-5 py-3 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                                                >
                                                    <span className="font-bold text-gray-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white">{v.name}</span>
                                                    {v.venue_mobile_number && <span className="text-[10px] text-gray-400 font-mono italic">Has Mobile</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number (AU Mobile)</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
                                        placeholder="+61 412 345 678"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Security Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={securityCode}
                                        onChange={(e) => setSecurityCode(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-mono tracking-widest"
                                        placeholder="XXXXXX"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs font-bold text-red-500 text-center animate-shake">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !name.trim() || !phone.trim() || securityCode.length < 6}
                                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </main>
    );
}
