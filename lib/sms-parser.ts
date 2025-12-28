export interface ParsedSpecial {
    title: string;
    time_desc: string | null;
    start_time: Date | null;
    end_time: Date | null;
}

export function parseSmsBody(body: string): ParsedSpecial {
    const normalized = body.trim();
    let title = normalized;
    let time_desc: string | null = null;

    // 1. Detect "until X" pattern
    const untilMatch = normalized.match(/until\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (untilMatch) {
        time_desc = `Until ${untilMatch[1]}`;
        // potentially remove from title if desired, but user might want it kept
        // title = title.replace(untilMatch[0], '').trim(); 
    }

    // 2. Detect range "X-Ypm" or "X to Y"
    if (!time_desc) {
        const rangeMatch = normalized.match(/(\d{1,2}(?:am|pm)?)\s*[-to]\s*(\d{1,2}(?:am|pm)?)/i);
        if (rangeMatch) {
            time_desc = `${rangeMatch[1]} - ${rangeMatch[2]}`;
        }
    }

    // 3. Keywords
    if (!time_desc) {
        if (normalized.toLowerCase().includes('tonight')) time_desc = 'Tonight';
        if (normalized.toLowerCase().includes('lunch')) time_desc = 'Lunch';
        if (normalized.toLowerCase().includes('dinner')) time_desc = 'Dinner';
        if (normalized.toLowerCase().includes('all day')) time_desc = 'All Day';
    }

    // Fallback
    if (!time_desc) {
        time_desc = 'Today';
    }

    // Capitalize first letter of title
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return {
        title,
        time_desc,
        start_time: null, // Specific date parsing omitted for basic MVP
        end_time: null
    };
}
