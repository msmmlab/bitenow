
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanup() {
    console.log("Checking for duplicates in Noosa...");
    const { data: dbVenues } = await supabase.from('restaurants').select('slug, name').eq('town', 'Noosa');

    const noosaData = require('../locations/noosa.js');
    const localSlugs = new Set(noosaData.venues.map(v => v.slug));

    for (const dbVenue of dbVenues) {
        if (!localSlugs.has(dbVenue.slug)) {
            console.log(`🗑️ Deleting zombie venue in DB: ${dbVenue.name} (${dbVenue.slug})`);
            await supabase.from('restaurants').delete().eq('slug', dbVenue.slug);
        }
    }
    console.log("Done.");
}

cleanup();
