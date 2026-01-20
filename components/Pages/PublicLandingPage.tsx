import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { LandingPageContent, DEFAULT_LANDING_CONTENT } from '../../hooks/useLandingPages';

interface LandingPageDetails {
    id: string;
    organization_id: string;
    name: string;
    is_active: boolean;
    content: LandingPageContent;
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
                const { data, error } = await supabase
                    .from('landing_pages')
                    .select('id, organization_id, name, is_active, content')
                    .eq('slug', slug)
                    .eq('is_active', true)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Page not found');

                // Merge with defaults
                setPageDetails({
                    ...data,
                    content: { ...DEFAULT_LANDING_CONTENT, ...(data.content || {}) }
                });
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
            const { error } = await supabase
                .from('customers')
                .insert([
                    {
                        organization_id: pageDetails.organization_id,
                        source_landing_page_id: pageDetails.id,
                        data: {
                            mobile: phone,
                            name: `Visitor (${phone.slice(-4)})`,
                            source: pageDetails.name
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

    const content = pageDetails.content;

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.successTitle}</h2>
                    <p className="text-gray-600 mb-8">{content.successMessage}</p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-brand-600 font-medium hover:text-brand-700"
                    >
                        다시 등록하기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header with dynamic color */}
                <div
                    className="px-8 py-10 text-center"
                    style={{ backgroundColor: content.primaryColor || '#4f46e5' }}
                >
                    <h1 className="text-2xl font-bold text-white mb-2">{content.title}</h1>
                    <p className="text-white/70">{content.description}</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                {content.inputLabel}
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
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                                    style={{
                                        '--tw-ring-color': content.primaryColor || '#4f46e5'
                                    } as React.CSSProperties}
                                    placeholder={content.inputPlaceholder}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{
                                backgroundColor: content.primaryColor || '#4f46e5',
                            }}
                        >
                            {submitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                content.buttonText
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
