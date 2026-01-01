// locations/mooloolaba.js
module.exports = {
    town: {
        slug: "mooloolaba",
        name: "Mooloolaba",
        region: "Sunshine Coast",
        center: { lat: -26.6810, lng: 153.1191 },
    },

    venues: [
        {
            name: "Mooloolaba Surf Club",
            slug: "mooloolaba-surf-club",
            category: "Surf Club",
            icon: "/icons/fish_chips.png",
            lat: -26.683853,
            lng: 153.119740,
            address: "Corner of Parkyn Parade & River Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["lunch", "afternoon", "dinner", "beer"],
            known_for_bullets: [
                "Beachfront club meals",
                "Great value + ocean views",
                "Easy walk-in dining"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["views", "casual", "family"]
        },

        {
            name: "The Dock Mooloolaba",
            slug: "the-dock-mooloolaba",
            category: "Bar & Grill",
            icon: "/icons/beer.png",
            lat: -26.683680,
            lng: 153.122181,
            coords_source: "address",
            coords_accuracy: "high",
            address: "123 Parkyn Parade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["beer", "lunch", "dinner", "late_night"],
            known_for_bullets: [
                "Big pub-style venue",
                "Good for groups",
                "Reliable food + drinks"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["casual", "groups", "lively"]
        },

        {
            name: "Rice Boi",
            slug: "rice-boi-mooloolaba",
            category: "Asian",
            icon: "/icons/asian.png",
            lat: -26.684383,
            lng: 153.126409,
            coords_source: "address",
            coords_accuracy: "high",
            address: "The Wharf, Parkyn Parade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["lunch", "dinner", "late_night"],
            known_for_bullets: [
                "Fast Asian bowls + share plates",
                "Great flavour without formality",
                "Works well for casual dinners"
            ],
            price_risk: "medium",
            walk_in_friendliness: "medium",
            service_speed: "fast",
            formality_level: 1,
            vibe_tags: ["lively", "casual"]
        },

        {
            name: "See Restaurant",
            slug: "see-restaurant-mooloolaba",
            category: "Modern Australian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.684383,
            lng: 153.126409,
            coords_source: "address",
            coords_accuracy: "high",
            address: "The Wharf, Parkyn Parade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["dinner", "fancy_dinner"],
            known_for_bullets: [
                "Waterfront fine dining",
                "Good for date nights",
                "Best booked ahead"
            ],
            price_risk: "high",
            walk_in_friendliness: "low",
            service_speed: "slow",
            formality_level: 3,
            vibe_tags: ["date", "special-occasion", "views"],
            booking_likely: true
        },

        {
            name: "La Casa Beach Bar & Bistro",
            slug: "la-casa-mooloolaba",
            category: "Beach Bar",
            icon: "/icons/beer.png",
            lat: -26.678464,
            lng: 153.117299,
            coords_source: "address",
            coords_accuracy: "high",
            address: "121 Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["afternoon", "beer", "dinner"],
            known_for_bullets: [
                "Beach bar energy",
                "Good cocktails + casual meals",
                "Great sunset stop"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 1,
            vibe_tags: ["beach", "casual", "sunset"]
        },

        {
            name: "Bella Venezia",
            slug: "bella-venezia-mooloolaba",
            category: "Italian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.678804,
            lng: 153.118127,
            coords_source: "address",
            coords_accuracy: "high",
            address: "95 Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["dinner", "fancy_dinner"],
            known_for_bullets: [
                "High-end Italian dining",
                "Special occasion favourite",
                "Classic white-tablecloth vibe"
            ],
            price_risk: "high",
            walk_in_friendliness: "low",
            service_speed: "slow",
            formality_level: 3,
            vibe_tags: ["date", "special-occasion"],
            booking_likely: true
        },

        {
            name: "Spice Bar Mooloolaba",
            slug: "spice-bar-mooloolaba",
            category: "Asian Fusion",
            icon: "/icons/asian.png",
            lat: -26.678232,
            lng: 153.118042,
            coords_source: "address",
            coords_accuracy: "high",
            address: "8/59 Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["dinner", "late_night"],
            known_for_bullets: [
                "Asian fusion + cocktails",
                "Night-time energy",
                "Good for groups"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 1,
            vibe_tags: ["lively", "cocktails"]
        },

        {
            name: "Augello's Ristorante",
            slug: "augellos-ristorante-mooloolaba",
            category: "Italian",
            icon: "/icons/italian.png",
            lat: -26.678232,
            lng: 153.118042,
            address: "Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["lunch", "dinner"],
            known_for_bullets: [
                "Classic Italian favourites",
                "Good people-watching spot",
                "Reliable sit-down meals"
            ],
            price_risk: "medium",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 1,
            vibe_tags: ["casual", "touristy"]
        },

        {
            name: "De Ja Vu Café",
            slug: "deja-vu-cafe-mooloolaba",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.678232,
            lng: 153.118042,
            address: "Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["breakfast", "coffee", "lunch"],
            known_for_bullets: [
                "Busy beachfront cafe",
                "All-day breakfast classics",
                "Fast turnover"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["busy", "casual", "beach"]
        },

        {
            name: "The Colombian Coffee Co (Mooloolaba)",
            slug: "colombian-coffee-co-mooloolaba",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.687178,
            lng: 153.115770,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Brisbane Rd, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["coffee", "breakfast"],
            known_for_bullets: [
                "Specialty coffee",
                "Quick grab-and-go",
                "Reliable morning stop"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["quick", "locals"]
        },
        {
            name: "The Wharf Tavern",
            slug: "wharf-tavern-mooloolaba",
            category: "Pub",
            icon: "/icons/beer.png",
            lat: -26.684383,
            lng: 153.126409,
            coords_source: "address",
            coords_accuracy: "high",
            address: "The Wharf, Parkyn Parade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["beer", "afternoon", "dinner"],
            known_for_bullets: [
                "Classic pub meals",
                "Cold beers by the marina",
                "Easy walk-in venue"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "locals", "groups"]
        },

        {
            name: "Fish on Parkyn",
            slug: "fish-on-parkyn-mooloolaba",
            category: "Seafood",
            icon: "/icons/fish_chips.png",
            lat: -26.684383,
            lng: 153.126409,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Parkyn Parade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["lunch", "dinner"],
            known_for_bullets: [
                "Fresh fish & chips",
                "Fast takeaway-style seafood",
                "Good when you want simple + filling"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["quick", "casual", "seafood"]
        },

        {
            name: "The Beach Bar & Grill",
            slug: "beach-bar-grill-mooloolaba",
            category: "Bar & Grill",
            icon: "/icons/beer.png",
            lat: -26.678232,
            lng: 153.118042,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["beer", "afternoon", "dinner"],
            known_for_bullets: [
                "Relaxed beachfront meals",
                "Easy drinks after the beach",
                "Works well for groups"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 1,
            vibe_tags: ["beach", "casual"]
        },

        {
            name: "Via Italia",
            slug: "via-italia-mooloolaba",
            category: "Italian",
            icon: "/icons/italian.png",
            lat: -26.678232,
            lng: 153.118042,
            address: "Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["lunch", "dinner"],
            known_for_bullets: [
                "Classic Italian comfort food",
                "Reliable pizzas & pasta",
                "Good sit-down option without formality"
            ],
            price_risk: "medium",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 1,
            vibe_tags: ["casual", "family"]
        },

        {
            name: "Shot House Brew Bar",
            slug: "shot-house-brew-bar-mooloolaba",
            category: "Craft Beer Bar",
            icon: "/icons/craft_beer.png",
            lat: -26.678232,
            lng: 153.118042,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["beer", "afternoon", "late_night"],
            known_for_bullets: [
                "Large craft beer range",
                "Good for tastings",
                "Casual but serious about beer"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["beer", "locals", "chill"]
        },

        {
            name: "The Good Bar",
            slug: "the-good-bar-mooloolaba",
            category: "Cocktail Bar",
            icon: "/icons/wine.png",
            lat: -26.678232,
            lng: 153.118042,
            address: "Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["afternoon", "dinner", "late_night"],
            known_for_bullets: [
                "Cocktails + small plates",
                "Good pre-dinner stop",
                "Relaxed evening vibe"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 1,
            vibe_tags: ["cocktails", "date"]
        },

        {
            name: "The Velo Project",
            slug: "velo-project-mooloolaba",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.679415,
            lng: 153.116293,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Venning St, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["coffee", "breakfast", "lunch"],
            known_for_bullets: [
                "Cyclist-friendly cafe",
                "Good coffee + light meals",
                "Laid-back morning spot"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["locals", "casual"]
        },

        {
            name: "The Milk Bar Coffee Co",
            slug: "milk-bar-coffee-mooloolaba",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.681783,
            lng: 153.118854,
            address: "Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["coffee", "breakfast"],
            known_for_bullets: [
                "Specialty coffee",
                "Quick takeaway",
                "Good early-morning option"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["quick", "locals"]
        },

        {
            name: "Ocean Shepherd Espresso & Wine",
            slug: "ocean-shepherd-espresso-wine",
            category: "Cafe / Wine Bar",
            icon: "/icons/wine.png",
            lat: -26.678232,
            lng: 153.118042,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Mooloolaba Esplanade, Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["coffee", "breakfast", "afternoon"],
            known_for_bullets: [
                "Coffee by day, wine later",
                "Good people-watching spot",
                "Nice transition from beach to bar"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 1,
            vibe_tags: ["casual", "chill"]
        },
        {
            name: "Alex Surf Club",
            slug: "alex-surf-club",
            category: "Surf Club",
            icon: "/icons/fish_chips.png",
            lat: -26.668963,
            lng: 153.107519,
            coords_source: "address",
            coords_accuracy: "high",
            address: "167 Alexandra Parade, Alexandra Headland QLD 4572",
            is_active: true,
            best_for: ["lunch", "afternoon", "dinner", "beer"],
            known_for_bullets: [
                "One of the best surf club views on the coast",
                "Good value club meals",
                "Easy walk-in dining"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["views", "casual", "family"]
        },

        {
            name: "Black Bunny Cafe",
            slug: "black-bunny-cafe-alex",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.668442,
            lng: 153.104441,
            coords_source: "address",
            coords_accuracy: "high",
            address: "5/6 Mari St, Alexandra Headland QLD 4572",
            is_active: true,
            best_for: ["coffee", "breakfast", "lunch"],
            known_for_bullets: [
                "Specialty coffee favourite",
                "Great breakfast plates",
                "Popular with locals"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["locals", "brunch"]
        },

        {
            name: "Francine's",
            slug: "francines-alexandra-headland",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.664408,
            lng: 153.105032,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Alexandra Parade, Alexandra Headland QLD 4572",
            is_active: true,
            best_for: ["coffee", "breakfast", "lunch"],
            known_for_bullets: [
                "Consistent breakfast & lunch spot",
                "Good coffee",
                "Relaxed sit-down vibe"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["casual", "locals"]
        },

        {
            name: "Juan Fifty Kitchen & Bar",
            slug: "juan-fifty-mooloolaba",
            category: "Modern Australian",
            icon: "/icons/fancy_dinner.png",
            lat: -26.668199,
            lng: 153.106353,
            coords_source: "address",
            coords_accuracy: "high",
            address: "150 Alexandra Parade, Alexandra Headland QLD 4572",
            is_active: true,
            best_for: ["lunch", "dinner", "fancy_dinner"],
            known_for_bullets: [
                "Modern Australian plates",
                "Good date-night option",
                "Polished but not stiff"
            ],
            price_risk: "high",
            walk_in_friendliness: "medium",
            service_speed: "slow",
            formality_level: 2,
            vibe_tags: ["date", "polished"],
            booking_likely: true
        },

        {
            name: "Sloop Coffee & Deli",
            slug: "sloop-coffee-deli-alex",
            category: "Cafe / Deli",
            icon: "/icons/coffee.png",
            lat: -27.029560,
            lng: 152.924375,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Alexandra Headland QLD 4572",
            is_active: true,
            best_for: ["coffee", "breakfast", "afternoon"],
            known_for_bullets: [
                "Good takeaway coffee",
                "Easy snack stop",
                "Works well for a quick reset"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["quick", "locals"]
        },

        {
            name: "The Alex Bar & Grill",
            slug: "alex-bar-grill",
            category: "Bar & Grill",
            icon: "/icons/beer.png",
            lat: -26.664408,
            lng: 153.105032,
            coords_source: "address",
            coords_accuracy: "high",
            address: "Alexandra Parade, Alexandra Headland QLD 4572",
            is_active: true,
            best_for: ["beer", "afternoon", "dinner"],
            known_for_bullets: [
                "Casual pub-style meals",
                "Good for groups",
                "Reliable beers + food"
            ],
            price_risk: "medium",
            walk_in_friendliness: "high",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["casual", "groups"]
        },

        {
            name: "Brekky Joint",
            slug: "brekky-joint-mooloolaba",
            category: "Cafe",
            icon: "/icons/coffee.png",
            lat: -26.681783,
            lng: 153.118854,
            address: "Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["breakfast", "coffee"],
            known_for_bullets: [
                "Straightforward breakfast classics",
                "Fast service",
                "Good when you don’t want to think"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "quick"]
        },

        {
            name: "Dirty Moes",
            slug: "dirty-moes-mooloolaba",
            category: "Burger",
            icon: "/icons/burger.png",
            lat: -26.681783,
            lng: 153.118854,
            address: "Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["lunch", "dinner", "late_night"],
            known_for_bullets: [
                "Big messy burgers",
                "Good late feed",
                "Casual, no-frills"
            ],
            price_risk: "low",
            walk_in_friendliness: "high",
            service_speed: "fast",
            formality_level: 0,
            vibe_tags: ["casual", "late"]
        },

        {
            name: "Spice India",
            slug: "spice-india-mooloolaba",
            category: "Indian",
            icon: "/icons/asian.png",
            lat: -26.681783,
            lng: 153.118854,
            address: "Mooloolaba QLD 4557",
            is_active: true,
            best_for: ["dinner", "late_night"],
            known_for_bullets: [
                "Comfort curry dinners",
                "Good alternative to seafood",
                "Filling + warm meals"
            ],
            price_risk: "medium",
            walk_in_friendliness: "medium",
            service_speed: "medium",
            formality_level: 0,
            vibe_tags: ["casual", "hearty"]
        }

    ]
};
