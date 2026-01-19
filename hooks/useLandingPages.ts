import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface LandingPage {
    id: string;
    organization_id: string;
    name: string;
    slug: string;
    is_active: boolean;
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

            setPages(data || []);
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
                        is_active: true
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setPages(prev => [data, ...prev]);
            return data;
        } catch (err: any) {
            console.error('Error creating landing page:', err);
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
        deletePage,
        refresh: fetchPages
    };
}
