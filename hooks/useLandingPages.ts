import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface LandingPageContent {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    buttonText: string;
    successTitle: string;
    successMessage: string;
    primaryColor: string; // hex color code
}

export const DEFAULT_LANDING_CONTENT: LandingPageContent = {
    title: 'Welcome',
    description: 'Please enter your contact number below.',
    inputLabel: 'Phone Number',
    inputPlaceholder: '010-1234-5678',
    buttonText: 'Submit',
    successTitle: 'Thank you!',
    successMessage: 'Your information has been registered successfully.',
    primaryColor: '#4f46e5' // brand-600
};

export interface LandingPage {
    id: string;
    organization_id: string;
    name: string;
    slug: string;
    is_active: boolean;
    content: LandingPageContent;
    created_at: string;
}

export function useLandingPages(organizationId: string | undefined) {
    const [pages, setPages] = useState<LandingPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPages = useCallback(async () => {
        if (!organizationId) {
            setPages([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('landing_pages')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Ensure content has defaults
            const pagesWithDefaults = (data || []).map(page => ({
                ...page,
                content: { ...DEFAULT_LANDING_CONTENT, ...(page.content || {}) }
            }));

            setPages(pagesWithDefaults);
        } catch (err: any) {
            console.error('Error fetching landing pages:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    const createPage = async (name: string) => {
        if (!organizationId) return null;

        try {
            // Generate a random slug
            const randomSlug = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);

            const { data, error } = await supabase
                .from('landing_pages')
                .insert([
                    {
                        organization_id: organizationId,
                        name,
                        slug: randomSlug,
                        is_active: true,
                        content: { ...DEFAULT_LANDING_CONTENT, title: name }
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            const pageWithContent = {
                ...data,
                content: { ...DEFAULT_LANDING_CONTENT, ...(data.content || {}) }
            };

            setPages(prev => [pageWithContent, ...prev]);
            return pageWithContent;
        } catch (err: any) {
            console.error('Error creating landing page:', err);
            setError(err.message);
            throw err;
        }
    };

    const updatePage = async (id: string, updates: Partial<Pick<LandingPage, 'name' | 'content' | 'is_active'>>) => {
        try {
            const { data, error } = await supabase
                .from('landing_pages')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updatedPage = {
                ...data,
                content: { ...DEFAULT_LANDING_CONTENT, ...(data.content || {}) }
            };

            setPages(prev => prev.map(p => p.id === id ? updatedPage : p));
            return updatedPage;
        } catch (err: any) {
            console.error('Error updating landing page:', err);
            setError(err.message);
            throw err;
        }
    };

    const deletePage = async (id: string) => {
        try {
            const { error } = await supabase
                .from('landing_pages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPages(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error('Error deleting landing page:', err);
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    return {
        pages,
        loading,
        error,
        createPage,
        updatePage,
        deletePage,
        refresh: fetchPages
    };
}
