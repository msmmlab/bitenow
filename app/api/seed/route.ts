import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Create Restaurants
        const restaurants = [
            // Existing
            {
                name: 'Land & Sea',
                slug: 'land-and-sea',
                category: 'Brewery',
                icon: '🍻',
                lat: -26.4200,
                lng: 153.0450,
                address: '19 Venture Drive, Noosaville',
                is_active: true
            },
            {
                name: 'Noosa Burger Co.',
                slug: 'noosa-burger-co',
                category: 'Burger',
                icon: '🍔',
                lat: -26.3960,
                lng: 153.0910,
                address: '10 Hastings St, Noosa Heads',
                is_active: true
            },
            {
                name: 'Sushi Wave',
                slug: 'sushi-wave',
                category: 'Sushi',
                icon: '🍣',
                lat: -26.3940,
                lng: 153.0890,
                address: '5 Hastings St, Noosa Heads',
                is_active: true
            },
            // New Real Restaurants
            { name: 'Sails', slug: 'sails-noosa', category: 'Seafood', icon: '🍷', lat: -26.3868, lng: 153.0929, address: '75 Hastings St', is_active: true },
            { name: "Ricky's River Bar", slug: 'rickys', category: 'Modern Aus', icon: '🥂', lat: -26.3975, lng: 153.0784, address: '2 Quamby Pl', is_active: true },
            { name: 'Bistro C', slug: 'bistro-c', category: 'Beachside', icon: '🌊', lat: -26.3864, lng: 153.0906, address: '49 Hastings St', is_active: true },
            { name: "Lucio's Marina", slug: 'lucios', category: 'Italian', icon: '🍝', lat: -26.3943, lng: 153.0412, address: '2 Parkyn Ct', is_active: true },
            { name: 'Lanai Noosa', slug: 'lanai', category: 'Seafood', icon: '🦐', lat: -26.3978, lng: 153.0641, address: '201 Gympie Tce', is_active: true },
            { name: 'Sum Yung Guys', slug: 'sum-yung-guys', category: 'Asian Fusion', icon: '🥢', lat: -26.4040, lng: 153.0720, address: '205 Weyba Rd', is_active: true },
            { name: 'El Capitano', slug: 'el-capitano', category: 'Pizza', icon: '🍕', lat: -26.3871, lng: 153.0911, address: '52 Hastings St', is_active: true },
            { name: 'Season', slug: 'season-noosa', category: 'Modern', icon: '🍽️', lat: -26.3871, lng: 153.0926, address: '25 Hastings St', is_active: true },
            { name: 'Noosa Boathouse', slug: 'noosa-boathouse', category: 'Seafood', icon: '⛴️', lat: -26.3974, lng: 153.0613, address: '194 Gympie Tce', is_active: true },
            { name: "Miss Moneypenny's", slug: 'miss-moneypennys', category: 'Cocktails', icon: '🍸', lat: -26.3890, lng: 153.0920, address: '6 Hastings St', is_active: true }
        ];

        const { data: createdRestaurants, error: rError } = await supabase
            .from('restaurants')
            .upsert(restaurants, { onConflict: 'slug' })
            .select();

        if (rError) throw rError;

        // 2. Create Contacts (for SMS testing)
        // We'll add a dummy contact for the first one
        if (createdRestaurants && createdRestaurants.length > 0) {
            await supabase.from('restaurant_contacts').upsert({
                restaurant_id: createdRestaurants[0].id,
                contact_name: 'Manager',
                phone_e164: process.env.TWILIO_PHONE_NUMBER || '+15550000000', // Use your own number to test
                verified: true
            }, { onConflict: 'phone_e164' });
        }

        // 3. Create Specials (Today)
        const today = new Date().toISOString().split('T')[0];

        // High-Quality, "Shouting" Ad Copy Templates
        const SPECIAL_TEMPLATES = [
            {
                title: '🔥 CHEESEBURGER EXPLOSION',
                desc: 'Double smashed patty, spicy Jalapeños, house sauce & crispy chips. ONLY $18! Best hangover cure in town.',
                time: '3pm - 4pm'
            },
            {
                title: '🇮🇹 AUTHENTIC LASAGNE LUNCH',
                desc: 'Grandma\'s secret recipe beef lasagne + icy cold soft drink. The perfect midday fuel.',
                time: '12pm - 2pm'
            },
            {
                title: '🌅 SUNSET SPRITZ SESSIONS',
                desc: 'Buy 1 Get 1 FREE Aperol Spritz! Watch the sun go down with the best view in Noosa.',
                time: '4pm - 6pm'
            },
            {
                title: '🦪 $2 OYSTER FRENZY',
                desc: 'Freshly shucked Coffin Bay oysters. Limit 12 per person. Get in before they sell out!',
                time: '3pm - 5pm'
            },
            {
                title: '🥩 STEAK NIGHT MADNESS',
                desc: '250g Rump Steak, chips, salad & choice of sauce. Unbeatable value at $24.',
                time: '5pm - 9pm'
            },
            {
                title: '🌮 TACO TUESDAY TAKEOVER',
                desc: '$5 Fish or Pork Tacos all night long! Live Mariachi band starts at 6pm.',
                time: '5pm - Late'
            },
            {
                title: '🍕 WOODFIRED PIZZA PARTY',
                desc: 'Any Large Pizza + 2 Peroni Beers for just $45. Perfect date night deal.',
                time: 'All Night'
            },
        ];

        // Clear existing for today
        await supabase.from('specials').delete().eq('date_local', today);

        const specials = createdRestaurants?.map((r, i) => {
            let template;
            // Specific overrides for known venues to make them tailored
            if (r.slug === 'noosa-burger-co') {
                template = {
                    title: '🍔 THE ULTIMATE BURGER DEAL',
                    desc: 'Wagyu Beef Burger with truffle mayo, caramelised onions & rosemary fries. Includes a schooner of Stone & Wood!',
                    time: 'Lunch Only'
                };
            } else if (r.slug === 'land-and-sea') {
                template = {
                    title: '🍻 BREWERY BASH',
                    desc: '$10 Pints of our signature Lager! Come cool off after the beach with live acoustic tunes.',
                    time: '12pm - 6pm'
                };
            } else {
                template = SPECIAL_TEMPLATES[Math.floor(Math.random() * SPECIAL_TEMPLATES.length)];
            }

            // Append time to description if we want it part of the text,
            // or we could store it separately. For now, appending for MVP simplicity in display.
            const fullDesc = `${template.desc}`;

            return {
                restaurant_id: r.id,
                title: template.title,
                description: fullDesc,
                // We'll borrow the 'source' field or time_desc if we had it, 
                // but for now let's put the specific time in the description for the MapView to regex or just show.
                // Actually, let's prepend it to description so we can parse it out or just show.
                // Better yet, just use the description field effectively.
                // Let's just pass it through.
                date_local: today,
                is_active: true,
                source: 'seed'
            };
        });

        if (specials) {
            await supabase.from('specials').insert(specials);
        }

        return NextResponse.json({ success: true, message: 'Seeded Noosa data' });

    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
