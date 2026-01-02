import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import twilio from 'twilio';
import { analyzeSMS } from '@/lib/gemini';

const MessagingResponse = twilio.twiml.MessagingResponse;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const Body = formData.get('Body') as string || '';
        const From = formData.get('From') as string;
        const NumMedia = parseInt(formData.get('NumMedia') as string || '0');

        // Capture Media URLs
        const mediaUrls: string[] = [];
        for (let i = 0; i < NumMedia; i++) {
            const url = formData.get(`MediaUrl${i}`);
            if (url) mediaUrls.push(url as string);
        }

        console.log(`[SMS] Inbound from ${From}: ${Body} (${NumMedia} images)`);

        // 1. Log the message
        const { data: logEntry, error: logError } = await supabase
            .from('inbound_messages')
            .insert({
                from_phone: From,
                body: Body,
                media_urls: mediaUrls,
                parsed_ok: false
            })
            .select()
            .single();

        if (logError) console.error('Log error', logError);

        // 2. Identification: Find restaurant by phone
        let { data: contact, error: contactError } = await supabase
            .from('restaurant_contacts')
            .select('restaurant_id, restaurants(name)')
            .eq('phone_e164', From)
            .eq('verified', true)
            .single();

        // TEST MODE/PILOT OVERRIDE: 
        // If not found, and we are in dev/test, or message starts with 'test:', or it's our first pilot venue
        if (!contact && (process.env.NODE_ENV === 'development' || Body.toLowerCase().includes('test'))) {
            const { data: testVenue } = await supabase
                .from('restaurants')
                .select('id, name')
                .eq('slug', 'land-and-sea')
                .single();

            if (testVenue) {
                contact = {
                    restaurant_id: testVenue.id,
                    // @ts-ignore
                    restaurants: { name: testVenue.name }
                } as any;
            }
        }

        const twiml = new MessagingResponse();

        if (!contact) {
            twiml.message(`Hi! 🦖 BiteNow here. We don't recognize this number as a registered venue owner. Text 'CLAIM [Venue Name]' to register or contact support.`);
        } else {
            // 3. Parsing with Gemini
            const analysis = await analyzeSMS(Body, mediaUrls);

            if (analysis.type === 'special' && analysis.specialData) {
                // 4. Upsert Special for Today
                const today = new Date().toISOString().split('T')[0];
                const restaurantId = contact.restaurant_id;

                // Deactivate old specials for today for this restaurant
                await supabase
                    .from('specials')
                    .update({ is_active: false })
                    .eq('restaurant_id', restaurantId)
                    .eq('date_local', today);

                // Insert new
                const { data: special, error: insertError } = await supabase
                    .from('specials')
                    .insert({
                        restaurant_id: restaurantId,
                        title: analysis.specialData.title,
                        description: analysis.specialData.description,
                        price: analysis.specialData.price,
                        date_local: today,
                        is_active: true,
                        source: 'sms'
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Insert Error', insertError);
                    twiml.message(`Sorry, we had trouble saving your special. Please try again.`);
                } else {
                    // 5. Reply
                    const token = special ? Buffer.from(special.id).toString('base64').replace(/=/g, '') : 'error';
                    const editLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bitenow.com.au'}/e/${token}`;

                    // @ts-ignore
                    const name = contact.restaurants?.name || 'Partner';
                    twiml.message(`${analysis.response}\n\n✅ Live on BiteNow: "${analysis.specialData.title}"\n\nEdit or add more details: ${editLink}`);

                    // Update parsed status
                    if (logEntry) {
                        await supabase.from('inbound_messages')
                            .update({ parsed_ok: true, restaurant_id: restaurantId })
                            .eq('id', logEntry.id);
                    }
                }
            } else {
                // Not a special (question or other)
                twiml.message(analysis.response);
            }
        }

        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error) {
        console.error('SMS Error', error);
        const twiml = new MessagingResponse();
        twiml.message('System error. Please try again later.');
        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }
}
