import { getSpecialByToken, updateSpecial } from '@/app/actions/edit-special';
import { redirect } from 'next/navigation';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

export default async function EditSpecialPage({ params }: { params: { token: string } }) {
    const { data: special, error } = await getSpecialByToken(params.token);

    if (error || !special) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="bg-white p-6 rounded-xl shadow-sm text-center max-w-sm">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
                    <p className="text-gray-500 mb-4">This edit link is invalid or has expired.</p>
                    <Link href="/" className="text-black underline">Go Home</Link>
                </div>
            </div>
        );
    }

    async function updateAction(formData: FormData) {
        'use server';
        await updateSpecial(special.id, formData);
        redirect(`/?updated=true`); // Redirect to home or show success
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-black text-white p-4">
                    <div className="text-xs font-medium opacity-75 uppercase tracking-wide">Editing Special for</div>
                    <h1 className="text-xl font-bold">{special.restaurants?.name}</h1>
                </div>

                <form action={updateAction} className="p-6 space-y-4">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <label className="font-medium text-gray-900">Live on Feed</label>
                        <input
                            name="is_active"
                            type="checkbox"
                            defaultChecked={special.is_active}
                            className="w-5 h-5 accent-black"
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                        <input
                            name="title"
                            defaultValue={special.title}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">e.g. "$12 Fish Tacos"</p>
                    </div>

                    {/* Description / Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details / Time</label>
                        <textarea
                            name="description"
                            defaultValue={special.description}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px]"
                        />
                        <p className="text-xs text-gray-400 mt-1">e.g. "Until 6pm. Dine-in only."</p>
                    </div>

                    <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        Save Changes
                    </button>
                </form>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
                Secure link expires in 24h (Mock). <br />
                Share this link only with staff.
            </p>
        </div>
    );
}
