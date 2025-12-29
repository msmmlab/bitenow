// import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase';

// export async function GET() {
//     try {
//         // 1. Create Restaurants
//         const restaurants = [
//             // Existing
//             {
//                 name: 'Land & Sea',
//                 slug: 'land-and-sea',
//                 category: 'Brewery',
//                 icon: '🍻',
//                 lat: -26.4200,
//                 lng: 153.0450,
//                 address: '19 Venture Drive, Noosaville',
//                 is_active: true
//             },
//             {
//                 name: 'Noosa Burger Co.',
//                 slug: 'noosa-burger-co',
//                 category: 'Burger',
//                 icon: '🍔',
//                 lat: -26.3960,
//                 lng: 153.0910,
//                 address: '10 Hastings St, Noosa Heads',
//                 is_active: true
//             },
//             {
//                 name: 'Sushi Wave',
//                 slug: 'sushi-wave',
//                 category: 'Sushi',
//                 icon: '🍣',
//                 lat: -26.3940,
//                 lng: 153.0890,
//                 address: '5 Hastings St, Noosa Heads',
//                 is_active: true
//             },
//             // New Real Restaurants
//             { name: 'Sails', slug: 'sails-noosa', category: 'Seafood', icon: '🍷', lat: -26.3868, lng: 153.0929, address: '75 Hastings St', is_active: true },
//             { name: "Ricky's River Bar", slug: 'rickys', category: 'Modern Aus', icon: '🥂', lat: -26.3975, lng: 153.0784, address: '2 Quamby Pl', is_active: true },
//             { name: 'Bistro C', slug: 'bistro-c', category: 'Beachside', icon: '🌊', lat: -26.3864, lng: 153.0906, address: '49 Hastings St', is_active: true },
//             { name: "Lucio's Marina", slug: 'lucios', category: 'Italian', icon: '🍝', lat: -26.3943, lng: 153.0412, address: '2 Parkyn Ct', is_active: true },
//             { name: 'Lanai Noosa', slug: 'lanai', category: 'Seafood', icon: '🦐', lat: -26.3978, lng: 153.0641, address: '201 Gympie Tce', is_active: true },
//             { name: 'Sum Yung Guys', slug: 'sum-yung-guys', category: 'Asian Fusion', icon: '🥢', lat: -26.4040, lng: 153.0720, address: '205 Weyba Rd', is_active: true },
//             { name: 'El Capitano', slug: 'el-capitano', category: 'Pizza', icon: '🍕', lat: -26.3871, lng: 153.0911, address: '52 Hastings St', is_active: true },
//             { name: 'Season', slug: 'season-noosa', category: 'Modern', icon: '🍽️', lat: -26.3871, lng: 153.0926, address: '25 Hastings St', is_active: true },
//             { name: 'Noosa Boathouse', slug: 'noosa-boathouse', category: 'Seafood', icon: '⛴️', lat: -26.3974, lng: 153.0613, address: '194 Gympie Tce', is_active: true },
//             { name: "Miss Moneypenny's", slug: 'miss-moneypennys', category: 'Cocktails', icon: '🍸', lat: -26.3890, lng: 153.0920, address: '6 Hastings St', is_active: true }
//         ];

//         const { data: createdRestaurants, error: rError } = await supabase
//             .from('restaurants')
//             .upsert(restaurants, { onConflict: 'slug' })
//             .select();

//         if (rError) throw rError;

//         // 2. Create Contacts (for SMS testing)
//         // We'll add a dummy contact for the first one
//         if (createdRestaurants && createdRestaurants.length > 0) {
//             await supabase.from('restaurant_contacts').upsert({
//                 restaurant_id: createdRestaurants[0].id,
//                 contact_name: 'Manager',
//                 phone_e164: process.env.TWILIO_PHONE_NUMBER || '+15550000000', // Use your own number to test
//                 verified: true
//             }, { onConflict: 'phone_e164' });
//         }

//         // 3. Create Specials (Today)
//         const today = new Date().toISOString().split('T')[0];

//         // High-Quality, "Shouting" Ad Copy Templates
//         const SPECIAL_TEMPLATES = [
//             {
//                 title: '🔥 CHEESEBURGER EXPLOSION',
//                 desc: 'Double smashed patty, spicy Jalapeños, house sauce & crispy chips. ONLY $18! Best hangover cure in town.',
//                 time: '3pm - 4pm'
//             },
//             {
//                 title: '🇮🇹 AUTHENTIC LASAGNE LUNCH',
//                 desc: 'Grandma\'s secret recipe beef lasagne + icy cold soft drink. The perfect midday fuel.',
//                 time: '12pm - 2pm'
//             },
//             {
//                 title: '🌅 SUNSET SPRITZ SESSIONS',
//                 desc: 'Buy 1 Get 1 FREE Aperol Spritz! Watch the sun go down with the best view in Noosa.',
//                 time: '4pm - 6pm'
//             },
//             {
//                 title: '🦪 $2 OYSTER FRENZY',
//                 desc: 'Freshly shucked Coffin Bay oysters. Limit 12 per person. Get in before they sell out!',
//                 time: '3pm - 5pm'
//             },
//             {
//                 title: '🥩 STEAK NIGHT MADNESS',
//                 desc: '250g Rump Steak, chips, salad & choice of sauce. Unbeatable value at $24.',
//                 time: '5pm - 9pm'
//             },
//             {
//                 title: '🌮 TACO TUESDAY TAKEOVER',
//                 desc: '$5 Fish or Pork Tacos all night long! Live Mariachi band starts at 6pm.',
//                 time: '5pm - Late'
//             },
//             {
//                 title: '🍕 WOODFIRED PIZZA PARTY',
//                 desc: 'Any Large Pizza + 2 Peroni Beers for just $45. Perfect date night deal.',
//                 time: 'All Night'
//             },
//         ];

//         // Clear existing for today
//         await supabase.from('specials').delete().eq('date_local', today);

//         const specials = createdRestaurants?.map((r, i) => {
//             let template;
//             // Specific overrides for known venues to make them tailored
//             if (r.slug === 'noosa-burger-co') {
//                 template = {
//                     title: '🍔 THE ULTIMATE BURGER DEAL',
//                     desc: 'Wagyu Beef Burger with truffle mayo, caramelised onions & rosemary fries. Includes a schooner of Stone & Wood!',
//                     time: 'Lunch Only'
//                 };
//             } else if (r.slug === 'land-and-sea') {
//                 template = {
//                     title: '🍻 BREWERY BASH',
//                     desc: '$10 Pints of our signature Lager! Come cool off after the beach with live acoustic tunes.',
//                     time: '12pm - 6pm'
//                 };
//             } else {
//                 template = SPECIAL_TEMPLATES[Math.floor(Math.random() * SPECIAL_TEMPLATES.length)];
//             }

//             // Append time to description if we want it part of the text,
//             // or we could store it separately. For now, appending for MVP simplicity in display.
//             const fullDesc = `${template.desc}`;

//             return {
//                 restaurant_id: r.id,
//                 title: template.title,
//                 description: fullDesc,
//                 // We'll borrow the 'source' field or time_desc if we had it, 
//                 // but for now let's put the specific time in the description for the MapView to regex or just show.
//                 // Actually, let's prepend it to description so we can parse it out or just show.
//                 // Better yet, just use the description field effectively.
//                 // Let's just pass it through.
//                 date_local: today,
//                 is_active: true,
//                 source: 'seed'
//             };
//         });

//         if (specials) {
//             await supabase.from('specials').insert(specials);
//         }

//         return NextResponse.json({ success: true, message: 'Seeded Noosa data' });

//     } catch (error) {
//         return NextResponse.json({ error }, { status: 500 });
//     }
// }


import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Helper for approximate coords (good for seed/demo).
// Later: replace with Google Places import so lat/lng are exact.
const jitter = (base, amount = 0.006) =>
    Number((base + (Math.random() - 0.5) * amount).toFixed(6));

export async function GET() {
    try {
        // Seed config
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        // Town centers (approx)
        const TOWNS = {
            NOOSA: { lat: -26.3968, lng: 153.0906 },
            CALOUNDRA: { lat: -26.8066, lng: 153.1282 },
            MOOLOOLABA: { lat: -26.6810, lng: 153.1191 },
            MAROOCHYDORE: { lat: -26.6506, lng: 153.0933 },
            COOLUM: { lat: -26.5284, lng: 153.0881 },
        };

        // Optional: show an "Activate via SMS" CTA everywhere
        // (You can store this on restaurant rows, or just compute in UI from env)
        const activatePhone =
            process.env.PUBLIC_ACTIVATION_PHONE ||
            process.env.TWILIO_PHONE_NUMBER ||
            "+61XXXXXXXXX";

        // 1) Restaurants (Noosa + new towns)
        const restaurants = [
            // -------------------------
            // NOOSA (existing / sample)
            // -------------------------
            {
                name: "Land & Sea",
                slug: "land-and-sea",
                category: "Brewery",
                icon: "🍻",
                lat: -26.42,
                lng: 153.045,
                address: "19 Venture Drive, Noosaville QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },
            {
                name: "Noosa Burger Co.",
                slug: "noosa-burger-co",
                category: "Burger",
                icon: "🍔",
                lat: -26.396,
                lng: 153.091,
                address: "10 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },
            {
                name: "Sushi Wave",
                slug: "sushi-wave",
                category: "Sushi",
                icon: "🍣",
                lat: -26.394,
                lng: 153.089,
                address: "5 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },
            {
                name: "Sails",
                slug: "sails-noosa",
                category: "Seafood",
                icon: "🍷",
                lat: -26.3868,
                lng: 153.0929,
                address: "75 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },
            {
                name: "Ricky's River Bar",
                slug: "rickys",
                category: "Modern Aus",
                icon: "🥂",
                lat: -26.3975,
                lng: 153.0784,
                address: "2 Quamby Pl, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },
            {
                name: "Bistro C",
                slug: "bistro-c",
                category: "Beachside",
                icon: "🌊",
                lat: -26.3864,
                lng: 153.0906,
                address: "49 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },
            {
                name: "Sum Yung Guys",
                slug: "sum-yung-guys",
                category: "Asian Fusion",
                icon: "🥢",
                lat: -26.404,
                lng: 153.072,
                address: "205 Weyba Rd, Noosaville QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },
            {
                name: "Miss Moneypenny's",
                slug: "miss-moneypennys",
                category: "Cocktails",
                icon: "🍸",
                lat: -26.389,
                lng: 153.092,
                address: "6 Hastings St, Noosa Heads QLD",
                is_active: true,
                town: "Noosa",
                activation_phone: activatePhone,
            },

            // -------------------------
            // CALOUNDRA
            // -------------------------
            {
                name: "Happy Turtle Cafe",
                slug: "happy-turtle-cafe-caloundra",
                category: "Cafe",
                icon: "☕️",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "Happy Valley Playground, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
            },
            {
                name: "Amici Restaurant Pizzeria",
                slug: "amici-caloundra",
                category: "Italian",
                icon: "🍕",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "16 Bulcock St, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
            },
            {
                name: "Drift Bar",
                slug: "drift-bar-caloundra",
                category: "Bar",
                icon: "🍻",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "30 The Esplanade, Bulcock Beach, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
            },
            {
                name: "Golden Beach Tavern",
                slug: "golden-beach-tavern-caloundra",
                category: "Pub",
                icon: "🍺",
                lat: jitter(TOWNS.CALOUNDRA.lat),
                lng: jitter(TOWNS.CALOUNDRA.lng),
                address: "32 Bowman Rd, Caloundra QLD 4551",
                is_active: true,
                town: "Caloundra",
                activation_phone: activatePhone,
            },

            // -------------------------
            // MOOLOOLABA
            // -------------------------
            {
                name: "The Dock Mooloolaba",
                slug: "the-dock-mooloolaba",
                category: "Bar & Grill",
                icon: "🍖",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "123 Parkyn Parade, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
            },
            {
                name: "Rice Boi",
                slug: "rice-boi-mooloolaba",
                category: "Asian",
                icon: "🍜",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "123 Parkyn Parade (The Wharf), Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
            },
            {
                name: "Bella Venezia",
                slug: "bella-venezia-mooloolaba",
                category: "Italian",
                icon: "🍝",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "95 Mooloolaba Esplanade, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
            },
            {
                name: "La Casa Beach Bar Bistro",
                slug: "la-casa-mooloolaba",
                category: "Beach Bar",
                icon: "🌴",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "2/121 Mooloolaba Esplanade, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
            },
            {
                name: "The Colombian Coffee Co.",
                slug: "colombian-coffee-co-mooloolaba",
                category: "Cafe",
                icon: "☕️",
                lat: jitter(TOWNS.MOOLOOLABA.lat),
                lng: jitter(TOWNS.MOOLOOLABA.lng),
                address: "Lot 4/20 Brisbane Rd, Mooloolaba QLD 4557",
                is_active: true,
                town: "Mooloolaba",
                activation_phone: activatePhone,
            },

            // -------------------------
            // MAROOCHYDORE
            // -------------------------
            {
                name: "Giddy Geisha",
                slug: "giddy-geisha-maroochydore",
                category: "Asian",
                icon: "🥢",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "8 Market Lane, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
            },
            {
                name: "Market Bistro",
                slug: "market-bistro-maroochydore",
                category: "Bistro",
                icon: "🍽️",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "8 Market Lane, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
            },
            {
                name: "Duporth Tavern",
                slug: "duporth-tavern-maroochydore",
                category: "Pub",
                icon: "🍺",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "52 Duporth Ave, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
            },
            {
                name: "Bottarga",
                slug: "bottarga-maroochydore",
                category: "Italian",
                icon: "🍝",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "1 Mundoo Blvd, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
            },
            {
                name: "The Colombian Coffee Co. (Duporth Ave)",
                slug: "colombian-coffee-co-duporth-maroochydore",
                category: "Cafe",
                icon: "☕️",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "17 Duporth Ave, Maroochydore QLD",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
            },
            {
                name: "The Sands Tavern",
                slug: "sands-tavern-maroochydore",
                category: "Pub",
                icon: "🍻",
                lat: jitter(TOWNS.MAROOCHYDORE.lat),
                lng: jitter(TOWNS.MAROOCHYDORE.lng),
                address: "Plaza Parade, Maroochydore QLD 4558",
                is_active: true,
                town: "Maroochydore",
                activation_phone: activatePhone,
            },

            // -------------------------
            // COOLUM BEACH
            // -------------------------
            {
                name: "Coolum Surf Club",
                slug: "coolum-surf-club",
                category: "Club",
                icon: "🏄‍♂️",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "1775 David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
            },
            {
                name: "Canteen Kitchen + Bar",
                slug: "canteen-kitchen-bar-coolum",
                category: "Modern",
                icon: "🍸",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "1750 David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
            },
            {
                name: "Coolum Thai Spice",
                slug: "coolum-thai-spice",
                category: "Thai",
                icon: "🍛",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "1812 David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
            },
            {
                name: "Coolum Beach Hotel",
                slug: "coolum-beach-hotel",
                category: "Pub",
                icon: "🍺",
                lat: jitter(TOWNS.COOLUM.lat),
                lng: jitter(TOWNS.COOLUM.lng),
                address: "David Low Way, Coolum Beach QLD 4573",
                is_active: true,
                town: "Coolum Beach",
                activation_phone: activatePhone,
            },
        ];

        // 2) Upsert restaurants
        // Strip out fields that might not be in the Supabase schema yet (town, activation_phone)
        const safeRestaurants = restaurants.map(({ town, activation_phone, ...r }) => r);

        const { data: createdRestaurants, error: rError } = await supabase
            .from("restaurants")
            .upsert(safeRestaurants, { onConflict: "slug" })
            .select();

        if (rError) throw rError;

        // 3) Pessimistic mode: start with 0 specials.
        // Keep DB clean for today's date to avoid old seeded specials showing up.
        await supabase.from("specials").delete().eq("date_local", today);

        // Optional: also clear any "seed" source specials from past (if you want a clean slate)
        // await supabase.from("specials").delete().eq("source", "seed");

        return NextResponse.json({
            success: true,
            message: `Seeded venues (Noosa + Caloundra + Mooloolaba + Maroochydore + Coolum). Specials cleared for ${today}.`,
            venues_seeded: createdRestaurants?.length ?? 0,
            mode: "pessimistic_zero_specials",
        });
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json({
            error: error.message || String(error),
            details: error
        }, { status: 500 });
    }
}
