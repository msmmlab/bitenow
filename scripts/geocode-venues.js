const fs = require('fs');
const path = require('path');

// 1. configuration
const LOCATIONS_DIR = path.join(__dirname, '../locations');

// Try to load token from .env.local if not already in env
let MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/NEXT_PUBLIC_MAPBOX_TOKEN=([^\s]+)/);
        if (match) MAPBOX_TOKEN = match[1];
    }
}

if (!MAPBOX_TOKEN) {
    console.error('Error: NEXT_PUBLIC_MAPBOX_TOKEN environment variable is not set.');
    console.log('Usage: NEXT_PUBLIC_MAPBOX_TOKEN=your_token node scripts/geocode-venues.js');
    process.exit(1);
}

async function geocodeAddress(name, address) {
    try {
        // 1. Try POI search with JUST THE NAME (biased by proximity)
        // This is the best way to "Snap" to official map pins
        const poiNameUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(name)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=au&types=poi&proximity=153.0906,-26.3968`;
        let response = await fetch(poiNameUrl);
        let data = await response.json();

        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            console.log(`    [POI Name Match] ${data.features[0].place_name}`);
            return { lat, lng };
        }

        // 2. Try POI search with name + address
        const query = `${name}, ${address}`;
        const poiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=au&types=poi&proximity=153.0906,-26.3968`;
        response = await fetch(poiUrl);
        data = await response.json();

        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            console.log(`    [POI Combined Match] ${data.features[0].place_name}`);
            return { lat, lng };
        }

        // 3. Fallback to standard address search
        const addrUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=au&proximity=153.0906,-26.3968`;
        response = await fetch(addrUrl);
        data = await response.json();

        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            console.log(`    [Address Match] ${data.features[0].place_name}`);
            return { lat, lng };
        }
    } catch (error) {
        console.error(`Failed to geocode address: ${address}`, error.message);
    }
    return null;
}

async function processFile(filePath) {
    console.log(`Processing ${path.basename(filePath)}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // We want to find each venue block and its address, then update its lat/lng
    // This regex looks for individual venue objects in the venues array
    const venueRegex = /\{\r?\n\s+name:\s+"([^"]+)",[\s\S]*?address:\s+"([^"]+)",[\s\S]*?\}/g;

    let match;
    let modified = false;
    const replacements = [];

    while ((match = venueRegex.exec(content)) !== null) {
        const fullBlock = match[0];
        const name = match[1];
        const address = match[2];

        // Skip if manual_coords is set to true
        if (fullBlock.includes('manual_coords: true')) {
            console.log(`  Skipping: ${name} (manual_coords: true)`);
            continue;
        }

        console.log(`  Geocoding: ${name} (${address})...`);
        const coords = await geocodeAddress(name, address);

        if (coords) {
            let updatedBlock = fullBlock;

            // Update lat
            updatedBlock = updatedBlock.replace(/lat:\s?-?\d+\.?\d*,/, `lat: ${coords.lat.toFixed(6)},`);
            // Update lng
            updatedBlock = updatedBlock.replace(/lng:\s?-?\d+\.?\d*,/, `lng: ${coords.lng.toFixed(6)},`);

            if (updatedBlock !== fullBlock) {
                replacements.push({
                    start: match.index,
                    end: match.index + fullBlock.length,
                    newText: updatedBlock
                });
                modified = true;
            }
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Apply replacements from back to front to keep indices valid
    if (modified) {
        let newContent = content;
        for (let i = replacements.length - 1; i >= 0; i--) {
            const r = replacements[i];
            newContent = newContent.slice(0, r.start) + r.newText + newContent.slice(r.end);
        }
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  Updated ${replacements.length} venues in ${path.basename(filePath)}.`);
    } else {
        console.log(`  No changes needed for ${path.basename(filePath)}.`);
    }
}

async function run() {
    const files = fs.readdirSync(LOCATIONS_DIR).filter(f => f.endsWith('.js'));

    for (const file of files) {
        await processFile(path.join(LOCATIONS_DIR, file));
    }

    console.log('\nGeocoding complete! 🚀');
}

run();
