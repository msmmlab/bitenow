import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Helper for approximate coords (good for seed/demo).
// Later: replace with Google Places import so lat/lng are exact.
const jitter = (base: number, amount: number = 0.006) =>
    Number((base + (Math.random() - 0.5) * amount).toFixed(6));

type WalkIn = "low" | "medium" | "high";
type Speed = "fast" | "medium" | "slow";
type PriceRisk = "low" | "medium" | "high";
type BestTime = "breakfast" | "coffee" | "lunch" | "afternoon" | "dinner" | "late";

type RestaurantSeed = {
    name: string;
    slug: string;
    category: string;
    icon: string;
    lat: number;
    lng: number;
    address: string;
    is_active: boolean;
    town?: string;
    activation_phone?: string;

    // New decision metadata
    formality_level?: 0 | 1 | 2 | 3;
    walk_in_friendliness?: WalkIn;
    service_speed?: Speed;
    price_risk?: PriceRisk;
    best_times?: BestTime[];
    vibe_tags?: string[];
    known_for_bullets?: string[];
    booking_likely?: boolean;

    // Optional legacy field you already use
    recommended_for?: string | null;
};

function defaultsForCategory(categoryRaw: string) {
    const c = (categoryRaw || "").toLowerCase();

    // Surf Clubs / Clubs
    if (c.includes("surf") || c.includes("club")) {
        return {
            formality_level: 0 as const,
            walk_in_friendliness: "high" as const,
            service_speed: "medium" as const,
            price_risk: "low" as const,
            best_times: ["lunch", "afternoon", "dinner"] as BestTime[],
            vibe_tags: ["views", "casual", "family", "locals"] as string[],
            booking_likely: false,
        };
    }

    // Cafes
    if (c.includes("cafe") || c.includes("coffee")) {
        return {
            formality_level: 0 as const,
            walk_in_friendliness: "high" as const,
            service_speed: "fast" as const,
            price_risk: "low" as const,
            best_times: ["coffee", "breakfast", "lunch"] as BestTime[],
            vibe_tags: ["casual", "quick"] as string[],
            booking_likely: false,
        };
    }

    // Breweries / Pubs / Bars
    if (c.includes("brew") || c.includes("pub") || c.includes("bar")) {
        return {
            formality_level: 1 as const,
            walk_in_friendliness: "high" as const,
            service_speed: "medium" as const,
            price_risk: "low" as const,
            best_times: ["afternoon", "dinner", "late"] as BestTime[],
            vibe_tags: ["casual", "lively"] as string[],
            booking_likely: false,
        };
    }

    // Fast casual
    if (c.includes("burger") || c.includes("fish") || c.includes("chips") || c.includes("sushi")) {
        return {
            formality_level: 0 as const,
            walk_in_friendliness: "high" as const,
            service_speed: "fast" as const,
            price_risk: "low" as const,
            best_times: ["lunch", "dinner"] as BestTime[],
            vibe_tags: ["casual", "quick"] as string[],
            booking_likely: false,
        };
    }

    // Asian / Thai
    if (c.includes("thai") || c.includes("asian") || c.includes("fusion")) {
        return {
            formality_level: 1 as const,
            walk_in_friendliness: "medium" as const,
            service_speed: "medium" as const,
            price_risk: "medium" as const,
            best_times: ["lunch", "dinner"] as BestTime[],
            vibe_tags: ["casual", "lively"] as string[],
            booking_likely: false,
        };
    }

    // Italian / Seafood / Modern / Bistro
    if (c.includes("italian") || c.includes("seafood") || c.includes("modern") || c.includes("bistro")) {
        return {
            formality_level: 2 as const,
            walk_in_friendliness: "medium" as const,
            service_speed: "medium" as const,
            price_risk: "medium" as const,
            best_times: ["dinner", "lunch"] as BestTime[],
            vibe_tags: ["date", "views"] as string[],
            booking_likely: true,
        };
    }

    // Default catch-all
    return {
        formality_level: 1 as const,
        walk_in_friendliness: "medium" as const,
        service_speed: "medium" as const,
        price_risk: "medium" as const,
        best_times: ["lunch", "dinner"] as BestTime[],
        vibe_tags: ["casual"] as string[],
        booking_likely: false,
    };
}

function mergeMeta(r: RestaurantSeed): RestaurantSeed {
    const d = defaultsForCategory(r.category);
    return {
        ...r,
        formality_level: r.formality_level ?? d.formality_level,
        walk_in_friendliness: r.walk_in_friendliness ?? d.walk_in_friendliness,
        service_speed: r.service_speed ?? d.service_speed,
        price_risk: r.price_risk ?? d.price_risk,
        best_times: r.best_times ?? d.best_times,
        vibe_tags: r.vibe_tags ?? d.vibe_tags,
        booking_likely: r.booking_likely ?? d.booking_likely,
        known_for_bullets: r.known_for_bullets ?? [],
    };
}

export async function GET() {
    try {
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        const TOWNS = {
            NOOSA: { lat: -26.3968, lng: 153.0906 },
            CALOUNDRA: { lat: -26.8066, lng: 153.1282 },
            MOOLOOLABA: { lat: -26.6810, lng: 153.1191 },
            MAROOCHYDORE: { lat: -26.6506, lng: 153.0933 },
            COOLUM: { lat: -26.5284, lng: 153.0881 },
            SUNSHINE_BEACH: { lat: -26.4129, lng: 153.1050 },
        };

        const activatePhone =
            process.env.PUBLIC_ACTIVATION_PHONE ||
            process.env.TWILIO_PHONE_NUMBER ||
            "+61XXXXXXXXX";

        // Restaurants
        const restaurants: RestaurantSeed[] = [
            // -------------------------
            // NOOSA
            // -------------------------
            {
                name: "Land & Sea",
                slug: "land-and-sea",
                category: "Brewery",
                icon: "/icons/craft_beer.png",
                lat: -26.42,
                lng: 153.045,
                address: "19 Venture Drive, Noosaville QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Small-batch craft beers", "Relaxed brewery lunches", "Casual post-beach sessions"],
                price_risk: "low",
                walk_in_friendliness: "high",
            },
            {
                name: "Noosa Burger Co.",
                slug: "noosa-burger-co",
                category: "Burger",
                icon: "/icons/burger.png",
                lat: -26.396,
                lng: 153.091,
                address: "10 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Big burgers & loaded sides", "Fast casual feeds", "Easy takeaway option"],
                service_speed: "fast",
                price_risk: "low",
                walk_in_friendliness: "high",
            },
            {
                name: "Sushi Wave",
                slug: "sushi-wave",
                category: "Sushi",
                icon: "/icons/sushi.png",
                lat: -26.394,
                lng: 153.089,
                address: "5 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Fresh sushi rolls", "Quick lunch bites", "Light Japanese options"],
                service_speed: "fast",
                price_risk: "low",
                walk_in_friendliness: "high",
            },

            // Added: LOCALE (fancy, booking likely)
            {
                name: "Locale Noosa",
                slug: "locale-noosa",
                category: "Italian (Fine)",
                icon: "/icons/fancy_dinner.png",
                lat: -26.3867,
                lng: 153.0926,
                address: "62 Hastings St, Noosa Heads QLD 4567",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                formality_level: 3,
                walk_in_friendliness: "low",
                service_speed: "slow",
                price_risk: "high",
                best_times: ["dinner", "late", "lunch"],
                vibe_tags: ["date", "special-occasion", "wine"],
                booking_likely: true,
                known_for_bullets: ["Date-night Italian", "Wine-forward dining", "Often best booked for peak times"],
            },

            // Added: NOOSA SURF CLUB (casual, walk-in, views)
            {
                name: "Noosa Surf Club",
                slug: "noosa-surf-club",
                category: "Surf Club",
                icon: "/icons/fish_chips.png",
                lat: -26.3869,
                lng: 153.0929,
                address: "69 Hastings St, Noosa Heads QLD 4567",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Beachfront club meals", "Great views over Main Beach", "Easy walk-in dining"],
                formality_level: 0,
                walk_in_friendliness: "high",
                price_risk: "low",
                best_times: ["lunch", "afternoon", "dinner"],
                vibe_tags: ["views", "casual", "family"],
            },

            {
                name: "Sails",
                slug: "sails-noosa",
                category: "Seafood",
                icon: "/icons/fancy_dinner.png",
                lat: -26.3868,
                lng: 153.0929,
                address: "75 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Premium seafood", "Long lunches by the beach", "Special occasion meals"],
                formality_level: 3,
                walk_in_friendliness: "low",
                service_speed: "slow",
                price_risk: "high",
                best_times: ["lunch", "dinner"],
                vibe_tags: ["views", "date", "special-occasion"],
                booking_likely: true,
            },
            {
                name: "Ricky's River Bar",
                slug: "rickys",
                category: "Modern",
                icon: "/icons/wine.png",
                lat: -26.3975,
                lng: 153.0784,
                address: "2 Quamby Pl, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Riverside dining", "Modern plates", "Cocktails at sunset"],
                formality_level: 2,
                walk_in_friendliness: "medium",
                price_risk: "high",
                best_times: ["afternoon", "dinner"],
                vibe_tags: ["views", "date", "cocktails"],
                booking_likely: true,
            },
            {
                name: "Bistro C",
                slug: "bistro-c",
                category: "Beachside Bistro",
                icon: "/icons/fancy_dinner.png",
                lat: -26.3864,
                lng: 153.0906,
                address: "49 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Beachside bistro classics", "Seafood & cocktails", "Great for sunset meals"],
                formality_level: 2,
                walk_in_friendliness: "medium",
                price_risk: "high",
                best_times: ["lunch", "dinner"],
                vibe_tags: ["views", "date"],
                booking_likely: true,
            },
            {
                name: "Sum Yung Guys",
                slug: "sum-yung-guys",
                category: "Asian Fusion",
                icon: "/icons/asian.png",
                lat: -26.404,
                lng: 153.072,
                address: "205 Weyba Rd, Noosaville QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Share plates & bold flavours", "Busy dinner vibe", "Often worth booking"],
                formality_level: 2,
                walk_in_friendliness: "low",
                price_risk: "medium",
                best_times: ["dinner", "late"],
                vibe_tags: ["lively", "date"],
                booking_likely: true,
            },
            {
                name: "Miss Moneypenny's",
                slug: "miss-moneypennys",
                category: "Cocktail Bar",
                icon: "/icons/wine.png",
                lat: -26.389,
                lng: 153.092,
                address: "6 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Cocktails & late-night energy", "Bar snacks", "Good pre/post-dinner stop"],
                formality_level: 1,
                walk_in_friendliness: "medium",
                service_speed: "medium",
                price_risk: "high",
                best_times: ["afternoon", "dinner", "late"],
                vibe_tags: ["lively", "cocktails"],
            },
            {
                name: "Village Bicycle",
                slug: "village-bicycle",
                category: "Bar & Grill",
                icon: "/icons/craft_beer.png",
                lat: -26.399,
                lng: 153.093,
                address: "Sunshine Beach Rd, Noosa Junction QLD 4567",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Great tap selection", "Burgers that hit the spot", "Easy casual vibe"],
                formality_level: 1,
                walk_in_friendliness: "high",
                price_risk: "medium",
                best_times: ["afternoon", "dinner", "late"],
                vibe_tags: ["casual", "lively"],
            },
            {
                name: "Mr Drifter",
                slug: "mr-drifter",
                category: "Modern Bar",
                icon: "/icons/beer.png",
                lat: -26.398,
                lng: 153.092,
                address: "Sunshine Beach Rd, Noosa Junction QLD 4567",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
                known_for_bullets: ["Kitchen-driven bar food", "Great vibe", "Regular live music nights"],
                formality_level: 1,
                walk_in_friendliness: "medium",
                price_risk: "medium",
                best_times: ["dinner", "late"],
                vibe_tags: ["lively", "music"],
            },

            // Added: SUNSHINE BEACH SURF CLUB
            {
                name: "Sunshine Beach Surf Club",
                slug: "sunshine-beach-surf-club",
                category: "Surf Club",
                icon: "/icons/fish_chips.png",
                lat: jitter(TOWNS.SUNSHINE_BEACH.lat),
                lng: jitter(TOWNS.SUNSHINE_BEACH.lng),
                address: "Corner of Duke St & Belmore Terrace, Sunshine Beach QLD 4567",
                is_active: true,
                town: "Sunshine Beach",
                activation_phone: activatePhone,
                known_for_bullets: ["Big ocean views", "Classic club meals & drinks", "Great casual sunset stop"],
                formality_level: 0,
                walk_in_friendliness: "high",
                price_risk: "low",
                best_times: ["lunch", "afternoon", "dinner"],
                vibe_tags: ["views", "casual", "family", "locals"],
            },

            // -------------------------
            // CALOUNDRA
            // -------------------------
            {
                name: "Happy Turtle Cafe",
                slug: "happy-turtle-cafe-caloundra",
                category: "Cafe",
                icon: "/icons/coffee.png",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "Happy Valley Playground, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
                known_for_bullets: ["Coffee by the water", "Easy breakfasts", "Casual daytime meals"],
            },
            {
                name: "Amici Restaurant Pizzeria",
                slug: "amici-caloundra",
                category: "Italian",
                icon: "/icons/italian.png",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "16 Bulcock St, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
                known_for_bullets: ["Classic pizzas", "Hearty pastas", "Family-friendly dinner"],
            },
            {
                name: "Drift Bar",
                slug: "drift-bar-caloundra",
                category: "Bar",
                icon: "/icons/beer.png",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "30 The Esplanade, Bulcock Beach, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
                known_for_bullets: ["Beachside drinks", "Light meals", "Easy afternoon sessions"],
            },
            {
                name: "Golden Beach Tavern",
                slug: "golden-beach-tavern-caloundra",
                category: "Pub",
                icon: "/icons/burger.png",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "32 Bowman Rd, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
                known_for_bullets: ["Pub classics", "Cold beers", "Group-friendly meals"],
            },

            // Added: CALOUNDRA SURF CLUB (Kings Beach)
            {
                name: "Caloundra Surf Club (Kings Beach)",
                slug: "caloundra-surf-club-kings-beach",
                category: "Surf Club",
                icon: "/icons/fish_chips.png",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "1 Spender Ln, Kings Beach QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
                known_for_bullets: ["Beachfront club meals", "Relaxed walk-in dining", "Great value for groups"],
                formality_level: 0,
                walk_in_friendliness: "high",
                price_risk: "low",
                best_times: ["lunch", "afternoon", "dinner"],
                vibe_tags: ["views", "casual", "family"],
            },

            // -------------------------
            // MOOLOOLABA
            // -------------------------
            {
                name: "The Dock Mooloolaba",
                slug: "the-dock-mooloolaba",
                category: "Bar & Grill",
                icon: "/icons/burger.png",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "123 Parkyn Parade, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
                known_for_bullets: ["Grill favourites", "Marina-side meals", "Good for groups"],
            },
            {
                name: "Rice Boi",
                slug: "rice-boi-mooloolaba",
                category: "Asian",
                icon: "/icons/asian.png",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "The Wharf, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
                known_for_bullets: ["Bold flavours", "Casual bowls & share plates", "Great quick dinner option"],
            },
            {
                name: "Bella Venezia",
                slug: "bella-venezia-mooloolaba",
                category: "Italian",
                icon: "/icons/italian.png",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "95 Mooloolaba Esplanade, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
                known_for_bullets: ["Traditional Italian", "Long relaxed meals", "Solid date-night choice"],
            },
            {
                name: "La Casa Beach Bar Bistro",
                slug: "la-casa-mooloolaba",
                category: "Beach Bar",
                icon: "/icons/beer.png",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "2/121 Mooloolaba Esplanade, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
                known_for_bullets: ["Beachfront bistro meals", "Daytime cocktails", "Great afternoon vibe"],
            },
            {
                name: "The Colombian Coffee Co.",
                slug: "colombian-coffee-co-mooloolaba",
                category: "Cafe",
                icon: "/icons/coffee.png",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "20 Brisbane Rd, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
                known_for_bullets: ["Specialty coffee", "Quick stop", "Easy takeaway"],
            },

            // Added: MOOLOOLABA SURF CLUB
            {
                name: "The Surf Club Mooloolaba",
                slug: "mooloolaba-surf-club",
                category: "Surf Club",
                icon: "/icons/fish_chips.png",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "1 The Esplanade, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
                known_for_bullets: ["Beachfront dining & drinks", "All-day casual meals", "Big views over the beach"],
                formality_level: 0,
                walk_in_friendliness: "high",
                price_risk: "low",
                best_times: ["lunch", "afternoon", "dinner"],
                vibe_tags: ["views", "casual", "family", "locals"],
            },

            // -------------------------
            // MAROOCHYDORE
            // -------------------------
            {
                name: "Giddy Geisha",
                slug: "giddy-geisha-maroochydore",
                category: "Asian",
                icon: "/icons/asian.png",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "8 Market Lane, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
                known_for_bullets: ["Modern Japanese fusion", "Share plates", "Good dinner spot"],
            },
            {
                name: "Market Bistro",
                slug: "market-bistro-maroochydore",
                category: "Bistro",
                icon: "/icons/fancy_dinner.png",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "8 Market Lane, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
                known_for_bullets: ["Seasonal bistro dishes", "Casual sit-down meals", "Good for couples"],
            },
            {
                name: "Duporth Tavern",
                slug: "duporth-tavern-maroochydore",
                category: "Pub",
                icon: "/icons/beer.png",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "52 Duporth Ave, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
                known_for_bullets: ["Hearty pub meals", "Easy group dining", "No-fuss value"],
            },
            {
                name: "Bottarga",
                slug: "bottarga-maroochydore",
                category: "Italian",
                icon: "/icons/italian.png",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "1 Mundoo Blvd, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
                known_for_bullets: ["Modern Italian flavours", "Fresh pasta focus", "Refined dinner option"],
                formality_level: 2,
                price_risk: "high",
                booking_likely: true,
            },
            {
                name: "The Colombian Coffee Co. (Duporth Ave)",
                slug: "colombian-coffee-co-duporth-maroochydore",
                category: "Cafe",
                icon: "/icons/coffee.png",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "17 Duporth Ave, Maroochydore QLD",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
                known_for_bullets: ["Quality coffee", "Light bites", "Quick takeaway"],
            },
            {
                name: "The Sands Tavern",
                slug: "sands-tavern-maroochydore",
                category: "Pub",
                icon: "/icons/beer.png",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "Plaza Parade, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
                known_for_bullets: ["Pub meals & beers", "Sports-friendly vibe", "Easygoing catch-ups"],
            },

            // -------------------------
            // COOLUM BEACH
            // -------------------------
            {
                name: "Coolum Surf Club",
                slug: "coolum-surf-club",
                category: "Surf Club",
                icon: "/icons/fish_chips.png",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "1775 David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
                known_for_bullets: ["Club classics & big portions", "Relaxed beachfront dining", "Easy for families"],
            },
            {
                name: "Canteen Kitchen + Bar",
                slug: "canteen-kitchen-bar-coolum",
                category: "Modern",
                icon: "/icons/fancy_dinner.png",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "1750 David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
                known_for_bullets: ["All-day modern menu", "Casual but polished", "Good mixed groups"],
            },
            {
                name: "Coolum Thai Spice",
                slug: "coolum-thai-spice",
                category: "Thai",
                icon: "/icons/thai.png",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "1812 David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
                known_for_bullets: ["Curries & stir-fries", "Reliable Thai comfort", "Good value dinner"],
            },
            {
                name: "Coolum Beach Hotel",
                slug: "coolum-beach-hotel",
                category: "Pub",
                icon: "/icons/beer.png",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
                known_for_bullets: ["Pub bistro meals", "Group-friendly", "Easy casual drinks"],
            },
        ].map(mergeMeta);

        // Optional legacy recommended_for (keep if your UI uses it)
        // If you want, you can drop this entirely and render known_for_bullets instead.
        const RECOMMENDATIONS: Record<string, string> = {
            "locale-noosa": "Date-night Italian on Hastings Street — tends to suit ‘Tonight’ more than ‘Now’.",
            "noosa-surf-club": "Classic surf club meals with one of the best views on Main Beach.",
            "sunshine-beach-surf-club": "Ocean views + casual surf-club value — great for walk-ins.",
            "mooloolaba-surf-club": "All-day dining right on the sand — easy beers, meals, and views.",
            "caloundra-surf-club-kings-beach": "Walk-in friendly surf club on Kings Beach — great for groups and value.",
        };

        // 2) Upsert restaurants
        const safeRestaurants = restaurants.map((r) => ({
            name: r.name,
            slug: r.slug,
            category: r.category,
            icon: r.icon,
            lat: r.lat,
            lng: r.lng,
            address: r.address,
            is_active: r.is_active,

            // Existing field you already use
            recommended_for: RECOMMENDATIONS[r.slug] || r.recommended_for || null,

            // New metadata fields (ensure these columns exist in Supabase)
            formality_level: r.formality_level,
            walk_in_friendliness: r.walk_in_friendliness,
            service_speed: r.service_speed,
            price_risk: r.price_risk,
            best_times: r.best_times,
            vibe_tags: r.vibe_tags,
            known_for_bullets: r.known_for_bullets,
            booking_likely: r.booking_likely,
        }));

        const { data: createdRestaurants, error: rError } = await supabase
            .from("restaurants")
            .upsert(safeRestaurants, { onConflict: "slug" })
            .select();

        if (rError) throw rError;

        // 3) Pessimistic mode: start with 0 specials
        await supabase.from("specials").delete().eq("date_local", today);

        return NextResponse.json({
            success: true,
            message: `Seeded venues + metadata. Specials cleared for ${today}.`,
            venues_seeded: createdRestaurants?.length ?? 0,
            mode: "pessimistic_zero_specials",
        });
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json(
            { error: error.message || String(error), details: error },
            { status: 500 }
        );
    }
}
