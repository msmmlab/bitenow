
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

async function checkSpecialsSchema() {
    try {
        console.log("Checking 'specials' table...");
        const { data, error } = await supabase.from('specials').select('*').limit(1);
        if (error) {
            console.log("'specials' table error or not found:", error.message);
        } else if (data && data.length > 0) {
            console.log("Current specials columns:", Object.keys(data[0]));
            console.log("Sample special:", data[0]);
        } else {
            console.log("'specials' table is empty.");
        }
    } catch (err) {
        console.error("Error checking specials schema:", err.message);
    }
}

checkSpecialsSchema();
