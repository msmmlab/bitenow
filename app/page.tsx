'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Phone, Navigation, Clock, Search, Filter, List, Map as MapIcon, X } from 'lucide-react';
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

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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
        .select('id, name, category, icon, lat, lng')
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
        distanceValue: dist
      };
    }).sort((a, b) => {
      if (a.distanceValue === undefined) return 0;
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
      <header className={`fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shrink-0 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center justify-between mb-3">
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
              onClick={() => setShowHowItWorks(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
            >
              How it works
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-zinc-600 my-auto mx-1"></div>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200",
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
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200",
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
              className="absolute inset-0 z-10 overflow-y-auto pb-20 pt-36"
            >
              <div className="p-4 space-y-4">
                {/* Cold Start Banner */}
                {!loading && !hasAnySpecials && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-2">
                    <p className="text-orange-800 text-sm font-medium leading-tight">
                      We&apos;re new here — deals are rolling in. Want your favourite spot to show specials? Tell them to text us.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                  <span>{hasAnySpecials ? 'Active Specials' : 'Nearby Venues'}</span>
                  <button className="flex items-center gap-1 text-black font-medium text-xs dark:text-white">
                    Closest <Filter className="w-3 h-3" />
                  </button>
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
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-800")}>
                          {item.icon || '🍽️'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{item.distance}</span>
                            <span className="text-gray-300">•</span>
                            <span>{item.category}</span>
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
                          <h4 className="text-lg font-bold text-gray-400 dark:text-zinc-600 pr-8 italic">No special listed yet</h4>
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400 dark:text-zinc-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Check back later — venues update daily</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      {!item.special ? (
                        <button className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-yellow-100 dark:border-yellow-900/30">
                          Activate specials
                        </button>
                      ) : (
                        <>
                          <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                            <Navigation className="w-4 h-4" />
                            Directions
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
                            <Phone className="w-4 h-4" />
                            Call
                          </button>
                        </>
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
          />
        )}
      </div>

      {/* HOW IT WORKS MODAL */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHowItWorks(false)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 relative z-10 w-full max-w-sm border border-gray-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">✨</div>
              <h3 className="text-2xl font-black tracking-tight">How it works</h3>

              <div className="space-y-6 text-left pt-2">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-orange-600 font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-sm">For Users</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Find what&apos;s open nearby. Deals appear automatically when venues text them in.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-green-600 font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-sm">For Owners</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Text your specials to us. No apps, no logins, no fuss. We handle the rest.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowHowItWorks(false)}
                className="w-full bg-black dark:bg-white dark:text-black text-white font-bold py-3 rounded-xl mt-6 shadow-lg active:scale-95 transition-transform"
              >
                Got it
              </button>
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
