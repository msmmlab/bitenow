
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

async function checkSchema() {
    try {
        console.log("Fetching first restaurant to check schema...");
        const { data, error } = await supabase.from('restaurants').select('*').limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
            console.log("Current columns:", Object.keys(data[0]));
            console.log("Sample data:", data[0]);
        } else {
            console.log("No data found.");
        }
    } catch (err) {
        console.error("Error checking schema:", err.message);
    }
}

checkSchema();
