#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/listRestaurants.js caloundra
 */

const fs = require("fs");
const path = require("path");

function die(msg) {
    console.error(msg);
    process.exit(1);
}

async function run() {
    const townSlug = process.argv[2];
    if (!townSlug) die("Usage: node scripts/listRestaurants.js <townSlug>");

    // Use process.cwd() so it works no matter where scripts/ lives,
    // as long as you run from repo root.
    const filePath = path.join(process.cwd(), "locations", `${townSlug}.js`);

    if (!fs.existsSync(filePath)) {
        die(`❌ Not found: ${filePath}\nRun this from your repo root (where /locations exists).`);
    }

    let data;
    try {
        data = require(filePath);
    } catch (err) {
        die(`❌ Could not load ${filePath}\n${err && err.stack ? err.stack : err}`);
    }

    const venues = Array.isArray(data?.venues) ? data.venues : null;
    if (!venues) die(`❌ No venues array found in ${filePath}`);

    if (venues.length === 0) {
        console.error(`⚠️ venues[] is empty in ${filePath}`);
        return;
    }

    for (const v of venues) {
        if (v && typeof v.name === "string" && v.name.trim()) {
            console.log(v.name.trim());
        }
    }
}

run().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
});
