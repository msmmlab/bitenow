// scripts/seedDB.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables from .env.local
function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Main Seeding Logic
async function seedByTown(townSlug) {
    const townFilePath = path.join(__dirname, `../locations/${townSlug}.js`);

    if (!fs.existsSync(townFilePath)) {
        console.error(`Error: Town file not found at ${townFilePath}`);
        process.exit(1);
    }

    const townData = require(townFilePath);
    const { town, venues } = townData;

    console.log(`🚀 Seeding venues for ${town.name}...`);

    for (const venue of venues) {
        try {
            // Prepare venue with town data
            const venueToUpsert = {
                ...venue,
                town: town.name
            };

            const { data: result, error } = await supabase
                .from('restaurants')
                .upsert([venueToUpsert], { onConflict: 'slug' })
                .select();

            if (error) {
                console.error(`❌ Error seeding ${venue.name}:`, error.message);
            } else {
                console.log(`✅ Seeded ${venue.name} (slug: ${venue.slug})`);
            }
        } catch (err) {
            console.error(`❌ Unexpected error for ${venue.name}:`, err.message);
        }
    }

    console.log(`\n✨ Seeding for ${town.name} complete!`);
}

// 3. Execution handle
const townArg = process.argv[2];

if (!townArg) {
    console.error("Usage: node scripts/seedDB.js <town_slug>");
    console.log("Example: node scripts/seedDB.js caloundra");
    process.exit(1);
}

seedByTown(townArg).catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
