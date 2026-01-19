import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLandingPages } from '../../hooks/useLandingPages';
import { Loader2, Plus, Copy, ExternalLink, Trash2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReceptionManager: React.FC = () => {
    const { profile } = useAuth();
    const { pages, loading, createPage, deletePage } = useLandingPages(profile?.organization_id);

    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setCreateError(null);
        try {
            await createPage(newName);
            setNewName('');
            setIsCreating(false);
        } catch (err: any) {
            setCreateError(err.message);
        }
    };

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/p/${slug}`;
        navigator.clipboard.writeText(url);
        // Could add toast notification here
        alert('Copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-600 mb-4" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Reception Pages</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage public landing pages for customer registration.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md shadow-sm transition-transform active:scale-95 font-medium text-sm"
                >
                    <Plus size={16} className="mr-2" />
                    New Page
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {isCreating && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <form onSubmit={handleCreate} className="flex gap-4 items-start">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Main Office Reception"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    autoFocus
                                />
                                {createError && <p className="text-red-500 text-xs mt-1">{createError}</p>}
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    type="submit"
                                    className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.map(page => (
                        <div key={page.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-brand-100 rounded-lg">
                                    <Globe size={20} className="text-brand-600" />
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => deletePage(page.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg text-gray-900 mb-1">{page.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 font-mono truncate">/p/{page.slug}</p>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => copyLink(page.slug)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                >
                                    <Copy size={14} />
                                    Copy Link
                                </button>
                                <a
                                    href={`/p/${page.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center px-3 py-2 bg-brand-50 border border-brand-100 rounded-md text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}

                    {pages.length === 0 && !isCreating && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Globe size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No reception pages yet</p>
                            <p className="text-sm mb-4">Create one to start collecting contacts.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
                            >
                                <Plus size={16} className="mr-1" /> Create your first page
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
