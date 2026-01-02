// scripts/update-coords.js
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

async function getMapboxPOI(name, address) {
    try {
        const town = "Sunshine Coast, QLD";
        const query = encodeURIComponent(`${name}, ${town}`);
        const proximity = "153.1,-26.7";

        let url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${query}&access_token=${MAPBOX_TOKEN}&session_token=${SESSION_TOKEN}&limit=3&types=poi&proximity=${proximity}`;
        let res = await fetch(url);
        let data = await res.json();

        if (!data.suggestions || data.suggestions.length === 0) {
            url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(name)}&access_token=${MAPBOX_TOKEN}&session_token=${SESSION_TOKEN}&limit=3&types=poi&proximity=${proximity}`;
            res = await fetch(url);
            data = await res.json();
        }

        if (data.suggestions && data.suggestions.length > 0) {
            const mapboxId = data.suggestions[0].mapbox_id;
            const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${MAPBOX_TOKEN}&session_token=${SESSION_TOKEN}`;
            const detailsRes = await fetch(retrieveUrl);
            const detailsData = await detailsRes.json();

            if (detailsData.features && detailsData.features.length > 0) {
                const feature = detailsData.features[0];
                return {
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0],
                    name: feature.properties.name
                };
            }
        }
    } catch (e) {
        console.error(`  ❌ Failed for ${name}:`, e.message);
    }
    return null;
}

async function processFile(filePath) {
    console.log(`\nProcessing ${path.basename(filePath)}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to find venue blocks that need coordinates
    const venueRegex = /\{\s*name:\s*"([^"]+)",[\s\S]*?address:\s*"([^"]+)",[\s\S]*?lat:\s*(null|-?\d+\.?\d*),[\s\S]*?lng:\s*(null|-?\d+\.?\d*),[\s\S]*?\}/g;

    let match;
    const replacements = [];

    while ((match = venueRegex.exec(content)) !== null) {
        const fullBlock = match[0];
        const name = match[1];
        const address = match[2];
        const currentLat = match[3];
        const index = match.index;

        // Only process if lat is null or we want to re-verify
        if (currentLat !== 'null' && !fullBlock.includes('coords_source: "tbd"')) {
            continue;
        }

        process.stdout.write(`📡 Geocoding ${name}... `);
        const result = await getMapboxPOI(name, address);

        if (result) {
            console.log(`✅ ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`);
            let newBlock = fullBlock;

            newBlock = newBlock.replace(/lat:\s*(null|-?\d+\.?\d*),/, `lat: ${result.lat.toFixed(6)},`);
            newBlock = newBlock.replace(/lng:\s*(null|-?\d+\.?\d*),/, `lng: ${result.lng.toFixed(6)},`);

            if (newBlock.includes('coords_source:')) {
                newBlock = newBlock.replace(/coords_source:\s*"[^"]+",/, `coords_source: "mapbox_poi",`);
            } else {
                newBlock = newBlock.replace(/(lng: [^,]+,)/, `$1\n            coords_source: "mapbox_poi",`);
            }

            if (newBlock.includes('coords_accuracy:')) {
                newBlock = newBlock.replace(/coords_accuracy:\s*"[^"]+",/, `coords_accuracy: "high",`);
            } else {
                newBlock = newBlock.replace(/(coords_source: "[^"]+",)/, `$1\n            coords_accuracy: "high",`);
            }

            replacements.push({
                start: index,
                end: index + fullBlock.length,
                newText: newBlock
            });
        } else {
            console.log(`❌ Not Found`);
        }

        await new Promise(r => setTimeout(r, 200));
    }

    if (replacements.length > 0) {
        let newContent = content;
        replacements.sort((a, b) => b.start - a.start);
        for (const r of replacements) {
            newContent = newContent.substring(0, r.start) + r.newText + newContent.substring(r.end);
        }
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✨ Updated ${replacements.length} venues in ${path.basename(filePath)}.`);
    }
}

async function run() {
    const townArg = process.argv[2];
    if (townArg && townArg !== 'all') {
        await processFile(path.join(LOCATIONS_DIR, `${townArg}.js`));
    } else {
        const files = fs.readdirSync(LOCATIONS_DIR).filter(f => f.endsWith('.js') && f !== 'sampleTown.js');
        for (const file of files) {
            await processFile(path.join(LOCATIONS_DIR, file));
        }
    }
    console.log('\nCoordinate sync complete! 🚀');
}

run().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
