// locations/caloundra.js
module.exports = {
    town: {
        slug: "caloundra",
        name: "Caloundra",
        slug: "caloundra",
        name: "Caloundra",
        region: "Sunshine Coast",
        slug: "caloundra",
        name: "Caloundra",
        center: { lat: -26.8066, lng: 153.1282 },
    },

    venues: [
        // --- Batch 1: Caloundra / Kings Beach / Bulcock Beach / Golden Beach / Dicky Beach ---

        {
            name: "White Picket Fence Cafe",
            slug: "white-picket-fence-caloundra",
            category: "Cafe / Brunch",
            icon: "/icons/coffee.png",
            lat: -26.804653,
            lng: 153.126700,
            address: "140 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: ["All-day brunch vibe", "Good coffee", "Easy daytime sit-down"],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["brunch", "casual", "central"]
        },

        {
            name: "Coffee Cat on Kings Beach",
            slug: "coffee-cat-kings-beach",
            category: "Beachfront Cafe",
            icon: "/icons/coffee.png",
            lat: -26.804220,
            lng: 153.139789,
            address: "Shop 4, 1/8 Levuka Ave, Kings Beach QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch", "afternoon"],
            known_for_bullets: ["Beachfront café views", "Great breakfast/lunch stop", "Often a lively atmosphere"],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["views", "beach", "casual"]
        },

        {
            name: "Pholklore Caloundra",
            slug: "pholklore-caloundra",
            category: "Vietnamese / Pho",
            icon: "/icons/asian.png",
            lat: -26.804885,
            lng: 153.129030,
            address: "110 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["lunch", "dinner"],
            known_for_bullets: ["Pho + rice paper rolls", "Fast, casual dining", "Good when you want something filling but not heavy"],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "quick", "no-bookings"]
        },

        {
            name: "Tides Waterfront Dining",
            slug: "tides-waterfront-dining-caloundra",
            category: "Seafood / Waterfront",
            icon: "/icons/fancy_dinner.png",
            lat: -26.806840,
            lng: 153.134191,
            address: "Cnr Minchinton St & The Esplanade, Bulcock Beach QLD 4551",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: ["Waterfront views", "Seafood-leaning sit-down dining", "Good ‘proper dinner’ option"],
            price_risk: "high",
            walk_in_friendliness: "low",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["views", "date", "special-occasion"],
            booking_likely: true
        },

        {
            name: "Three Restaurant Bar & Grill",
            slug: "three-bar-and-grill-caloundra",
            category: "Modern Australian / Grill",
            icon: "/icons/fancy_dinner.png",
            lat: -26.804280,
            lng: 153.127932,
            address: "1/115 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: ["Steaks + modern grill menu", "Feels like a ‘nice night out’", "Good for celebrations"],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["date", "polished", "steak"],
            booking_likely: true
        },

        {
            name: "Alfie’s Mooo Char & Bar",
            slug: "alfies-mooo-char-bar-caloundra",
            category: "Steak / Char Grill",
            icon: "/icons/fancy_dinner.png",
            lat: -26.804559,
            lng: 153.130377,
            address: "Cnr The Esplanade & Otranto Ave, Bulcock Beach QLD 4551",
            is_active: true,
            best_for: ["dinner", "fancy_dinner", "late_night"],
            known_for_bullets: ["Char-grilled steaks", "Good for a ‘big meal’ night", "Pairs well with cocktails/wine"],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["steak", "date", "buzz"],
            booking_likely: true
        },

        {
            name: "Bamboo Garden",
            slug: "bamboo-garden-caloundra",
            category: "Chinese",
            icon: "/icons/asian.png",
            lat: -26.804360,
            lng: 153.129389,
            address: "95 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["dinner"],
            known_for_bullets: ["Classic Chinese favourites", "Reliable ‘easy dinner’ pick", "Good for groups/families"],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["family", "groups", "casual"]
        },

        {
            name: "CHILL 89 Cafe / Bistro",
            slug: "chill-89-golden-beach",
            category: "Cafe / Bistro / Bar",
            icon: "/icons/coffee.png",
            lat: -26.817254,
            lng: 153.120974,
            address: "89 Esplanade, Golden Beach QLD 4551",
            is_active: true,
            best_for: ["coffee", "breakfast", "lunch", "afternoon", "dinner"],
            known_for_bullets: ["Waterfront casual dining", "Good all-rounder for mixed groups", "Nice easy sunset stop"],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["waterfront", "casual", "family"]
        },

        {
            name: "The Giggling Goat Emporium",
            slug: "giggling-goat-emporium-dicky-beach",
            category: "Cafe / Breakfast",
            icon: "/icons/coffee.png",
            lat: -26.783606,
            lng: 153.137399,
            address: "14 Beerburrum St, Dicky Beach QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: ["Breakfast-first café", "Local favourite vibe", "Good for a relaxed morning feed"],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["locals", "brunch", "casual"]
        },
        {
            name: "Cafe Sisily",
            slug: "cafe-sisily-caloundra",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.804301,
            lng: 153.128602,
            address: "111 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: [
                "Classic café breakfasts",
                "Good coffee + fast service",
                "Reliable daytime option"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "quick", "locals"]
        },

        {
            name: "Indiyum Fair Dinkum Indian",
            slug: "indiyum-fair-dinkum-indian-caloundra",
            category: "Indian",
            icon: "/icons/asian.png",
            lat: -26.804637,
            lng: 153.130231,
            address: "81 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["dinner", "late_night"],
            known_for_bullets: [
                "Proper curry house",
                "Great for takeaway or sit-down",
                "Good spice levels + value"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["casual", "hearty", "comfort-food"]
        },

        {
            name: "Thai Lime Twist",
            slug: "thai-lime-twist-caloundra",
            category: "Thai",
            icon: "/icons/asian.png",
            lat: -26.804977,
            lng: 153.130899,
            address: "78 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["lunch", "dinner"],
            known_for_bullets: [
                "Classic Thai favourites",
                "Fast casual dinner pick",
                "Good for groups"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "groups", "quick"]
        },

        {
            name: "The Good Place",
            slug: "the-good-place-kings-beach",
            category: "Cafe / Brunch",
            icon: "/icons/coffee.png",
            lat: -26.804417,
            lng: 153.140097,
            address: "4/8 Levuka Ave, Kings Beach QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: [
                "Popular Kings Beach brunch spot",
                "Good coffee + modern plates",
                "Often busy on weekends"
            ],
            price_risk: "medium",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["brunch", "beach", "locals"]
        },

        {
            name: "Kings Beach Bar",
            slug: "kings-beach-bar",
            category: "Bar",
            icon: "/icons/beer.png",
            lat: -26.802577,
            lng: 153.141443,
            address: "1 Ormonde Tce, Kings Beach QLD 4551",
            is_active: true,
            best_for: ["beer", "afternoon", "late_night"],
            known_for_bullets: [
                "Beachside bar energy",
                "Good for sunset beers",
                "Casual drop-in vibe"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["views", "casual", "sunset"]
        },

        {
            name: "Mets on Kings",
            slug: "mets-on-kings",
            category: "Modern Australian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.804220,
            lng: 153.139789,
            address: "2/10 Levuka Ave, Kings Beach QLD 4551",
            is_active: true,
            best_for: ["dinner", "fancy_dinner"],
            known_for_bullets: [
                "Modern Australian sit-down dining",
                "Good for date nights",
                "Quieter than Bulcock Street"
            ],
            price_risk: "high",
            walk_in_friendliness: "low",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["date", "calm", "polished"],
            booking_likely: true
        },

        {
            name: "Currimundi Hotel",
            slug: "currimundi-hotel",
            category: "Pub",
            icon: "/icons/burger.png",
            lat: -26.776032,
            lng: 153.132183,
            address: "32 Buderim St, Currimundi QLD 4551",
            is_active: true,
            best_for: ["beer", "lunch", "dinner"],
            known_for_bullets: [
                "Classic pub meals",
                "Good for families & groups",
                "Easy walk-in option"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "family", "value"]
        },

        {
            name: "Dicky Beach Surf Club",
            slug: "dicky-beach-surf-club",
            category: "Surf Club",
            icon: "/icons/fish_chips.png",
            lat: -26.782865,
            lng: 153.134383,
            address: "1 Beerburrum St, Dicky Beach QLD 4551",
            is_active: true,
            best_for: ["lunch", "afternoon", "dinner", "beer"],
            known_for_bullets: [
                "Big ocean views",
                "Great value club meals",
                "Easy family-friendly option"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["views", "casual", "family"]
        },

        {
            name: "One Block Back",
            slug: "one-block-back-dicky-beach",
            category: "Cafe / Brunch",
            icon: "/icons/coffee.png",
            lat: -26.783774,
            lng: 153.138547,
            address: "6 Beerburrum St, Dicky Beach QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: [
                "Local favourite café",
                "Strong coffee + modern brunch",
                "Worth the short walk from the beach"
            ],
            price_risk: "medium",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["locals", "brunch", "quality"]
        },

        {
            name: "Monica's on the Beach",
            slug: "monicas-on-the-beach-caloundra",
            category: "Seafood / Italian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.806840,
            lng: 153.134191,
            address: "47 The Esplanade, Bulcock Beach QLD 4551",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: [
                "Italian + seafood classics",
                "Beachfront dining experience",
                "Good for long lunches or date nights"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["views", "date", "classic"],
            booking_likely: true
        },
        {
            name: "The Pocket Espresso Bar",
            slug: "the-pocket-espresso-bar-moffat-beach",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.789511,
            lng: 153.142694,
            address: "1 Seaview Terrace, Moffat Beach QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "afternoon"],
            known_for_bullets: [
                "Legendary Moffat coffee stop",
                "Perfect pre- or post-beach",
                "Fast, quality caffeine hit"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["locals", "beach", "quick"]
        },

        {
            name: "One on La Balsa",
            slug: "one-on-la-balsa-moffat-beach",
            category: "Cafe / Brunch",
            icon: "/icons/coffee.png",
            lat: -26.835119,
            lng: 153.116229,
            address: "La Balsa Park, Moffat Beach QLD 4551",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: [
                "Brunch with ocean views",
                "Good for relaxed mornings",
                "Popular with locals + families"
            ],
            price_risk: "medium",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["brunch", "views", "locals"]
        },

        {
            name: "Moffat Beach Brewing Co",
            slug: "moffat-beach-brewing-co",
            category: "Brewery",
            icon: "/icons/craft_beer.png",
            lat: -26.796769,
            lng: 153.118144,
            address: "51-55 Industrial Ave, Caloundra West QLD 4551",
            is_active: true,
            best_for: ["beer", "afternoon", "dinner", "late_night"],
            known_for_bullets: [
                "Flagship Sunshine Coast brewery",
                "Food trucks + beer hall vibe",
                "Great for groups & casual nights"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["lively", "groups", "beer"]
        },

        {
            name: "Kings Beach Tavern",
            slug: "kings-beach-tavern",
            category: "Pub",
            icon: "/icons/burger.png",
            lat: -26.804356,
            lng: 153.123392,
            address: "20 Bowman Rd, Kings Beach QLD 4551",
            is_active: true,
            best_for: ["beer", "lunch", "dinner"],
            known_for_bullets: [
                "Classic Aussie pub",
                "Reliable pub meals",
                "Good fallback when busy elsewhere"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "locals", "value"]
        },

        {
            name: "The Beach House Moffat",
            slug: "the-beach-house-moffat",
            category: "Modern Australian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.790021,
            lng: 153.142444,
            address: "52 Queen of Colonies Parade, Moffat Beach QLD 4551",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: [
                "Modern coastal dining",
                "Good for date nights",
                "Less hectic than Hastings-style strips"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["date", "coastal", "polished"],
            booking_likely: true
        },

        {
            name: "Lamkin Lane Espresso",
            slug: "lamkin-lane-espresso-caloundra",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.804629,
            lng: 153.130118,
            address: "2/47 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["coffee", "breakfast"],
            known_for_bullets: [
                "Small laneway coffee bar",
                "Quick espresso stop",
                "Good grab-and-go option"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["quick", "locals"]
        },

        {
            name: "Tides Waterfront Dining",
            slug: "tides-waterfront-dining-golden-beach",
            category: "Modern Australian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.807688,
            lng: 153.123028,
            address: "Cnr Landsborough Parade & Victoria Tce, Golden Beach QLD 4551",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: [
                "Waterfront sit-down dining",
                "Good for celebrations",
                "Relaxed but polished atmosphere"
            ],
            price_risk: "high",
            walk_in_friendliness: "low",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["views", "date", "calm"],
            booking_likely: true
        },

        {
            name: "De Lish Fish @ Kings",
            slug: "de-lish-fish-kings-beach",
            category: "Fish & Chips",
            icon: "/icons/fish_chips.png",
            lat: -26.803653,
            lng: 153.140929,
            address: "Shop 1/6 Ormonde Tce, Kings Beach QLD 4551",
            is_active: true,
            best_for: ["lunch", "afternoon"],
            known_for_bullets: [
                "Classic fish & chips",
                "Easy beach takeaway",
                "Quick, affordable feeds"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "beach", "quick"]
        },

        {
            name: "Grounded Coffee Co",
            slug: "grounded-coffee-co-caloundra",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.804500,
            lng: 153.132968,
            address: "6/45 Bulcock St, Caloundra QLD 4551",
            is_active: true,
            best_for: ["coffee", "breakfast", "afternoon"],
            known_for_bullets: [
                "Reliable local coffee",
                "Good for quick breaks",
                "Friendly local crowd"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["locals", "casual"]
        }

    ]
};
