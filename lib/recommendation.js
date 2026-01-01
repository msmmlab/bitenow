

/* -----------------------------
   Time lens → context mode
--------------------------------*/
function getContextMode(timeLens) {
    if (timeLens === "tonight") return "experience";
    if (timeLens === "later") return "planning";
    return "convenience"; // "now" default
}

/* -----------------------------
   Meal bucket (unchanged logic, minor cleanup)
--------------------------------*/
export function getMealBucket(date, timeLens) {
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const time = hour + minutes / 60;

    if (timeLens === "tonight") return "dinner";

    let adjustedTime = time;
    if (timeLens === "later") {
        if (time < 10.5) adjustedTime = 12;      // Morning -> Lunch
        else if (time < 14.5) adjustedTime = 16; // Lunch -> Afternoon/Drinks
        else adjustedTime = 19;                  // Afternoon -> Dinner
    }

    if (adjustedTime >= 6.5 && adjustedTime < 11) return "breakfast";
    if (adjustedTime >= 11 && adjustedTime < 14.5) return "lunch";
    if (adjustedTime >= 14.5 && adjustedTime < 17.0) return "afternoon";
    if (adjustedTime >= 17.0 && adjustedTime < 19.0) return "dinner";
    if (adjustedTime >= 19.0 && adjustedTime < 22.0) return "late";
    return "late";
}

/* -----------------------------
   Intent options (return both label + type)
--------------------------------*/
export function getIntentOptions(timeLens, date) {
    if (timeLens === "tonight") {
        return [
            { label: "Drinks", type: "drinks" },
            { label: "Dinner", type: "dinner" },
            { label: "Date night", type: "date" },
        ];
    }

    const hour = date.getHours();
    const minutes = date.getMinutes();
    const time = hour + minutes / 60;
    let lookupTime = time;

    if (timeLens === "later") {
        if (time < 11) lookupTime = 12;
        else if (time < 15) lookupTime = 16;
        else lookupTime = 19;
    }

    if (lookupTime >= 5 && lookupTime < 11) {
        return [
            { label: "Coffee", type: "coffee" },
            { label: "Breakfast", type: "breakfast" },
        ];
    }

    if (lookupTime >= 11 && lookupTime < 14.5) {
        return [
            { label: "Lunch", type: "lunch" },
            { label: "Coffee", type: "coffee" },
        ];
    }

    if (lookupTime >= 14.5 && lookupTime < 17) {
        return [
            { label: "Drinks", type: "drinks" },
            { label: "Coffee", type: "coffee" },
        ];
    }

    if (lookupTime >= 17 && lookupTime < 21) {
        return [
            { label: "Drinks", type: "drinks" },
            { label: "Dinner", type: "dinner" },
        ];
    }

    return [
        { label: "Drinks", type: "drinks" },
        { label: "Date night", type: "date" },
    ];
}

/* -----------------------------
   Normalization helpers
--------------------------------*/
function normalizeText(s) {
    return (s || "").toString().trim();
}

function normalizeCategory(cat) {
    return normalizeText(cat).toLowerCase();
}

/**
 * Normalize best_for into canonical tags used by scoring:
 * breakfast, coffee, lunch, afternoon, dinner, late, date, fancy, drinks
 */
function normalizeBestFor(bestFor) {
    const src = Array.isArray(bestFor) ? bestFor : [];
    const out = new Set();

    for (const raw of src) {
        const v = normalizeText(raw).toLowerCase();

        if (!v) continue;

        if (v === "late_night") out.add("late");
        else if (v === "fancy_dinner") {
            out.add("dinner");
            out.add("fancy");
        } else if (v === "date" || v === "date_night") {
            out.add("date");
        } else if (v === "drinks" || v === "beer" || v === "cocktails") {
            out.add("drinks");
        } else if (v === "coffee") {
            out.add("coffee");
        } else if (v === "breakfast") {
            out.add("breakfast");
        } else if (v === "lunch") {
            out.add("lunch");
        } else if (v === "afternoon") {
            out.add("afternoon");
        } else if (v === "dinner") {
            out.add("dinner");
        } else if (v === "late") {
            out.add("late");
        } else {
            // keep unknown tags (won't hurt)
            out.add(v);
        }
    }

    return Array.from(out);
}

/**
 * Normalize intent input:
 * - accepts {type} from chips OR string label like "🍺 Drinks"
 */
function normalizeIntent(intent) {
    if (!intent) return null;

    if (typeof intent === "object" && intent.type) return intent.type;

    const cleaned = normalizeText(intent).replace(/[^\w\s]/g, "").toLowerCase();

    if (cleaned.includes("coffee")) return "coffee";
    if (cleaned.includes("breakfast")) return "breakfast";
    if (cleaned.includes("lunch")) return "lunch";
    if (cleaned.includes("drink") || cleaned.includes("beer")) return "drinks";
    if (cleaned.includes("dinner")) return "dinner";
    if (cleaned.includes("date")) return "date";

    return null;
}

/* -----------------------------
   Hard exclusions (fixed to use normalized intent + category)
--------------------------------*/
function shouldExcludeForIntent(restaurant, intentType, bestForNorm) {
    const category = normalizeCategory(restaurant.category);

    if (!intentType) return false;

    // Drinks: exclude dessert/ice cream/bakery; exclude cafes unless explicitly "drinks"
    if (intentType === "drinks") {
        const isDessertShop =
            category.includes("dessert") ||
            category.includes("gelat") ||
            category.includes("ice cream") ||
            category.includes("bakery");

        if (isDessertShop) return true;

        const isCafe = category.includes("cafe");
        const servesDrinks = bestForNorm.includes("drinks");
        if (isCafe && !servesDrinks) return true;
    }

    // Coffee: exclude bar/pubs/breweries/cocktail
    if (intentType === "coffee") {
        const isBar =
            category.includes("bar") ||
            category.includes("pub") ||
            category.includes("brew") ||
            category.includes("cocktail");
        if (isBar) return true;
    }

    // Breakfast: exclude bar/pubs/breweries/cocktail
    if (intentType === "breakfast") {
        const isBar =
            category.includes("bar") ||
            category.includes("pub") ||
            category.includes("brew") ||
            category.includes("cocktail");
        if (isBar) return true;
    }

    // Dinner: exclude dessert-only (if no dinner/fancy/dinner tags)
    if (intentType === "dinner") {
        const isDessert =
            category.includes("dessert") ||
            category.includes("gelat") ||
            category.includes("ice cream");

        const dinnerCapable = bestForNorm.includes("dinner") || bestForNorm.includes("fancy");
        if (isDessert && !dinnerCapable) return true;
    }

    return false;
}

/* -----------------------------
   Tiny scoring helpers (with reasons)
--------------------------------*/
function add(scoreObj, delta, reason) {
    scoreObj.score += delta;
    if (reason) scoreObj.reasons.push({ delta, reason });
}

function shortAddress(address) {
    const a = normalizeText(address);
    if (!a) return "";
    // "14–16 Hastings Street, Noosa Heads QLD 4567" -> "Hastings Street"
    const firstPart = a.split(",")[0] || a;
    return firstPart.replace(/\d+/g, "").replace(/[–-]/g, "").trim();
}

/* -----------------------------
   Main scoring (returns score + why)
--------------------------------*/
export function scoreRestaurant(restaurant, context) {
    const { timeLens, date, distanceValue } = context;
    const mode = getContextMode(timeLens);

    const intentType = normalizeIntent(context.intent);
    const bestForNorm = normalizeBestFor(restaurant.best_for || restaurant.best_times || []);
    const bucket = getMealBucket(date, timeLens);

    // explainable score object
    const out = {
        score: 0,
        reasons: [],
        debug: {
            mode,
            intentType,
            bucket,
            bestForNorm,
            category: restaurant.category,
            addressShort: shortAddress(restaurant.address),
        },
    };

    // 0) Hard filter
    if (intentType && shouldExcludeForIntent(restaurant, intentType, bestForNorm)) {
        out.score = -1000;
        out.reasons.push({ delta: -1000, reason: "Excluded for this intent" });
        return out;
    }

    // 1) Bucket fit (time awareness)
    if (bestForNorm.includes(bucket)) {
        add(out, +30, `Matches time: best for ${bucket}`);
    } else {
        add(out, -15, `Not ideal for current time (${bucket})`);
    }

    // 2) Mode-based “meaning” rules
    // Convenience: fast + easy matters
    if (mode === "convenience") {
        if (restaurant.service_speed === "slow") add(out, -15, "Slow service is less ideal right now");
        if (restaurant.price_risk === "high") add(out, -15, "Premium pricing is less ideal right now");
        if (restaurant.booking_likely) add(out, -20, "Booking likely (less convenient right now)");
    }

    // Planning: relax penalties slightly
    if (mode === "planning") {
        if (restaurant.price_risk === "high") add(out, -5, "Premium pricing (slight penalty for later)");
        if (restaurant.booking_likely) add(out, -5, "Booking likely (small friction for later)");
    }

    // Experience: reward “planned / premium / slower”
    if (mode === "experience") {
        if (bestForNorm.includes("dinner") || bestForNorm.includes("late") || bestForNorm.includes("fancy")) {
            add(out, +20, "Strong evening fit");
        }
        if (restaurant.service_speed === "slow") add(out, +5, "Slower pace suits an evening experience");
        if (restaurant.booking_likely) add(out, +8, "Booking likely (often indicates premium experience)");
        if (restaurant.price_risk === "high") add(out, +6, "Premium experience fits tonight");
    }

    // 3) General attributes (kept simple + consistent)
    if (restaurant.walk_in_friendliness === "high") add(out, +10, "Walk-ins welcome");
    else if (restaurant.walk_in_friendliness === "low") add(out, -12, "Walk-in availability is limited");

    if (restaurant.service_speed === "fast") add(out, +8, "Quick service");
    else if (restaurant.service_speed === "slow") add(out, -8, "Slow service");

    // Price risk: penalize normally, soften in experience/date contexts
    let highPriceDelta = -10;
    if (mode === "experience" || intentType === "date") highPriceDelta = -5;

    if (restaurant.price_risk === "low") add(out, +8, "Good value");
    else if (restaurant.price_risk === "high") add(out, highPriceDelta, "Premium pricing");

    // 4) Intent-based boosts (using normalized intent)
    const category = normalizeCategory(restaurant.category);
    const formality = restaurant.formality_level || 0;

    if (intentType === "coffee") {
        const isCafe = category.includes("cafe");
        if (isCafe || bestForNorm.includes("coffee")) add(out, +40, "Strong coffee match");
        if (restaurant.service_speed === "slow") add(out, -15, "Coffee should be quick");
        if (formality >= 2) add(out, -15, "Coffee intent prefers casual spots");
    }

    if (intentType === "breakfast") {
        if (bestForNorm.includes("breakfast")) add(out, +40, "Best for breakfast");
        if (restaurant.service_speed === "fast") add(out, +10, "Fast service suits breakfast");
    }

    if (intentType === "lunch") {
        if (bestForNorm.includes("lunch")) add(out, +40, "Best for lunch");
        const dinnerOnly =
            bestForNorm.length <= 2 && bestForNorm.includes("dinner") && !bestForNorm.includes("lunch");
        if (dinnerOnly) add(out, -30, "More suited to dinner than lunch");
    }

    if (intentType === "drinks") {
        const isVibeSpot =
            category.includes("brew") ||
            category.includes("pub") ||
            category.includes("bar") ||
            category.includes("cocktail") ||
            (restaurant.vibe_tags || []).includes("lively");

        if (isVibeSpot || bestForNorm.includes("drinks") || bestForNorm.includes("afternoon")) {
            add(out, +40, "Great for drinks");
        }
        if (restaurant.walk_in_friendliness === "high") add(out, +15, "Easy walk-in for drinks");
    }

    if (intentType === "dinner") {
        if (bestForNorm.includes("dinner") || bestForNorm.includes("fancy")) add(out, +40, "Great for dinner");
        // FIX: only penalize very formal for NOW (not for TONIGHT)
        if (mode === "convenience" && formality >= 3) add(out, -15, "Very formal spots are less ideal right now");
    }

    if (intentType === "date") {
        // Date = planned / premium / vibe leaning
        if (formality >= 2 || bestForNorm.includes("fancy") || bestForNorm.includes("date")) add(out, +40, "Good date-night fit");
        if (formality >= 3) add(out, +20, "Formal vibe suits date night");
        if (restaurant.booking_likely) add(out, +20, "Booking recommended for date night");
        if (restaurant.price_risk === "high") add(out, +15, "Premium feel suits date night");

        // Exclusivity is a feature here, not a bug:
        if (restaurant.walk_in_friendliness === "low") add(out, +10, "Exclusive feel (better for a planned night)");

        // Penalties for casual/fast places for date intent:
        if (formality <= 1) add(out, -60, "Too casual for date-night intent");
        if (restaurant.service_speed === "fast") add(out, -20, "Date-night vibe is rarely 'fast'");
    }

    // 5) Distance penalty (same logic, but explained)
    if (distanceValue !== undefined) {
        let distPenalty = 0;

        if (distanceValue <= 2) distPenalty = distanceValue * 3;
        else if (distanceValue <= 5) distPenalty = 6 + (distanceValue - 2) * 5;
        else if (distanceValue <= 10) distPenalty = 20 + (distanceValue - 5) * 6;
        else distPenalty = 50 + (distanceValue - 10) * 8;

        add(out, -distPenalty, `Distance penalty (${distanceValue.toFixed(1)} km)`);
    }

    // 6) Tie-breakers (keep, but explain)
    if (restaurant.special) add(out, +25, "Has a special");
    if (restaurant.isOpen) add(out, +15, "Open now");

    return out;
}

/* -----------------------------
   Optional: helper to get top N with why (for testing)
--------------------------------*/
export function rankRestaurants(restaurants, context, topN = 10) {
    const scored = restaurants
        .map(r => ({ restaurant: r, ...scoreRestaurant(r, context) }))
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, topN);
}

/* -----------------------------
   Optional: pick featured + compact "why" text
--------------------------------*/
export function formatWhyRecommended(scoreResult, maxReasons = 4) {
    const reasons = (scoreResult?.reasons || [])
        .filter(x => x.delta > 0 || x.reason.includes("Distance penalty") === false) // avoid spamming negatives
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, maxReasons)
        .map(x => x.reason);

    return reasons;
}
