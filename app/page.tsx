'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Navigation, Clock, Search, Filter, List, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapView from '@/components/map-view';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// TYPES
interface Special {
  id: string;
  title: string;
  description: string;
  time_desc?: string; // we might store this in description or separate
  restaurant: {
    name: string;
    category: string;
    icon: string;
    lat: number;
    lng: number;
  };
  distance?: string; // calculated client side for now or postgis later
}

const FILTERS = ["Now", "Tonight", "Food", "Drinks", "Deals"];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("Now");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  useEffect(() => {
    async function fetchSpecials() {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('specials')
        .select(`
          id, title, description,
          restaurants (
            name, category, icon, lat, lng
          )
        `)
        .eq('is_active', true)
        .eq('date_local', today);

      if (error) {
        console.error('Error fetching specials:', error);
      } else if (data) {
        const mapped = data.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          restaurant: s.restaurants,
          // Mock distance for MVP demo since we don't have user location yet
          distance: `${(Math.random() * 2).toFixed(1)}km`
        }));
        setSpecials(mapped);
      }
      setLoading(false);
    }

    fetchSpecials();
  }, []);

  return (
    <main className="flex flex-col h-[calc(100vh)] bg-white dark:bg-black relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="BiteNow Logo"
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
            <h1 className="font-bold text-xl tracking-tight">BiteNow</h1>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-zinc-800">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
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
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'list' ? (
          <div className="h-full overflow-y-auto pb-20 p-4 space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500 px-1">
              <span>Active Specials</span>
              <button className="flex items-center gap-1 text-black font-medium text-xs dark:text-white">
                Closest <Filter className="w-3 h-3" />
              </button>
            </div>

            {loading && <div className="p-10 text-center text-gray-500">Loading today's specials...</div>}

            {!loading && specials.length === 0 && (
              <div className="p-10 text-center text-gray-500">
                <p>No specials found for today.</p>
                <p className="text-xs mt-2">Try visiting /api/seed to populate data.</p>
              </div>
            )}

            {specials.map((item) => (
              <div key={item.id} className="group relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-800")}>
                      {item.restaurant.icon || '🍽️'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.restaurant.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{item.distance}</span>
                        <span className="text-gray-300">•</span>
                        <span>{item.restaurant.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-bold">
                    Open
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white pr-8">{item.title}</h4>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {/* Description often contains time in our simpler model */}
                    <span>{item.description || 'Today'}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    <Navigation className="w-4 h-4" />
                    Directions
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                </div>
              </div>
            ))}
            {/* Spacer for bottom nav */}
            <div className="h-16"></div>
          </div>
        ) : (
          <div className="h-full w-full">
            <MapView specials={specials.map(s => ({
              id: s.id,
              venue: s.restaurant.name,
              title: s.title,
              description: s.description,
              category: s.restaurant.category,
              coordinates: [s.restaurant.lng, s.restaurant.lat],
              icon: s.restaurant.icon
            }))} />
          </div>
        )}
      </div>

      {/* Floating Bottom Nav Toggle */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/90 dark:bg-zinc-900/90 backdrop-blur-md text-white dark:text-gray-200 p-1 rounded-full shadow-xl border border-white/10 flex items-center">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-medium text-sm",
              viewMode === 'list' ? "bg-white text-black shadow-sm" : "hover:bg-white/10"
            )}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-medium text-sm",
              viewMode === 'map' ? "bg-white text-black shadow-sm" : "hover:bg-white/10"
            )}
          >
            <MapIcon className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>

    </main>
  );
}
