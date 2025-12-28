'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// NOTE: Using Service Role for Magic Link access (bypassing Auth)
// In prod, use strictly scoped RLS or signed tokens.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function getSpecialByToken(token: string) {
    try {
        // Decode: base64 -> id
        // Logic from route.ts: Buffer.from(special.id).toString('base64').replace(/=/g, '')
        // Reversing:
        const id = Buffer.from(token, 'base64').toString('ascii');

        // UUID validation regex (simple check)
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            return { error: 'Invalid token format' };
        }

        const { data, error } = await supabaseAdmin
            .from('specials')
            .select('*, restaurants(name)')
            .eq('id', id)
            .single();

        if (error) return { error: error.message };
        return { data };
    } catch (e) {
        return { error: 'Invalid token' };
    }
}

export async function updateSpecial(id: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const is_active = formData.get('is_active') === 'on';

    const { error } = await supabaseAdmin
        .from('specials')
        .update({
            title,
            description,
            is_active,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/'); // Refresh home feed
    revalidatePath(`/e/${Buffer.from(id).toString('base64').replace(/=/g, '')}`);

    return { success: true };
}
