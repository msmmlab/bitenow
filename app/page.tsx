'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Phone, Navigation, Clock, Search, Filter, List, Map as MapIcon, X, HelpCircle, Mail, PlusCircle, MessageSquare, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapView from '@/components/map-view';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import SpecialModal from '@/components/special-modal';

// TYPES
interface Venue {
  id: string; // restaurant id
  name: string;
  category: string;
  icon: string;
  lat: number;
  lng: number;
  activation_phone?: string;
  special?: {
    id: string;
    title: string;
    description: string;
    updated_at: string;
  } | null;
  distance?: string;
  distanceValue?: number;
  recommended_for?: string | null;
}



// Helper for real distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper for utility signals
const getVenueSignal = (category: string) => {
  const hour = new Date().getHours();
  const lowerCat = category.toLowerCase();

  if (hour >= 11 && hour <= 14) return "Likely serving lunch";
  if (hour >= 17 && hour <= 21) return "Open for dinner";
  if (lowerCat.includes('cafe') && hour >= 7 && hour <= 15) return "Open for coffee & food";

  return "Open now";
};

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showJoinUs, setShowJoinUs] = useState(false);
  const [joinUsVenue, setJoinUsVenue] = useState<Venue | null>(null);
  const [suggestText, setSuggestText] = useState("");
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const openSuggestModal = (venue: Venue | null = null) => {
    setJoinUsVenue(venue);
    setSuggestText(venue ? venue.name : "");
    setSuggestSuccess(false);
    setShowJoinUs(true);
  };

  // VIBE SET FILTERS
  const FILTERS = ["All", "Lunch", "Dinner", "Live Music", "Family"];

  // FETCH DATA
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch all active restaurants
      const { data: restaurants, error: rError } = await supabase
        .from('restaurants')
        .select('id, name, category, icon, lat, lng, recommended_for')
        .eq('is_active', true);

      if (rError) {
        console.error('Error fetching restaurants:', rError);
        setLoading(false);
        return;
      }

      // 2. Fetch today's specials
      const { data: specials, error: sError } = await supabase
        .from('specials')
        .select('id, restaurant_id, title, description, updated_at')
        .eq('is_active', true)
        .eq('date_local', today);

      if (sError) {
        console.error('Error fetching specials:', sError);
      }

      // 3. Merge
      const mapped = (restaurants || []).map((r: any) => {
        const special = specials?.find(s => s.restaurant_id === r.id);
        return {
          ...r,
          special: special || null
        };
      });

      setVenues(mapped);
      console.log('Fetched venues with recommendations:', mapped.map(v => ({ name: v.name, rec: v.recommended_for })));
      setLoading(false);
    }

    fetchData();
  }, []);

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Calculate distances and sort whenever venues or location changes
  const venuesWithDistance = useMemo(() => {
    return venues.map(v => {
      if (!userLocation) return { ...v, distance: "..." };

      const dist = calculateDistance(userLocation.lat, userLocation.lng, v.lat, v.lng);
      return {
        ...v,
        distance: dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`,
        distanceValue: dist,
        recommended_for: v.recommended_for
      };
    }).sort((a, b) => {
      // 1. Prioritize Active Specials
      const aHasSpecial = !!a.special;
      const bHasSpecial = !!b.special;
      if (aHasSpecial !== bHasSpecial) return aHasSpecial ? -1 : 1;

      // 2. Prioritize venues with "Known for" content
      const aHasRec = !!a.recommended_for;
      const bHasRec = !!b.recommended_for;
      if (aHasRec !== bHasRec) return aHasRec ? -1 : 1;

      // 3. Fallback to Distance
      if (a.distanceValue === undefined || b.distanceValue === undefined) return 0;
      return (a.distanceValue || 0) - (b.distanceValue || 0);
    });
  }, [venues, userLocation]);

  // Filter & Sort Logic
  const filteredVenues = venuesWithDistance.filter(v => {
    // "All" shows everything (Venues + Specials)
    if (activeFilter === "All") return true;

    // Specific filters currently only show venues WITH active specials that match
    if (!v.special) return false;

    const lowerTitle = v.special.title.toLowerCase();
    const lowerDesc = v.special.description.toLowerCase();

    if (activeFilter === "Lunch") return lowerTitle.includes("lunch") || lowerTitle.includes("burger") || lowerDesc.includes("12pm");
    if (activeFilter === "Dinner") return lowerTitle.includes("dinner") || lowerTitle.includes("steak") || lowerTitle.includes("pizza") || lowerTitle.includes("tacos") || lowerDesc.includes("5pm");
    if (activeFilter === "Live Music") return lowerDesc.includes("live") || lowerDesc.includes("music") || lowerDesc.includes("tunes");
    if (activeFilter === "Family") return lowerDesc.includes("kids") || lowerTitle.includes("family") || lowerTitle.includes("pizza");

    return true;
  });

  const hasAnySpecials = venues.some(v => v.special);

  // Filters
  // Smart Header Logic
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.log("Location access denied", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;

    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };


  return (
    <main className="flex flex-col min-h-screen bg-white dark:bg-black relative">
      {/* Smart Header */}
      <header className={`fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 py-1.5 border-b border-gray-100 dark:border-zinc-800 shrink-0 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="BiteNow Logo"
              width={140}
              height={45}
              className="h-32 w-auto object-contain"
              priority
            />
          </div>

          {/* View Toggle (List/Map) - Top Right */}
          {/* View Toggle (Pill Style) */}
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-full border border-gray-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1.5 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200",
                viewMode === 'list'
                  ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center gap-1.5 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200",
                viewMode === 'map'
                  ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* Filters - HIDDEN FOR MVP
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeFilter === f
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                  : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        */}
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'list' ? (

          <div className="h-full w-full relative group">
            {/* Watermark Background (Fixed in Container) */}
            {/* Watermark Background (Fixed in Container) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Image src="/logo.png" width={300} height={300} alt="Watermark" />
            </div>

            {/* Scrollable Content Overlay */}
            <div
              onScroll={handleScroll}
              className="absolute inset-0 z-10 overflow-y-auto pb-6 pt-32"
            >
              <div className="p-4 space-y-4">
                {/* Cold Start Banner */}
                {!loading && !hasAnySpecials && (
                  <div className="bg-[#FFF6EA] border border-[#F59E0B]/30 rounded-2xl p-4 mb-2 flex flex-col gap-3 shadow-sm">
                    <p className="text-[#F59E0B] text-sm font-bold leading-tight">
                      We’re new here — deals are rolling in.<br />
                      <span className="opacity-90 font-medium text-xs">Can’t see your favourite spot yet? They can post specials instantly by text.</span>
                    </p>
                    <button
                      onClick={() => openSuggestModal(null)}
                      className="bg-white border border-[#F59E0B] text-[#F59E0B] text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl transition-all active:scale-95 w-fit shadow-sm"
                    >
                      ⭐ Suggest a favourite
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-gray-500 font-bold">{hasAnySpecials ? 'Active Specials' : 'Nearby Venues'}</span>
                </div>

                {loading && <div className="p-10 text-center text-gray-500">Loading today's specials...</div>}

                {!loading && filteredVenues.length === 0 && (
                  <div className="p-10 text-center text-gray-500">
                    <p>No venues found matching your filter.</p>
                  </div>
                )}

                {filteredVenues.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedVenue(item)}
                    className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer active:scale-[0.98] transition-transform duration-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-800 overflow-hidden")}>
                          {item.icon && item.icon.startsWith('/') ? (
                            <img src={item.icon} alt={item.category} className="w-full h-full object-cover" />
                          ) : (
                            item.icon || '🍽️'
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.name}</h3>
                          <div className="flex flex-col mt-0.5">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{item.distance}</span>
                              <span className="text-gray-300">•</span>
                              <span>{item.category}</span>
                            </div>
                            <div className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              {getVenueSignal(item.category)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {item.special && (
                        <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                          ON NOW
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      {item.special ? (
                        <>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white pr-8">{item.special.title}</h4>
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{item.special.description || 'Today'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className="text-lg font-bold text-gray-400 dark:text-zinc-600 pr-8 italic">Awaiting today&apos;s specials</h4>
                          {item.recommended_for && (
                            <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-zinc-500">
                              <span className="font-bold text-gray-500 dark:text-zinc-400">Known for</span> {item.recommended_for}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400 dark:text-zinc-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Check back later — venues update daily</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVenue(item);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-3 rounded-xl text-sm font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                      >
                        <Navigation className="w-4 h-4" />
                        Navigate There
                      </button>

                      {!item.special && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSuggestModal(item);
                          }}
                          className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1 transition-colors"
                        >
                          Own this place? Activate specials
                        </button>
                      )}

                      {item.special && (
                        <button className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                          <Phone className="w-4 h-4" />
                          Call Venue
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Spacer for bottom nav */}
                <div className="h-16"></div>
              </div>
            </div>
          </div>

        ) : (
          <MapView
            venues={venues}
            onSelectVenue={setSelectedVenue}
            userLocation={userLocation}
          />
        )}

      </div>

      {/* SUGGEST / JOIN MODAL */}
      {showJoinUs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinUs(false)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 relative z-10 w-full max-w-sm border border-gray-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowJoinUs(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-6 h-6" /></button>

            {!suggestSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="space-y-2">
                  <div className="text-4xl text-center">⭐</div>
                  <h3 className="text-2xl font-black tracking-tight">Suggest a Place</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Missing your favourite spot? We&apos;ll reach out and let them know they can post specials instantly by text.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={suggestText}
                    onChange={(e) => setSuggestText(e.target.value)}
                    placeholder={joinUsVenue ? "What's the deal? (or describe a photo)" : "Venue name or address..."}
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-gray-400 italic">
                    {joinUsVenue ? "Tell us what they're serving today!" : "Help us find them on the map."}
                  </p>
                </div>

                <button
                  onClick={() => setSuggestSuccess(true)}
                  className="w-full bg-black dark:bg-white dark:text-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  Submit suggestion
                </button>

                {/* VISUAL DIVIDER */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-zinc-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-900 px-3 text-gray-400 font-bold tracking-widest">or</span></div>
                </div>

                {/* OWNER SECTION */}
                <div className="text-left space-y-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-black text-xs text-gray-900 dark:text-gray-100 uppercase tracking-widest">Own this place?</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Post specials instantly — no logins, no dashboards. Just text us your deal or a photo of today&apos;s specials board.
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-5 border border-yellow-100 dark:border-yellow-900/30">
                    <p className="text-[10px] text-yellow-800 dark:text-yellow-500 font-bold mb-1 uppercase tracking-wider">Text us your deal to:</p>
                    <p className="text-xl font-black text-yellow-900 dark:text-yellow-400 underline underline-offset-4">
                      {joinUsVenue?.activation_phone || process.env.NEXT_PUBLIC_ACTIVATION_PHONE || '+61 400 000 000'}
                    </p>

                    <div className="mt-4 space-y-2 text-[11px] text-yellow-800 opacity-70 italic font-medium">
                      <p>&quot;$15 Parma & Schooner 12–3&quot;</p>
                      <p>Or just text a photo of your board</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 py-8 animate-in fade-in zoom-in duration-300">
                <div className="text-5xl">✅</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-black dark:text-white">Thank you!</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed px-4">
                    We&apos;ve received your suggestion. We&apos;ll do our best to get them on board!
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinUs(false)}
                  className="w-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold py-4 rounded-xl active:scale-95 transition-transform"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ MODAL */}
      {showFAQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFAQ(false)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 relative z-10 w-full max-w-sm border border-gray-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowFAQ(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-6 h-6" /></button>
            <div className="space-y-6 py-4">
              <h3 className="text-2xl font-black tracking-tight text-center">FAQ</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-sm mb-1">How much does it cost?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">During our beta phase, BiteNow is 100% free for both venues and users.</p>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">How do I update a special?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Just send us another text! Each new text replaces your previous special for the day.</p>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">How long do specials last?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Specials naturally expire at the end of the day unless you text us a multi-day deal.</p>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">What if my venue isn&apos;t on the map?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Text us your venue name and address. We manually verify and add new spots within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT MODAL */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContact(false)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 relative z-10 w-full max-w-sm border border-gray-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowContact(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-6 h-6" /></button>
            <div className="text-center space-y-6 py-4">
              <div className="text-4xl">👋</div>
              <h3 className="text-2xl font-black tracking-tight">Get in touch</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Questions, feedback, or just want to say hi? We&apos;d love to hear from you.</p>

              <div className="space-y-3">
                <a href="mailto:hello@bitenow.com.au" className="w-full flex items-center justify-center gap-3 bg-gray-50 dark:bg-zinc-800 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                  <Mail className="w-5 h-5" />
                  <span>Email Support</span>
                </a>
                <a href="sms:+61400000000" className="w-full flex items-center justify-center gap-3 bg-gray-50 dark:bg-zinc-800 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  <span>Text Us Directly</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARED MODAL */}
      <SpecialModal
        special={selectedVenue}
        onClose={() => setSelectedVenue(null)}
        userLocation={userLocation}
      />

    </main >
  );
}
