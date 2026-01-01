// locations/sampleTown.js
module.exports = {
    town: {
        slug: "sampletown",
        name: "SampleTown",
        slug: "sampletown",
        name: "SampleTown",
        region: "Sunshine Coast",
        slug: "sampletown",
        name: "SampleTown",
        center: { lat: -26.0000, lng: 153.0000 },
    },

    venues: [
        {
            name: "Sample Cafe",
            slug: "sample-cafe",                 // required (stable unique id)
            category: "Cafe",
            icon: "/icons/coffee.png",
            address: "123 Example St, SampleTown QLD",
            lat: -28.855256,
            lng: 152.027073,

            best_for: ["breakfast", "coffee", "lunch"],

            // optional but recommended for ranking/UX
            formality_level: 0,                  // 0..3
            walk_in_friendliness: "high",         // low|medium|high
            service_speed: "fast",               // fast|medium|slow
            price_risk: "low",                   // low|medium|high
            vibe_tags: ["casual", "quick"],
            known_for_bullets: ["Good coffee", "Easy breakfast", "Quick takeaway"],
        },
    ],
};
