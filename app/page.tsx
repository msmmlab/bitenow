'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, Phone, Navigation, Clock, Search, Filter, List, Map as MapIcon, X, HelpCircle, Mail, PlusCircle, MessageSquare, Store, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapView from '@/components/map-view';
import RadarView from '@/components/radar-view';
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
  const [viewMode, setViewMode] = useState<'list' | 'radar'>('list');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showJoinUs, setShowJoinUs] = useState(false);
  const [joinUsVenue, setJoinUsVenue] = useState<Venue | null>(null);
  const [suggestText, setSuggestText] = useState("");
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'Now' | 'Later' | 'Tonight'>('Now');
  const [intent, setIntent] = useState<any | null>(null);
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
      console.log('Fetched venues with recommendations:', mapped.map(v => ({ name: v.name, rec: v.best_for })));
      setLoading(false);
    }

    fetchData();
  }, []);

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Initial Location Fetch
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

  // Update Location Handler (for Radar Teleport)
  const handleUpdateLocation = useCallback((coords: { lat: number, lng: number } | null) => {
    if (coords) {
      // Teleport
      setUserLocation(coords);
    } else {
      // Reset to GPS (Recenter)
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
    }
  }, []);


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
        isOpen
      };
    }).sort((a, b) => {
      const context = {
        timeLens: timeFilter.toLowerCase(),
        date: new Date(),
        intent: intent,
        distanceValue: a.distanceValue
      };

      const resultA = scoreRestaurant(a, context);
      const resultB = scoreRestaurant(b, { ...context, distanceValue: b.distanceValue });

      return resultB.score - resultA.score;
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
      const lowerCat = v.category?.toLowerCase() || "";
      const isEveningVenue = ["dinner", "cocktails", "pub", "bar", "brewery", "pizza", "asian"].some(c => lowerCat.includes(c)) ||
        (v.best_for && (v.best_for.includes('dinner') || v.best_for.includes('late')));

      const isNightSpecial = v.special && (v.special.title.toLowerCase().includes("dinner") || v.special.description.toLowerCase().includes("pm"));

      if (!isEveningVenue && !isNightSpecial) return false;
    }

    // 2. Intent-Based "Hard" Filtering
    if (intent) {
      const intentLabel = typeof intent === 'string' ? intent : intent.label;
      const cleanIntent = intentLabel.replace(/[^\w\s]/gi, '').trim().toLowerCase();

      if (cleanIntent === 'date night') {
        const isFancy = (v.formality_level || 0) >= 2 || (v.best_for?.includes('fancy_dinner'));
        if (!isFancy) return false;
      }

      if (cleanIntent === 'drinks') {
        const lowerCat = v.category?.toLowerCase() || "";
        const isDrinks = lowerCat.includes("brew") || lowerCat.includes("pub") || lowerCat.includes("bar") ||
          lowerCat.includes("cocktail") ||
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

  // Filter for MAP/RADAR VIEW
  // Radar is stricter to reduce clutter, unless user explicitly filters.
  const filteredVenuesForMap = venuesWithDistance.filter(v => {

    // 1. If User has an Explicit Filter (Intent or Category), respect it 100%
    if (intent || activeFilter !== "All" || timeFilter !== 'Now') {
      // Reuse list logic? Or keep it broad?
      // Let's reuse the list filtering logic roughly, but maybe slightly looser on distance?
      // Actually, let's just use the same logic as the list for consistency when filtering is active.

      // COPY from List Logic (Simpler to just refactor to reuse, but for now inline)

      // Distance cap for Map/Radar when filtering?
      // Radar: 20 min walk = 1.6km. 
      // If user says "Tonight" (Planner Mode), we want to see further.
      // If "Now", maybe just nearby?
      // Let's just Apply filtering rules but IGNORE distance for Radar so you can teleport/scroll.

      // (A) Time-Based (Tonight)
      if (timeFilter === 'Tonight') {
        const lowerCat = v.category?.toLowerCase() || "";
        const isEveningVenue = ["dinner", "cocktails", "pub", "bar", "brewery", "pizza", "asian"].some(c => lowerCat.includes(c)) ||
          (v.best_for && (v.best_for.includes('dinner') || v.best_for.includes('late')));
        const isNightSpecial = v.special && (v.special.title.toLowerCase().includes("dinner") || v.special.description.toLowerCase().includes("pm"));
        if (!isEveningVenue && !isNightSpecial) return false;
      }

      // (B) Intent
      if (intent) {
        const intentLabel = typeof intent === 'string' ? intent : intent.label;
        const cleanIntent = intentLabel.replace(/[^\w\s]/gi, '').trim().toLowerCase();

        if (cleanIntent === 'date night') {
          const isFancy = (v.formality_level || 0) >= 2 || (v.best_for?.includes('fancy_dinner'));
          if (!isFancy) return false;
        }
        if (cleanIntent === 'drinks') {
          const lowerCat = v.category?.toLowerCase() || "";
          // Exclude dessert
          if (lowerCat.includes("dessert") || lowerCat.includes("ice cream") || lowerCat.includes("bakery")) return false;
          // Must be drinky
          const isDrinkVenue = lowerCat.includes("brew") || lowerCat.includes("pub") || lowerCat.includes("bar") || lowerCat.includes("cocktail") || v.best_for?.includes('beer') || v.best_for?.includes('drinks') || v.best_for?.includes('afternoon');
          const isCafe = lowerCat.includes("cafe");
          if (isCafe && !v.best_for?.includes('beer') && !v.best_for?.includes('drinks') && !v.best_for?.includes('cocktails')) return false;
          if (!isDrinkVenue) return false;
        }
        if (cleanIntent === 'breakfast') {
          const lowerCat = v.category?.toLowerCase() || "";
          if (lowerCat.includes("bar") || lowerCat.includes("pub") || lowerCat.includes("brew") || lowerCat.includes("cocktail")) return false;
          const isBf = v.best_for?.includes('breakfast') || lowerCat.includes('cafe');
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
          const lowerCat = v.category?.toLowerCase() || "";
          if (lowerCat.includes("bar") || lowerCat.includes("pub") || lowerCat.includes("brew") || lowerCat.includes("cocktail")) return false;
          const isCoffee = lowerCat.includes('cafe') || v.best_for?.includes('coffee');
          if (!isCoffee) return false;
        }
      }

      // (C) Category
      if (activeFilter !== "All") {
        if (!v.special) return false;
        const lowerTitle = v.special.title.toLowerCase();
        const lowerDesc = v.special.description.toLowerCase();
        if (activeFilter === "Lunch") return lowerTitle.includes("lunch") || lowerTitle.includes("burger") || lowerDesc.includes("12pm");
        if (activeFilter === "Dinner") return lowerTitle.includes("dinner") || lowerTitle.includes("steak") || lowerTitle.includes("pizza") || lowerTitle.includes("tacos") || lowerDesc.includes("5pm");
        if (activeFilter === "Live Music") return lowerDesc.includes("live") || lowerDesc.includes("music") || lowerDesc.includes("tunes");
        if (activeFilter === "Family") return lowerDesc.includes("kids") || lowerTitle.includes("family") || lowerTitle.includes("pizza");
      }

      return true;
    }

    // 2. NO Explicit Filter (Smart Curation)
    // Reduce clutter based on Time of Day
    const hour = new Date().getHours();
    const lowerCat = v.category?.toLowerCase() || "";
    const bestFor = v.best_for || [];

    // MORNING (5am - 11am)
    // Show: Cafe, Bakery, Breakfast spots
    if (hour >= 5 && hour < 11) {
      const isBreakfast = lowerCat.includes('cafe') || lowerCat.includes('bakery') || bestFor.includes('breakfast') || bestFor.includes('coffee');
      return isBreakfast;
    }

    // LUNCH (11am - 3pm)
    // Show: Lunch, Cafe, Burgers, Ice Cream
    if (hour >= 11 && hour < 15) {
      const isLunch = bestFor.includes('lunch') || lowerCat.includes('cafe') || lowerCat.includes('burger') || lowerCat.includes('ice cream') || lowerCat.includes('gelato');
      return isLunch;
    }

    // AFTERNOON (3pm - 5pm)
    // Show: Drinks, Snacks, Gelato, Early Dinner spots?
    if (hour >= 15 && hour < 17) {
      const isArvo = bestFor.includes('drinks') || bestFor.includes('afternoon') || lowerCat.includes('ice cream') || lowerCat.includes('gelato') || lowerCat.includes('bar') || lowerCat.includes('brewery');
      return isArvo;
    }

    // EVENING (5pm +)
    // Show: Dinner, Drinks
    // Hide: Cafes (unless they do dinner/drinks)
    if (hour >= 17 || hour < 5) { // 5pm to 5am
      const isNight = bestFor.includes('dinner') || bestFor.includes('fancy_dinner') || bestFor.includes('drinks') || bestFor.includes('cocktails') || bestFor.includes('beer') || lowerCat.includes('bar') || lowerCat.includes('pub') || lowerCat.includes('restaurant') || lowerCat.includes('pizza');

      // Explicitly hide morning-only cafes
      const isMorningCafe = lowerCat.includes('cafe') && !bestFor.includes('dinner') && !bestFor.includes('cocktails') && !bestFor.includes('beer');

      return isNight && !isMorningCafe;
    }

    return true;
  });

  const hasAnySpecials = venues.some(v => v.special);

  // Filters

  // Scroll to top on filter change
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [timeFilter, intent]);

  // Memoize map venues to prevent blinking on re-renders
  const mapVenues = useMemo(() => {
    return venuesWithDistance.map(v => ({
      ...v,
      isMatch: filteredVenuesForMap.some(fv => fv.id === v.id)
    }));
  }, [venuesWithDistance, filteredVenuesForMap]);

  return (
    <main className="flex flex-col min-h-screen bg-white dark:bg-black relative">
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
              ref={contentRef}
              className="absolute inset-0 z-10 overflow-y-auto pb-32"
            >
              {/* Smart Header - Now relative so it scrolls away */}
              <header className="relative top-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 shrink-0">
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
                          "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-md scale-105"
                        )}
                      >
                        <List className="w-3.5 h-3.5" />
                        List
                      </button>
                      <button
                        onClick={() => setViewMode('radar')}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300",
                          "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        )}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Radar
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
                        {getIntentOptions(timeFilter.toLowerCase(), new Date()).map((option: any) => (
                          <button
                            key={option.type}
                            onClick={() => {
                              const isSame = intent?.type === option.type || intent === option.label;
                              const newIntent = isSame ? null : option;
                              setIntent(newIntent);
                              if (newIntent) {
                                gtag.event({
                                  action: 'select_intent',
                                  category: 'interaction',
                                  label: option.label
                                });
                              }
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 border whitespace-nowrap",
                              (intent?.type === option.type || intent === option.label)
                                ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg -translate-y-0.5"
                                : "bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-500"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="p-4 space-y-4 max-w-7xl mx-auto pt-6">
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
                      Best for <span className="text-orange-500">{typeof intent === 'string' ? intent : intent.label}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVenuesForList.slice(0, intent ? 3 : filteredVenuesForList.length).map((item) => (
                    <VenueTile
                      key={item.id}
                      venue={item}
                      onClick={() => { }}
                      onNavigate={(e) => {
                        e.stopPropagation();
                        const query = encodeURIComponent(`${item.name}, ${item.address}`);
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
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
                          onClick={() => { }}
                          onNavigate={(e) => {
                            e.stopPropagation();
                            const query = encodeURIComponent(`${item.name}, ${item.address}`);
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
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
                {/* Spacer for bottom nav - increased for Safari */}
                <div className="h-32 md:h-24"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative">
            {/* Radar View Header */}
            <div className="absolute top-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 shrink-0">
              <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="BiteNow Logo"
                    width={120}
                    height={48}
                    className="h-12 w-auto object-contain dark:[filter:invert(1)_hue-rotate(180deg)] transition-all duration-300"
                    priority
                  />
                </div>
                <div className="flex bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-full border border-gray-200/50 dark:border-zinc-700/50 shadow-inner">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300",
                      "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    )}
                  >
                    <List className="w-3.5 h-3.5" />
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('radar')}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300",
                      "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-md scale-105"
                    )}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Radar
                  </button>
                </div>
              </div>
            </div>

            {/* Radar View Container */}
            <div className="w-full h-full bg-black pt-20">
              <RadarView
                venues={mapVenues}
                userLocation={userLocation}
                onUpdateLocation={handleUpdateLocation}
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
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Store className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                    {joinUsVenue ? "Spotted Something?" : "Know a hidden gem?"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {joinUsVenue
                      ? "If you know a special at this venue, let us know!"
                      : "Tell us about a great venue or special we're missing."}
                  </p>
                </div>
                <div className="space-y-3">
                  <textarea
                    className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm min-h-[100px]"
                    placeholder={joinUsVenue ? "e.g. $20 Pizza Night on Tuesdays..." : "Venue name and details..."}
                    value={suggestText}
                    onChange={(e) => setSuggestText(e.target.value)}
                  />
                  <button
                    disabled={!suggestText.trim()}
                    onClick={async () => {
                      // Simple submit logic
                      setSuggestSuccess(true);
                      setTimeout(() => {
                        setShowJoinUs(false);
                      }, 2000);
                    }}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Send it
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-300">
                  <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide">Thanks Legend!</h3>
                  <p className="text-sm text-gray-500 mt-2">We'll check it out.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
