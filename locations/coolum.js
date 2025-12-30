// locations/coolum.js
module.exports = {
    town: {
        slug: "coolum",
        name: "Coolum",
        region: "Sunshine Coast",
        center: { lat: -26.5284, lng: 153.0881 },
    },

    venues: [
        {
            name: "Coolum Surf Club",
            slug: "coolum-surf-club",
            category: "Surf Club",
            icon: "/icons/fish_chips.png",
            lat: -26.5284,
            lng: 153.0881,
            address: "1775 David Low Way, Coolum Beach QLD 4573",
            is_active: true,
            best_for: ["lunch", "afternoon", "dinner"],
            known_for_bullets: ["Club classics & big portions", "Relaxed beachfront dining", "Easy for families"]
        },
        {
            name: "Canteen Kitchen + Bar",
            slug: "canteen-kitchen-bar-coolum",
            category: "Modern",
            icon: "/icons/wine.png",
            lat: -26.529,
            lng: 153.089,
            address: "1750 David Low Way, Coolum Beach QLD 4573",
            is_active: true,
            best_for: ["dinner", "lunch"],
            known_for_bullets: ["All-day modern menu", "Casual but polished", "Good mixed groups"]
        },
        {
            name: "Coolum Thai Spice",
            slug: "coolum-thai-spice",
            category: "Thai",
            icon: "/icons/thai.png",
            lat: -26.527,
            lng: 153.087,
            address: "1812 David Low Way, Coolum Beach QLD 4573",
            is_active: true,
            best_for: ["dinner"],
            known_for_bullets: ["Curries & stir-fries", "Reliable Thai comfort", "Good value dinner"]
        },
        {
            name: "Coolum Beach Hotel",
            slug: "coolum-beach-hotel",
            category: "Pub",
            icon: "/icons/beer.png",
            lat: -26.53,
            lng: 153.086,
            address: "David Low Way, Coolum Beach QLD 4573",
            is_active: true,
            best_for: ["beer", "lunch", "dinner"],
            known_for_bullets: ["Pub bistro meals", "Group-friendly", "Easy casual drinks"]
        }
    ]
};
