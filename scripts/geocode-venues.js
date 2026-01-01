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
        // Standardize input
        const cleanName = name.replace(/\(.*\)/, '').trim(); // Remove brackets like "(Noosa)"
        const fullQuery = `${cleanName}, ${address}`;
        const hasStreetNumber = /\d+\s+[A-Za-z]/.test(address);

        console.log(`    Searching for: "${fullQuery}" (Street Number: ${hasStreetNumber})`);

        // Search with broad types
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullQuery)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=false&limit=5&country=au&types=poi,address&proximity=153.0906,-26.3968`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            console.log(`    [No Results]`);
            return null;
        }

        // Smart Selection Logic
        let selected = null;
        let source = 'unknown';

        if (hasStreetNumber) {
            // Priority 1: Exact Address Match
            const addressMatch = data.features.find(f => f.place_type.includes('address'));
            if (addressMatch) {
                selected = addressMatch;
                source = 'address';
                console.log(`    [Match] Address prioritized: ${selected.place_name}`);
            }
        }

        // Priority 2: High relevance POI (only if we didn't find a mandatory address or address wasn't required)
        if (!selected) {
            const poiMatch = data.features.find(f => f.place_type.includes('poi') && f.relevance > 0.8);
            if (poiMatch) {
                selected = poiMatch;
                source = 'poi';
                console.log(`    [Match] POI found: ${selected.place_name}`);
            }
        }

        // Priority 3: Fallback to best relevant match if nothing specific
        if (!selected && data.features[0].relevance > 0.6) {
            selected = data.features[0];
            source = selected.place_type[0];
            console.log(`    [Match] Best guess (${source}): ${selected.place_name}`);
        }

        if (selected) {
            const [lng, lat] = selected.center;
            return {
                lat,
                lng,
                source,
                accuracy: source === 'address' ? 'high' : 'medium'
            };
        }

    } catch (error) {
        console.error(`Failed to geocode: ${address}`, error.message);
    }
    return null;
}

async function processFile(filePath) {
    console.log(`Processing ${path.basename(filePath)}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // Matches the entire object block to replace coords
    // Regex logic: Find name, then address, then capture the whole block until end of object
    // This is tricky with regex. Simplified approach: replace specific lines within the block context?
    // The previous regex was unstable. Let's use a simpler "Find venue object" approach or just replace coords line-by-line using a state machine reader?
    // Actually, for this task, let's stick to the previous regex pattern but make it robust for the new fields.
    // NOTE: The previous script used a regex that might miss complex objects. 
    // Ideally we would parse AST, but for this "flat" JS file, regex is acceptable if careful.

    // We will look for `name: "..." ... address: "..."` and then look for lat/lng in between or after.
    const venueRegex = /\{\s*name:\s*"([^"]+)",[\s\S]*?address:\s*"([^"]+)",[\s\S]*?\}/g;

    let match;
    let modified = false;
    // We can't use replacements array easily with overlapping regex. 
    // We will build a new file content string or perform replacements carefully.
    // Better: split file by lines and process? No, object is multi-line.

    // Let's iterate matches, geocode, and perform string replacement on the MATCHED block.
    // We need to re-read content or offset indices.

    // To allow multiple replacements, we collect them and apply back-to-front.
    const replacements = [];

    while ((match = venueRegex.exec(content)) !== null) {
        const fullBlock = match[0];
        const name = match[1];
        const address = match[2];
        const index = match.index;

        if (fullBlock.includes('manual_coords: true')) {
            continue;
        }

        // Check if we already have a high-quality source?
        // If the file already has 'coords_source: "address"', maybe skip?
        // User asked to "Improve geocoding", implying we should run it to fix bad ones.
        // Let's run it.

        const result = await geocodeAddress(name, address);

        if (result && result.lat && result.lng) {
            // Replace lat/lng lines in the block
            let newBlock = fullBlock;

            // Safe replace ensuring we don't break simple integers or other fields
            newBlock = newBlock.replace(/lat:\s*(-?\d+\.?\d*),/, `lat: ${result.lat.toFixed(6)},`);
            newBlock = newBlock.replace(/lng:\s*(-?\d+\.?\d*),/, `lng: ${result.lng.toFixed(6)},`); // Added precision

            // Add or Update Metadata
            // If coords_source exists, replace it, else add it
            if (newBlock.includes('coords_source:')) {
                newBlock = newBlock.replace(/coords_source:\s*"[^"]+",/, `coords_source: "${result.source}",`);
            } else {
                // Insert after lng
                newBlock = newBlock.replace(/(lng: [^,]+,)/, `$1\n            coords_source: "${result.source}",`);
            }

            if (newBlock.includes('coords_accuracy:')) {
                newBlock = newBlock.replace(/coords_accuracy:\s*"[^"]+",/, `coords_accuracy: "${result.accuracy}",`);
            } else {
                newBlock = newBlock.replace(/(coords_source: "[^"]+",)/, `$1\n            coords_accuracy: "${result.accuracy}",`);
            }

            if (newBlock !== fullBlock) {
                replacements.push({
                    start: index,
                    end: index + fullBlock.length,
                    newText: newBlock
                });
            }
        }

        await new Promise(r => setTimeout(r, 200)); // Rate limit
    }

    if (replacements.length > 0) {
        let newContent = content;
        // Sort reverse order
        replacements.sort((a, b) => b.start - a.start);

        for (const r of replacements) {
            newContent = newContent.substring(0, r.start) + r.newText + newContent.substring(r.end);
        }
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✅ Updated ${replacements.length} venues.`);
    } else {
        console.log(`  No changes.`);
    }
}

async function run() {
    const files = fs.readdirSync(LOCATIONS_DIR).filter(f => f.endsWith('.js') && f !== 'sampleTown.js');
    for (const file of files) {
        await processFile(path.join(LOCATIONS_DIR, file));
    }
    console.log('\nGeocoding complete! 🚀');
}

run();
