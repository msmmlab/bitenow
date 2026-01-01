'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Phone, Navigation, Clock, Search, Filter, List, Map as MapIcon, X, HelpCircle, Mail, PlusCircle, MessageSquare, Store, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapView from '@/components/map-view';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import SpecialModal from '@/components/special-modal';
import VenueTile, { Venue } from '@/components/venue-tile';
import { getIntentOptions, scoreRestaurant } from '@/lib/recommendation';
import * as gtag from '@/lib/gtag';

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
const getVenueSignal = (category: string, timeLens: string = 'Now') => {
  const hour = new Date().getHours();
  const lowerCat = category.toLowerCase();
  const lowerLens = timeLens.toLowerCase();

  // Simple logic for MVP: standard trading hours 10am-10pm unless cafe
  if (lowerCat.includes('cafe')) {
    if (hour < 7 || hour >= 16) {
      if (lowerLens === 'tonight') return "Open tomorrow";
      return "Opens later";
    }
    return "Open for coffee & food";
  }

  if (hour < 10) {
    if (lowerLens === 'tonight') return "Opens tonight";
    return "Opens later";
  }

  const isNightSpot = lowerCat.includes('bar') || lowerCat.includes('pub') || lowerCat.includes('brewery') || lowerCat.includes('cocktail');

  if (isNightSpot) {
    if (hour >= 22 || hour < 2) return "Open late";
    if (hour >= 2 && hour < 10) {
      if (lowerLens === 'tonight') return "Opens tonight";
      return "Opens later";
    }
  } else {
    if (hour >= 22) {
      if (lowerLens === 'tonight') return "Likely open for dinner";
      return "Opens later";
    }
  }

  if (hour >= 11 && hour <= 14) return "Serving lunch";
  if (hour >= 17 && hour <= 21) return "Open for dinner";

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
  const [timeFilter, setTimeFilter] = useState<'Now' | 'Later' | 'Tonight'>('Now');
  const [intent, setIntent] = useState<string | null>(null);
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
        .select('*')
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
      const signal = getVenueSignal(v.category, timeFilter);
      const isOpen = !signal.includes("Closed") && !signal.includes("Opens") && !signal.includes("Likely");

      return {
        ...v,
        distance: dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`,
        distanceValue: dist,
        recommended_for: v.recommended_for,
        isOpen
      };
    }).sort((a, b) => {
      const context = {
        timeLens: timeFilter.toLowerCase(),
        date: new Date(),
        intent: intent,
        distanceValue: a.distanceValue
      };

      const scoreA = scoreRestaurant(a, context);
      const scoreB = scoreRestaurant(b, { ...context, distanceValue: b.distanceValue });

      return scoreB - scoreA;
    });
  }, [venues, userLocation, timeFilter, intent]);

  // Filter & Sort Logic for LIST VIEW (with distance limits)
  const filteredVenuesForList = venuesWithDistance.filter(v => {
    // 0. Distance-Based Filtering (ONLY FOR LIST VIEW)
    if (v.distanceValue !== undefined) {
      // For "Now" - only show venues within reasonable driving distance
      if (timeFilter === 'Now' && v.distanceValue > 10) return false; // 10km max for immediate needs

      // For "Tonight" and "Later" - allow further planning but still cap it
      if ((timeFilter === 'Tonight' || timeFilter === 'Later') && v.distanceValue > 25) return false; // 25km max for planned visits
    }

    // 1. Time-Based Filtering
    if (timeFilter === 'Tonight') {
      const isEveningVenue = ["Dinner", "Cocktails", "Pub", "Bar", "Brewery", "Pizza", "Asian Fusion"].includes(v.category) ||
        (v.best_for && (v.best_for.includes('dinner') || v.best_for.includes('late'))) ||
        (v.best_times && (v.best_times.includes('dinner') || v.best_times.includes('late')));

      const isNightSpecial = v.special && (v.special.title.toLowerCase().includes("dinner") || v.special.description.toLowerCase().includes("pm"));

      if (!isEveningVenue && !isNightSpecial) return false;
    }

    // 2. Intent-Based "Hard" Filtering
    if (intent) {
      const cleanIntent = intent.replace(/[^\w\s]/gi, '').trim().toLowerCase();

      if (cleanIntent === 'date night') {
        const isFancy = (v.formality_level || 0) >= 2 || (v.best_for?.includes('fancy_dinner'));
        if (!isFancy) return false;
      }

      if (cleanIntent === 'drinks') {
        const lowerCat = v.category?.toLowerCase() || "";
        const isDrinks = lowerCat.includes("brew") || lowerCat.includes("pub") || lowerCat.includes("bar") ||
          v.best_for?.includes('beer') || v.best_for?.includes('afternoon') || v.best_for?.includes('drinks');
        if (!isDrinks) return false;
      }

      if (cleanIntent === 'breakfast') {
        const isBf = v.best_for?.includes('breakfast') || v.category?.toLowerCase().includes('cafe');
        if (!isBf) return false;
      }

      if (cleanIntent === 'lunch') {
        const isLunch = v.best_for?.includes('lunch');
        if (!isLunch) return false;
      }

      if (cleanIntent === 'dinner') {
        const isDinner = v.best_for?.includes('dinner') || v.best_for?.includes('fancy_dinner');
        if (!isDinner) return false;
      }

      if (cleanIntent === 'coffee') {
        const isCoffee = v.category?.toLowerCase().includes('cafe') || v.best_for?.includes('coffee');
        if (!isCoffee) return false;
      }
    }

    // 3. Vibe/Category Filtering
    if (activeFilter === "All") return true;
    if (!v.special) return false;

    const lowerTitle = v.special.title.toLowerCase();
    const lowerDesc = v.special.description.toLowerCase();

    if (activeFilter === "Lunch") return lowerTitle.includes("lunch") || lowerTitle.includes("burger") || lowerDesc.includes("12pm");
    if (activeFilter === "Dinner") return lowerTitle.includes("dinner") || lowerTitle.includes("steak") || lowerTitle.includes("pizza") || lowerTitle.includes("tacos") || lowerDesc.includes("5pm");
    if (activeFilter === "Live Music") return lowerDesc.includes("live") || lowerDesc.includes("music") || lowerDesc.includes("tunes");
    if (activeFilter === "Family") return lowerDesc.includes("kids") || lowerTitle.includes("family") || lowerTitle.includes("pizza");

    return true;
  });

  // Filter for MAP VIEW (NO distance limits - show all venues)
  const filteredVenuesForMap = venuesWithDistance.filter(v => {
    // NO distance filtering for map - users should see everything when they zoom out

    // 1. Time-Based Filtering
    if (timeFilter === 'Tonight') {
      const isEveningVenue = ["Dinner", "Cocktails", "Pub", "Bar", "Brewery", "Pizza", "Asian Fusion"].includes(v.category) ||
        (v.best_for && (v.best_for.includes('dinner') || v.best_for.includes('late'))) ||
        (v.best_times && (v.best_times.includes('dinner') || v.best_times.includes('late')));

      const isNightSpecial = v.special && (v.special.title.toLowerCase().includes("dinner") || v.special.description.toLowerCase().includes("pm"));

      if (!isEveningVenue && !isNightSpecial) return false;
    }

    // 2. Intent-Based "Hard" Filtering
    if (intent) {
      const cleanIntent = intent.replace(/[^\w\s]/gi, '').trim().toLowerCase();

      if (cleanIntent === 'date night') {
        const isFancy = (v.formality_level || 0) >= 2 || (v.best_for?.includes('fancy_dinner'));
        if (!isFancy) return false;
      }

      if (cleanIntent === 'drinks') {
        const lowerCat = v.category?.toLowerCase() || "";
        const isDrinks = lowerCat.includes("brew") || lowerCat.includes("pub") || lowerCat.includes("bar") ||
          v.best_for?.includes('beer') || v.best_for?.includes('afternoon') || v.best_for?.includes('drinks');
        if (!isDrinks) return false;
      }

      if (cleanIntent === 'breakfast') {
        const isBf = v.best_for?.includes('breakfast') || v.category?.toLowerCase().includes('cafe');
        if (!isBf) return false;
      }

      if (cleanIntent === 'lunch') {
        const isLunch = v.best_for?.includes('lunch');
        if (!isLunch) return false;
      }

      if (cleanIntent === 'dinner') {
        const isDinner = v.best_for?.includes('dinner') || v.best_for?.includes('fancy_dinner');
        if (!isDinner) return false;
      }

      if (cleanIntent === 'coffee') {
        const isCoffee = v.category?.toLowerCase().includes('cafe') || v.best_for?.includes('coffee');
        if (!isCoffee) return false;
      }
    }

    // 3. Vibe/Category Filtering
    if (activeFilter === "All") return true;
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
      <header className={`fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 shrink-0 transition-transform duration-500 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="BiteNow Logo"
                width={160}
                height={64}
                className="h-16 w-auto object-contain dark:[filter:invert(1)_hue-rotate(180deg)] transition-all duration-300"
                priority
              />
            </div>

            <div className="flex bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-full border border-gray-200/50 dark:border-zinc-700/50 shadow-inner">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300",
                  viewMode === 'list'
                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-md scale-105"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300",
                  viewMode === 'map'
                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-md scale-105"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                )}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Time filters */}
            <div className="flex-1 max-w-xl bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl p-1 gap-1 border border-gray-100/50 dark:border-zinc-800/50">
              {(['Now', 'Later', 'Tonight'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTimeFilter(t);
                    setIntent(null);
                    gtag.event({
                      action: 'change_time_lens',
                      category: 'interaction',
                      label: t
                    });
                  }}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200",
                    timeFilter === t
                      ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                      : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Intent Chips */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 shrink-0 opacity-70">Take me for →</span>
              <div className="flex gap-2">
                {getIntentOptions(timeFilter.toLowerCase(), new Date()).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const newIntent = intent === option ? null : option;
                      setIntent(newIntent);
                      if (newIntent) {
                        gtag.event({
                          action: 'select_intent',
                          category: 'interaction',
                          label: option
                        });
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 border whitespace-nowrap",
                      intent === option
                        ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg -translate-y-0.5"
                        : "bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-500"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'list' ? (
          <div className="h-full w-full relative group">
            {/* Watermark Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Image src="/logo.png" width={300} height={300} alt="Watermark" className="dark:[filter:invert(1)_hue-rotate(180deg)]" />
            </div>

            {/* Scrollable Content Overlay */}
            <div
              onScroll={handleScroll}
              className="absolute inset-0 z-10 overflow-y-auto pb-6 pt-32"
            >
              <div className="p-4 space-y-4 max-w-7xl mx-auto">
                {/* Cold Start Banner */}
                {!loading && !hasAnySpecials && (
                  <div className="bg-[#FFF6EA] dark:bg-zinc-900/50 border border-[#F59E0B]/30 dark:border-[#F59E0B]/20 rounded-2xl p-4 mb-2 flex flex-col gap-3 shadow-sm">
                    <p className="text-[#F59E0B] text-sm font-bold leading-tight">
                      We’re new here — deals are rolling in.
                    </p>
                    <button
                      onClick={() => openSuggestModal(null)}
                      className="bg-white dark:bg-zinc-800 border border-[#F59E0B] text-[#F59E0B] text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl transition-all active:scale-95 w-fit shadow-sm"
                    >
                      ⭐ Suggest new venue
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-gray-500 font-bold">
                    {intent ? 'Curated Picks' : (hasAnySpecials ? 'Active Specials' : 'Nearby Venues')}
                  </span>
                </div>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Finding fresh bites...</p>
                  </div>
                )}

                {!loading && filteredVenuesForList.length === 0 && (
                  <div className="p-10 text-center text-gray-500">
                    <p>No venues found matching your filter.</p>
                  </div>
                )}

                {filteredVenuesForList.length > 0 && intent && (
                  <div className="pt-2 pb-2">
                    <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                      Best for <span className="text-orange-500">{intent}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVenuesForList.slice(0, intent ? 3 : filteredVenuesForList.length).map((item) => (
                    <VenueTile
                      key={item.id}
                      venue={item}
                      onClick={() => {
                        setSelectedVenue(item);
                        gtag.event({
                          action: 'view_venue_detail_list',
                          category: 'discovery',
                          label: item.name
                        });
                      }}
                      onNavigate={(e) => {
                        e.stopPropagation();
                        setSelectedVenue(item);
                      }}
                      onSuggest={(e) => {
                        e.stopPropagation();
                        openSuggestModal(item);
                      }}
                      timeFilter={timeFilter}
                      getVenueSignal={getVenueSignal}
                    />
                  ))}
                </div>

                {intent && filteredVenuesForList.length > 3 && (
                  <>
                    <div className="pt-8 pb-4">
                      <div className="h-px bg-gray-100 dark:bg-zinc-800 w-full mb-6" />
                      <h3 className="text-sm text-gray-400 font-bold px-1">Everything Else</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVenuesForList.slice(3).map((item) => (
                        <VenueTile
                          key={item.id}
                          venue={item}
                          onClick={() => {
                            setSelectedVenue(item);
                            gtag.event({
                              action: 'view_venue_detail_list',
                              category: 'discovery',
                              label: item.name
                            });
                          }}
                          onNavigate={(e) => {
                            e.stopPropagation();
                            setSelectedVenue(item);
                          }}
                          onSuggest={(e) => {
                            e.stopPropagation();
                            openSuggestModal(item);
                          }}
                          timeFilter={timeFilter}
                          getVenueSignal={getVenueSignal}
                        />
                      ))}
                    </div>
                  </>
                )}
                {/* Spacer for bottom nav */}
                <div className="h-16"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full md:p-6 bg-gray-50 dark:bg-zinc-950">
            <div className="w-full h-full md:w-[90%] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-zinc-800">
              <MapView
                venues={filteredVenuesForMap}
                onSelectVenue={setSelectedVenue}
                userLocation={userLocation}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showJoinUs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinUs(false)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 relative z-10 w-full max-w-sm border border-gray-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowJoinUs(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-6 h-6" /></button>
            {!suggestSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="space-y-2">
                  <div className="text-4xl">⭐</div>
                  <h3 className="text-2xl font-black tracking-tight">Suggest a Place</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Missing your favourite spot? We&apos;ll reach out and let them know.
                  </p>
                </div>
                <input
                  type="text"
                  value={suggestText}
                  onChange={(e) => setSuggestText(e.target.value)}
                  placeholder="Venue name or address..."
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white shadow-inner"
                />
                <button
                  onClick={() => setSuggestSuccess(true)}
                  className="w-full bg-black dark:bg-white dark:text-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  Submit suggestion
                </button>
              </div>
            ) : (
              <div className="text-center space-y-6 py-8 animate-in fade-in zoom-in duration-300">
                <div className="text-5xl">✅</div>
                <h3 className="text-2xl font-black tracking-tight text-black dark:text-white">Thank you!</h3>
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
                  <p className="text-xs text-gray-500 leading-relaxed">During our beta phase, BiteNow is 100% free.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContact(false)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 relative z-10 w-full max-w-sm border border-gray-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowContact(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-6 h-6" /></button>
            <div className="text-center space-y-6 py-4">
              <div className="text-4xl">👋</div>
              <h3 className="text-2xl font-black tracking-tight">Get in touch</h3>
              <div className="space-y-3">
                <a href="mailto:hello@bitenow.com.au" className="w-full flex items-center justify-center gap-3 bg-gray-50 dark:bg-zinc-800 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                  <Mail className="w-5 h-5" />
                  <span>Email Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <SpecialModal
        special={selectedVenue}
        onClose={() => setSelectedVenue(null)}
        userLocation={userLocation}
      />
    </main>
  );
}
