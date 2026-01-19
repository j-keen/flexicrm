import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface LandingPageDetails {
    id: string;
    organization_id: string;
    name: string;
    is_active: boolean;
}

export const PublicLandingPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [pageDetails, setPageDetails] = useState<LandingPageDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchPage() {
            if (!slug) return;
            try {
                // Fetch public page details
                const { data, error } = await supabase
                    .from('landing_pages')
                    .select('id, organization_id, name, is_active')
                    .eq('slug', slug)
                    .eq('is_active', true)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Page not found');

                setPageDetails(data);
            } catch (err: any) {
                console.error('Error fetching landing page:', err);
                setError('Page not found or is no longer active.');
            } finally {
                setLoading(false);
            }
        }
        fetchPage();
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim() || !pageDetails) return;

        setSubmitting(true);
        try {
            // Insert into customers table
            // We assume a simple structure: data: { phone: ... }
            const { error } = await supabase
                .from('customers')
                .insert([
                    {
                        organization_id: pageDetails.organization_id,
                        source_landing_page_id: pageDetails.id,
                        data: {
                            mobile: phone, // Using 'mobile' as a standard key. Could be configurable.
                            name: `Visitor (${phone.slice(-4)})`, // Default name
                            source: 'Landing Page'
                        }
                    }
                ]);

            if (error) throw error;
            setSuccess(true);
            setPhone('');
        } catch (err: any) {
            console.error('Error submitting form:', err);
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-600" />
            </div>
        );
    }

    if (error || !pageDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Unavailable</h1>
                <p className="text-gray-600 block text-center max-w-md">
                    {error || "The page you are looking for doesn't exist."}
                </p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
                    <p className="text-gray-600 mb-8">
                        Your information has been registered successfully.
                    </p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-brand-600 font-medium hover:text-brand-700"
                    >
                        Register another number
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-brand-600 px-8 py-10 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">{pageDetails.name}</h1>
                    <p className="text-brand-100">Welcome! Please enter your number below.</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                    placeholder="010-1234-5678"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                "Submit"
                            )}
                        </button>
                    </form>
                </div>

                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">Powered by FlexiCRM</p>
                </div>
            </div>
        </div>
    );
};
