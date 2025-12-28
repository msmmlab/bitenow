import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import twilio from 'twilio';
import { parseSmsBody } from '@/lib/sms-parser';

const MessagingResponse = twilio.twiml.MessagingResponse;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const Body = formData.get('Body') as string;
        const From = formData.get('From') as string;

        console.log(`[SMS] Inbound from ${From}: ${Body}`);

        // 1. Log the message
        const { data: logEntry, error: logError } = await supabase
            .from('inbound_messages')
            .insert({ from_phone: From, body: Body, parsed_ok: false })
            .select()
            .single();

        if (logError) console.error('Log error', logError);

        // 2. Identification: Find restaurant by phone
        const { data: contact, error: contactError } = await supabase
            .from('restaurant_contacts')
            .select('restaurant_id, restaurants(name)')
            .eq('phone_e164', From)
            .eq('verified', true)
            .single();

        const twiml = new MessagingResponse();

        if (!contact || contactError) {
            twiml.message(`Hi! We don't recognize this number. Please contact us to register.`);
        } else {
            // 3. Parsing
            const parsed = parseSmsBody(Body);

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
                    title: parsed.title,
                    description: parsed.time_desc ? `Time: ${parsed.time_desc}` : '',
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
                // Mock Token
                const token = special ? Buffer.from(special.id).toString('base64').replace(/=/g, '') : 'error';
                const editLink = `${process.env.NEXT_PUBLIC_APP_URL}/e/${token}`;

                // @ts-ignore
                const name = contact.restaurants?.name || 'Partner';
                twiml.message(`Thanks ${name}! ✅ Special: "${parsed.title}"\nTime: ${parsed.time_desc}\n\nEdit: ${editLink}`);

                // Update parsed status
                if (logEntry) {
                    await supabase.from('inbound_messages')
                        .update({ parsed_ok: true, restaurant_id: restaurantId })
                        .eq('id', logEntry.id);
                }
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
