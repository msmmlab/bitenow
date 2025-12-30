import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeSMS } from '@/lib/gemini';
import twilio from 'twilio';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const body = formData.get('Body') as string;
        const from = formData.get('From') as string;

        // Extract all media URLs (Twilio sends MediaUrl0, MediaUrl1...)
        const imageUrls: string[] = [];
        let i = 0;
        while (formData.has(`MediaUrl${i}`)) {
            imageUrls.push(formData.get(`MediaUrl${i}`) as string);
            i++;
        }

        console.log(`📩 Received SMS from ${from}: "${body}" with ${imageUrls.length} images.`);

        // 1. Identify Restaurant
        // We match against activation_phone (E.164 format)
        const { data: restaurant, error: rError } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('activation_phone', from)
            .single();

        if (rError || !restaurant) {
            console.error(`❌ Restaurant not found for phone ${from}`, rError);
            const response = new twilio.twiml.MessagingResponse();
            response.message("Sorry, we don't recognize this number. Please contact BiteNow support to activate your venue.");
            return new Response(response.toString(), {
                headers: { 'Content-Type': 'text/xml' }
            });
        }

        // 2. Analyze with Gemini
        const analysis = await analyzeSMS(body, imageUrls);
        console.log(`🤖 AI Analysis for ${restaurant.name}:`, analysis);

        // 3. Take Action
        if (analysis.type === 'special' && analysis.specialData) {
            const today = new Date().toISOString().split('T')[0];

            // Upsert special for today
            const { error: sError } = await supabase
                .from('specials')
                .upsert({
                    restaurant_id: restaurant.id,
                    title: analysis.specialData.title,
                    description: analysis.specialData.description,
                    date_local: today,
                    source: 'sms'
                });

            if (sError) {
                console.error("❌ Error saving special:", sError);
                analysis.response = "I tried to save your special but hit a technical snag. Please try again in a moment!";
            }
        }

        // 4. Log the message
        await supabase.from('inbound_messages').insert({
            restaurant_id: restaurant.id,
            from_phone: from,
            body: body,
            parsed_ok: analysis.type === 'special'
        });

        // 5. Respond to Owner
        const messagingResponse = new twilio.twiml.MessagingResponse();
        messagingResponse.message(analysis.response);

        return new Response(messagingResponse.toString(), {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error: any) {
        console.error("💥 SMS Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
