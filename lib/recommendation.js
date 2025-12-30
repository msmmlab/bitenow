/**
 * recommendation.js - Logic for BiteNow intent-based ranking
 */

export function getMealBucket(date, timeLens) {
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const time = hour + minutes / 60;

    if (timeLens === "tonight") return "dinner";

    // LATER shifts the perspective forward to the next logical meal
    let adjustedTime = time;
    if (timeLens === "later") {
        if (time < 10.5) adjustedTime = 12;      // Morning -> Lunch
        else if (time < 14.5) adjustedTime = 16; // Lunch -> Afternoon/Drinks
        else adjustedTime = 19;                 // Afternoon -> Dinner
    }

    if (adjustedTime >= 6.5 && adjustedTime < 11) return "breakfast";
    if (adjustedTime >= 11 && adjustedTime < 14.5) return "lunch";
    if (adjustedTime >= 14.5 && adjustedTime < 17.0) return "afternoon";
    if (adjustedTime >= 17.0 && adjustedTime < 19.0) return "dinner";
    if (adjustedTime >= 19.0 && adjustedTime < 22.0) return "late";

    return "late";
}

export function getIntentOptions(timeLens, date) {
    if (timeLens === "tonight") return ["🍺 Drinks", "🍽 Dinner", "✨ Date night"];

    const hour = date.getHours();
    const minutes = date.getMinutes();
    const time = hour + minutes / 60;
    let lookupTime = time;

    // LATER chips should reflect the NEXT meal phase
    if (timeLens === "later") {
        if (time < 11) lookupTime = 12;       // Late morning -> Lunch
        else if (time < 15) lookupTime = 16;  // Lunch -> Afternoon/Drinks
        else lookupTime = 19;                // Evening -> Late Night/Late Dinner
    }

    if (lookupTime >= 5 && lookupTime < 11) return ["☕️ Coffee", "🍳 Breakfast"];
    if (lookupTime >= 11 && lookupTime < 14.5) return ["🍽 Lunch", "☕️ Coffee"];
    if (lookupTime >= 14.5 && lookupTime < 17) return ["🍺 Drinks", "☕️ Coffee"];
    if (lookupTime >= 17 && lookupTime < 21) return ["🍺 Drinks", "🍽 Dinner"];

    return ["🍺 Drinks", "✨ Date night"];
}

export function scoreRestaurant(restaurant, context) {
    const { timeLens, date, distanceValue } = context;
    let { intent } = context;
    let score = 0;

    // Clean intent of emojis for logic
    if (intent) {
        intent = intent.replace(/[^\w\s]/gi, '').trim();
    }

    // 1. Time-aware bucket scoring
    const bucket = getMealBucket(date, timeLens);
    const bestTimes = restaurant.best_for || restaurant.best_times || [];

    // Base score for matching the time bucket
    if (bestTimes.includes(bucket)) {
        score += 30;
    } else {
        score -= 15;
    }

    if (timeLens === "now") {
        // NOW Penalties: focus on convenience/speed
        if (restaurant.service_speed === "slow") score -= 15;
        if (restaurant.price_risk === "high") score -= 15;
        if (restaurant.booking_likely) score -= 20;
    } else if (timeLens === "tonight") {
        // TONIGHT: Already shifted bucket to dinner in getMealBucket,
        // but let's give an extra boost to specific evening vibes
        if (bestTimes.includes("dinner") || bestTimes.includes("late") || bestTimes.includes("late_night") || bestTimes.includes("fancy_dinner")) {
            score += 20;
        }
        if (restaurant.service_speed === "slow") score += 5;
    } else if (timeLens === "later") {
        // LATER: A "plan-ahead" bridge between NOW and TONIGHT.
        // We relax the "must be fast" penalties of NOW.
        if (restaurant.price_risk === "high") score -= 5;
    }

    // 2. General attributes
    // walk_in_friendliness: high +10, medium +0, low -12
    if (restaurant.walk_in_friendliness === "high") score += 10;
    else if (restaurant.walk_in_friendliness === "low") score -= 12;

    // service_speed: fast +8, medium +0, slow -8
    if (restaurant.service_speed === "fast") score += 8;
    else if (restaurant.service_speed === "slow") score -= 8;

    // price_risk: low +8, medium +0, high -10
    let priceRiskPenalty = -10;
    if (timeLens === "tonight" || intent === "Date night" || intent === "Fancy" || intent === "Fancy dinner") priceRiskPenalty = -5; // reduce penalty

    if (restaurant.price_risk === "low") score += 8;
    else if (restaurant.price_risk === "high") score += priceRiskPenalty;

    // 3. Intent-based weight shifts
    if (intent === "Coffee") {
        const isCafe = restaurant.category?.toLowerCase().includes("cafe");
        if (isCafe || bestTimes.includes("coffee")) score += 40;
        if (restaurant.service_speed === "slow") score -= 15;
        if ((restaurant.formality_level || 0) >= 2) score -= 15;
    }

    if (intent === "Breakfast") {
        if (bestTimes.includes("breakfast")) score += 40;
        if (restaurant.service_speed === "fast") score += 10;
    }

    if (intent === "Lunch") {
        if (bestTimes.includes("lunch")) score += 40;
        const isDinnerOnly = bestTimes.length === 1 && (bestTimes[0] === "dinner" || bestTimes[0] === "fancy_dinner");
        if (isDinnerOnly) score -= 30;
    }

    if (intent === "Beer" || intent === "Drinks") {
        const lowerCat = restaurant.category?.toLowerCase() || "";
        const isVibePub = lowerCat.includes("brew") || lowerCat.includes("pub") || lowerCat.includes("bar") || restaurant.vibe_tags?.includes("lively");
        if (isVibePub || bestTimes.includes("beer") || bestTimes.includes("afternoon")) score += 40;
        if (restaurant.walk_in_friendliness === "high") score += 15;
    }

    if (intent === "Dinner") {
        if (bestTimes.includes("dinner") || bestTimes.includes("fancy_dinner")) score += 40;
        if (restaurant.formality_level === 3) score -= 15;
    }

    if (intent === "Date night" || intent === "Fancy" || intent === "Fancy dinner") {
        if (restaurant.formality_level >= 2 || bestTimes.includes("fancy_dinner")) score += 40;
        if (restaurant.formality_level === 3) score += 20;
        if (restaurant.booking_likely) score += 20;
        if (restaurant.price_risk === "high") score += 15;
        if (restaurant.walk_in_friendliness === "low") score += 15;

        // Exclusivity penalties
        if (restaurant.formality_level <= 1) score -= 60; // Penalty for casual spots
        if (restaurant.service_speed === "fast") score -= 20; // Fancy isn't fast
    }

    // 4. Distance penalty (STRENGTHENED)
    if (distanceValue !== undefined) {
        // Much stronger distance penalty - proximity is critical
        // 0-2km: minimal penalty (0-6 points)
        // 2-5km: moderate penalty (6-20 points)
        // 5-10km: heavy penalty (20-50 points)
        // 10km+: severe penalty (50+ points)

        if (distanceValue <= 2) {
            score -= distanceValue * 3; // 0-6 points penalty
        } else if (distanceValue <= 5) {
            score -= 6 + (distanceValue - 2) * 5; // 6-20 points penalty
        } else if (distanceValue <= 10) {
            score -= 20 + (distanceValue - 5) * 6; // 20-50 points penalty
        } else {
            score -= 50 + (distanceValue - 10) * 8; // 50+ points penalty
        }
    }

    // 5. Tie-breakers
    if (restaurant.special) score += 25;
    if (restaurant.isOpen) score += 15;

    return score;
}
