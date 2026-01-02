// scripts/check-hours.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Configuration & Env Loading
function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values) {
                process.env[key.trim()] = values.join('=').trim();
            }
        });
    }
}

loadEnv();

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const LOCATIONS_DIR = path.join(__dirname, '../locations');
const SESSION_TOKEN = crypto.randomUUID();

if (!MAPBOX_TOKEN) {
    console.error('Error: NEXT_PUBLIC_MAPBOX_TOKEN is not set.');
    process.exit(1);
}

// Day Mapping
const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

async function getMapboxId(name, address) {
    try {
        // Try precise name + town
        const town = "Sunshine Coast, QLD";
        const query = encodeURIComponent(`${name}, ${town}`);

        // Using a fixed proximity for Sunshine Coast region
        const proximity = "153.1,-26.7"; // Sunshine Coast center approx

        let url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${query}&access_token=${MAPBOX_TOKEN}&session_token=${SESSION_TOKEN}&limit=3&types=poi&proximity=${proximity}`;

        let res = await fetch(url);
        let data = await res.json();

        if (!data.suggestions || data.suggestions.length === 0) {
            // Try just the name if Name + Town failed
            url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(name)}&access_token=${MAPBOX_TOKEN}&session_token=${SESSION_TOKEN}&limit=3&types=poi&proximity=${proximity}`;
            res = await fetch(url);
            data = await res.json();
        }

        if (data.suggestions && data.suggestions.length > 0) {
            // Take the first POI match
            return data.suggestions[0].mapbox_id;
        }
    } catch (e) {
        console.error(`  ❌ Suggest failed for ${name}:`, e.message);
    }
    return null;
}

async function getVenueDetails(mapboxId) {
    try {
        const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${MAPBOX_TOKEN}&session_token=${SESSION_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
            return data.features[0].properties;
        }
    } catch (e) {
        console.error(`  ❌ Retrieve failed for ${mapboxId}:`, e.message);
    }
    return null;
}

function normalizeHours(metadata) {
    if (!metadata || !metadata.metadata || !metadata.metadata.opening_hours) {
        return null;
    }

    const raw = metadata.metadata.opening_hours;
    const normalized = {
        mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    };

    if (raw.periods) {
        raw.periods.forEach(p => {
            const dayKey = DAY_MAP[p.open.day];
            if (dayKey) {
                normalized[dayKey].push({
                    open: p.open.time,
                    close: p.close ? p.close.time : '2359' // Handle 24h or missing close gracefully
                });
            }
        });
        return normalized;
    }

    return null;
}

async function processTown(townSlug) {
    const filePath = path.join(LOCATIONS_DIR, `${townSlug}.js`);
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found ${filePath}`);
        return;
    }

    // Since we are just "checking" and "discussing", we won't modify the file yet.
    // We will just read the venues and log the results.
    const townData = require(filePath);
    const venues = townData.venues;

    // TEST SEARCH FOR A BIG POI
    console.log(`📡 TESTING SEARCH WITH McDonald's Caloundra...`);
    const testId = await getMapboxId("McDonald's", "Caloundra");
    if (testId) {
        const testDetails = await getVenueDetails(testId);
        if (testDetails.metadata && testDetails.metadata.opening_hours) {
            console.log(`✅ TEST SUCCESS: Found hours for McDonald's!`);
        } else {
            console.log(`⚠️ TEST FAILED: No hours metadata for McDonald's. Entire metadata: ${JSON.stringify(testDetails.metadata)}`);
        }
    }

    console.log(`\n🔍 Checking Opening Hours for ${townSlug.toUpperCase()} (${venues.length} venues)...`);
    console.log(`------------------------------------------------------------`);

    let foundCount = 0;

    for (const venue of venues) {
        process.stdout.write(`📡 ${venue.name}... `);

        const mapboxId = await getMapboxId(venue.name, venue.address);

        if (!mapboxId) {
            console.log(`[Not Found]`);
            continue;
        }

        const details = await getVenueDetails(mapboxId);
        const hours = normalizeHours(details);

        if (hours) {
            foundCount++;
            console.log(`✅ Data Found!`);
        } else {
            console.log(`[No Hours Metadata]`);
        }

        // Slight delay to be nice to the API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n✨ Finished. Found hours for ${foundCount}/${venues.length} venues.`);
    console.log(`------------------------------------------------------------`);
}

const townArg = process.argv[2];
if (!townArg) {
    console.error("Usage: npm run checkHours <town_slug>");
    process.exit(1);
}

processTown(townArg).catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
