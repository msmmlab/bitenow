/**
 * recommendation.js - Logic for BiteNow intent-based ranking
 */

export function getMealBucket(date, timeLens) {
    if (timeLens === "tonight") return "dinner";
    if (timeLens === "later") return "dinner"; // Later usually implies looking ahead to the next meal

    const hour = date.getHours();
    const minutes = date.getMinutes();
    const time = hour + minutes / 60;

    if (time >= 6.5 && time < 10.5) return "breakfast";
    if (time >= 10.5 && time < 14.5) return "lunch";
    if (time >= 14.5 && time < 17.0) return "afternoon";
    if (time >= 17.0 && time < 19.0) return "dinner";
    if (time >= 19.0 && time < 22.0) return "late";

    return "late";
}

export function getIntentOptions(timeLens, date) {
    if (timeLens === "later") return ["Beer", "Dinner"];
    if (timeLens === "tonight") return ["Beer", "Fancy dinner"];

    const hour = date.getHours();
    const minutes = date.getMinutes();
    const time = hour + minutes / 60;

    if (time >= 6.5 && time < 10.5) return ["Coffee", "Breakfast"];
    if (time >= 10.5 && time < 14.5) return ["Lunch", "Coffee"];
    if (time >= 14.5 && time < 17.0) return ["Beer", "Coffee"];
    if (time >= 17.0 && time < 19.0) return ["Beer", "Dinner"];
    return ["Beer", "Fancy dinner"];
}

export function scoreRestaurant(restaurant, context) {
    const { timeLens, date, intent, distanceValue } = context;
    let score = 0;

    // 1. Time-aware bucket scoring
    const bucket = getMealBucket(date, timeLens);
    const bestTimes = restaurant.best_times || [];

    if (timeLens === "now") {
        if (bestTimes.includes(bucket)) {
            score += 30;
        } else {
            score -= 15;
        }
    } else if (timeLens === "tonight") {
        if (bestTimes.includes("dinner") || bestTimes.includes("late")) {
            score += 20;
        } else {
            score -= 20;
        }
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
    if (intent === "Fancy dinner") priceRiskPenalty = -5; // reduce penalty by half

    if (restaurant.price_risk === "low") score += 8;
    else if (restaurant.price_risk === "high") score += priceRiskPenalty;

    // 3. Intent-based weight shifts
    if (intent === "Coffee") {
        const isCafe = restaurant.category?.toLowerCase().includes("cafe");
        if (isCafe || bestTimes.includes("coffee")) score += 50;
        if (restaurant.service_speed === "slow") score -= 10;
        if ((restaurant.formality_level || 0) >= 2) score -= 15;
    }

    if (intent === "Breakfast") {
        if (bestTimes.includes("breakfast")) score += 50;
        if (restaurant.service_speed === "fast") score += 10;
    }

    if (intent === "Lunch") {
        if (bestTimes.includes("lunch")) score += 50;
        const isDinnerOnly = bestTimes.length === 1 && bestTimes[0] === "dinner";
        if (isDinnerOnly) score -= 30;
    }

    if (intent === "Beer") {
        const lowerCat = restaurant.category?.toLowerCase() || "";
        const isVibePub = lowerCat.includes("brew") || lowerCat.includes("pub") || lowerCat.includes("bar") || restaurant.vibe_tags?.includes("lively");
        if (isVibePub) score += 40;
        if (restaurant.walk_in_friendliness === "high") score += 10;
    }

    if (intent === "Dinner") {
        if (bestTimes.includes("dinner")) score += 45;
        if (restaurant.formality_level === 3) score -= 10;
    }

    if (intent === "Fancy dinner") {
        if (restaurant.formality_level >= 2) score += 40;
        if (restaurant.formality_level === 3) score += 20;
        if (restaurant.booking_likely) score += 15;
        if (restaurant.price_risk === "high") score += 10;
        if (restaurant.walk_in_friendliness === "low") score += 15;

        // Exclusivity penalties
        if (restaurant.formality_level <= 1) score -= 60; // Penalty for casual spots
        if (restaurant.service_speed === "fast") score -= 20; // Fancy isn't fast
    }

    // 4. Distance penalty
    if (distanceValue !== undefined) {
        // Assume distanceValue is in km. Let's estimate minutes (1km = 1.5 min drive/walk combo)
        const distanceMinutes = distanceValue * 1.5;
        score -= Math.min(distanceMinutes, 30) * 0.6;
    }

    // 5. Tie-breakers
    if (restaurant.special) score += 25;
    if (restaurant.isOpen) score += 15;

    return score;
}
