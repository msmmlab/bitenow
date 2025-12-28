import { adminLogin, createRestaurant, getAdminData, isAuthenticated } from '@/app/actions/admin';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
    const isAuth = await isAuthenticated();

    if (!isAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form action={async (formData) => {
                    'use server';
                    const res = await adminLogin(formData);
                    if (res.success) redirect('/admin');
                }} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
                    <h1 className="text-xl font-bold text-center">Admin Access</h1>
                    <input
                        name="key"
                        type="password"
                        placeholder="Secret Key"
                        className="w-full p-3 border rounded-lg"
                    />
                    <button className="w-full bg-black text-white p-3 rounded-lg font-bold">Login</button>
                </form>
            </div>
        );
    }

    const { restaurants, messages } = await getAdminData();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">BiteNow Admin</h1>
                    <div className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">Authenticated</div>
                </div>

                {/* Add Restaurant */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold mb-4">Add Restaurant</h2>
                    <form action={async (formData) => {
                        'use server';
                        await createRestaurant(formData);
                    }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="name" placeholder="Venue Name" className="p-2 border rounded" required />
                        <input name="slug" placeholder="Slug (e.g. beach-bar)" className="p-2 border rounded" required />
                        <input name="category" placeholder="Category (Burger, Pizza...)" className="p-2 border rounded" required />
                        <input name="phone" placeholder="Auth Phone (+1...)" className="p-2 border rounded" required />
                        <button className="bg-black text-white p-2 rounded col-span-1 md:col-span-2 font-medium">Create Restaurant</button>
                    </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Restaurant List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="font-bold mb-4">Restaurants ({restaurants?.length})</h2>
                        <div className="space-y-2">
                            {restaurants?.map((r: any) => (
                                <div key={r.id} className="flex justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                    <span className="font-medium">{r.name}</span>
                                    <span className="text-gray-500">{r.slug}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inbound Messages */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="font-bold mb-4">Recent SMS Log</h2>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {messages?.map((m: any) => (
                                <div key={m.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-xs">{m.from_phone}</span>
                                        <span className={`text-xs ${m.parsed_ok ? 'text-green-600' : 'text-orange-600'}`}>{m.parsed_ok ? 'Parsed' : 'Pending'}</span>
                                    </div>
                                    <p className="text-gray-700">{m.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
