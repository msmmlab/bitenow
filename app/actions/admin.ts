'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const ADMIN_COOKIE = 'nowbite_admin_key';

export async function adminLogin(formData: FormData) {
    const key = formData.get('key') as string;
    if (key === process.env.ADMIN_SECRET_KEY) {
        // In a real app, use a secure session. For MVP, we check the cookie value against env on every action or page load.
        // Here we just set a cookie that matches.
        (await cookies()).set(ADMIN_COOKIE, key, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        return { success: true };
    }
    return { error: 'Invalid Key' };
}

export async function isAuthenticated() {
    const c = await cookies();
    const key = c.get(ADMIN_COOKIE)?.value;
    return key === process.env.ADMIN_SECRET_KEY;
}

export async function getAdminData() {
    const isAuth = await isAuthenticated();
    if (!isAuth) return { error: 'Unauthorized' };

    const { data: restaurants } = await supabaseAdmin
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

    // Also get recent messages
    const { data: messages } = await supabaseAdmin
        .from('inbound_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    return { restaurants, messages };
}

export async function createRestaurant(formData: FormData) {
    const isAuth = await isAuthenticated();
    if (!isAuth) return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const phone = formData.get('phone') as string;
    const category = formData.get('category') as string;

    // 1. Create Restaurant
    const { data: rest, error: restError } = await supabaseAdmin
        .from('restaurants')
        .insert({
            name,
            slug,
            category,
            is_active: true
        })
        .select()
        .single();

    if (restError) return { error: restError.message };

    // 2. Create Contact
    if (phone) {
        await supabaseAdmin.from('restaurant_contacts').insert({
            restaurant_id: rest.id,
            contact_name: 'Manager',
            phone_e164: phone,
            verified: true
        });
    }

    revalidatePath('/admin');
    return { success: true };
}
