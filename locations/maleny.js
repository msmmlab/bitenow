// locations/maleny-montville.js
// Batch 1 – core, high-signal venues (no fluff)

module.exports = {
    town: {
        slug: "maleny",
        name: "Maleny",
        slug: "maleny-montville",
        name: "Maleny & Montville",
        region: "Sunshine Coast Hinterland",
        slug: "maleny",
        name: "Maleny",
        center: { lat: -26.7606, lng: 152.8506 }
    },

    venues: [
        // -------------------------
        // Cafes / Breakfast / Coffee
        // -------------------------
        {
            name: "Maple 3 Cafe",
            slug: "maple-3-cafe-maleny",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.758862,
            lng: 152.850776,
            address: "37 Maple St, Maleny QLD 4552",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: [
                "Local favourite for breakfast & brunch",
                "Good coffee with generous meals",
                "Reliable stop in the centre of Maleny"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["locals", "casual", "brunch"]
        },

        {
            name: "The Orangery",
            slug: "the-orangery-montville",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.626908,
            lng: 152.959035,
            address: "Montville Village, Montville QLD 4560",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch", "afternoon"],
            known_for_bullets: [
                "Relaxed village cafe",
                "Great for slow breakfast or lunch",
                "Nice stop while wandering Montville"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["village", "casual", "slow"]
        },

        // -------------------------
        // Casual / Pub / Lunch
        // -------------------------
        {
            name: "Maleny Hotel",
            slug: "maleny-hotel",
            category: "Pub",
            icon: "/icons/beer.png",
            lat: -26.758910,
            lng: 152.854255,
            address: "6-8 Bunya St, Maleny QLD 4552",
            is_active: true,
            best_for: ["beer", "lunch", "dinner", "afternoon"],
            known_for_bullets: [
                "Classic country pub meals",
                "Good value + walk-ins",
                "Easy stop with friends or family"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "locals", "value"]
        },

        {
            name: "Mountain View Cafe",
            slug: "mountain-view-cafe-maleny",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.780318,
            lng: 152.866851,
            address: "Maleny QLD 4552",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: [
                "Cafe classics with hinterland feel",
                "Easy daytime meals",
                "Good stop between activities"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["casual", "daytime"]
        },

        // -------------------------
        // Fancy / Date / Scenic Dining
        // -------------------------
        {
            name: "The Tamarind",
            slug: "the-tamarind-maleny",
            category: "Modern Asian / Fine Dining",
            icon: "/icons/fancy_dinner.png",
            lat: -26.758467,
            lng: 152.853040,
            address: "The Spicers Tamarind Retreat, Maleny QLD 4552",
            is_active: true,
            best_for: ["dinner", "fancy_dinner", "special_occasion"],
            known_for_bullets: [
                "Destination dining in the hinterland",
                "Refined Asian-inspired menu",
                "Best booked for evenings & weekends"
            ],
            price_risk: "high",
            walk_in_friendliness: "low",
            service_speed: "slow",
            formality_level: 3,
            vibe_tags: ["date", "special-occasion", "luxury"],
            booking_likely: true
        },

        {
            name: "Secrets on the Lake",
            slug: "secrets-on-the-lake-montville",
            category: "Modern Australian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.698651,
            lng: 152.871078,
            address: "207 Narrows Rd, North Maleny QLD 4552",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: [
                "Lakeside dining in treehouse-style setting",
                "Perfect for dates or special lunches",
                "Scenic, relaxed but polished"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["views", "date", "scenic"],
            booking_likely: true
        },

        {
            name: "Montville Provodore",
            slug: "montville-provodore",
            category: "European",
            icon: "/icons/wine.png",
            lat: -26.626908,
            lng: 152.959035,
            address: "Montville Village, Montville QLD 4560",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: [
                "Cosy European-style dining",
                "Good wine list",
                "Great for quiet, romantic meals"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["romantic", "village", "wine"],
            booking_likely: true
        },

        // -------------------------
        // Wine / Afternoon / Scenic
        // -------------------------
        {
            name: "Flame Hill Vineyard",
            slug: "flame-hill-vineyard",
            category: "Winery",
            icon: "/icons/wine.png",
            lat: -26.680939,
            lng: 152.877709,
            address: "249 Western Ave, Montville QLD 4560",
            is_active: true,
            best_for: ["afternoon", "lunch", "fancy_dinner"],
            known_for_bullets: [
                "Winery lunches with panoramic views",
                "Great for slow afternoons",
                "Strong ‘special trip’ destination"
            ],
            price_risk: "high",
            walk_in_friendliness: "low",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["views", "wine", "scenic"],
            booking_likely: true
        },

        {
            name: "Clouds Vineyard Restaurant",
            slug: "clouds-vineyard-montville",
            category: "Winery Restaurant",
            icon: "/icons/wine.png",
            lat: -26.684318,
            lng: 152.874318,
            address: "308 Western Ave, Montville QLD 4560",
            is_active: true,
            best_for: ["lunch", "afternoon", "fancy_dinner"],
            known_for_bullets: [
                "Scenic vineyard dining",
                "Great for long lunches",
                "Good balance of casual + nice"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["views", "wine", "relaxed"],
            booking_likely: true
        }
    ]
};
