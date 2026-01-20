import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLandingPages, LandingPage, LandingPageContent, DEFAULT_LANDING_CONTENT } from '../../hooks/useLandingPages';
import { Loader2, Plus, Copy, ExternalLink, Trash2, Globe, X, Phone, CheckCircle } from 'lucide-react';

export const ReceptionManager: React.FC = () => {
    const { profile } = useAuth();
    const { pages, loading, createPage, updatePage, deletePage } = useLandingPages(profile?.organization_id);

    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
    const [editContent, setEditContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
    const [saving, setSaving] = useState(false);

    const createDropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (createDropdownRef.current && !createDropdownRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
                setIsCreating(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const copyLink = (slug: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/p/${slug}`;
        navigator.clipboard.writeText(url);
        alert('링크가 복사되었습니다!');
    };

    const openEditor = (page: LandingPage) => {
        setEditingPage(page);
        setEditContent(page.content);
    };

    const handleSaveContent = async () => {
        if (!editingPage) return;
        setSaving(true);
        try {
            await updatePage(editingPage.id, { content: editContent });
            setEditingPage(null);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePage = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('정말 삭제하시겠습니까?')) {
            await deletePage(id);
        }
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
            {/* Header - Title and New Page Button inline */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-800">접수처 관리</h1>

                    {/* New Page Button with Dropdown - 제목 옆 */}
                    <div className="relative">
                        <button
                            ref={buttonRef}
                            onClick={() => setIsCreating(!isCreating)}
                            className="flex items-center bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md shadow-sm transition-transform active:scale-95 font-medium text-xs"
                        >
                            <Plus size={14} className="mr-1" />
                            New
                        </button>

                        {/* Dropdown Create Form */}
                        {isCreating && (
                            <div
                                ref={createDropdownRef}
                                className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50"
                            >
                                <form onSubmit={handleCreate} className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">접수처 이름</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="예: 본점 접수처"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            autoFocus
                                        />
                                        {createError && <p className="text-red-500 text-xs mt-1">{createError}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-brand-700"
                                        >
                                            생성
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">고객 등록을 위한 공개 랜딩 페이지를 관리합니다.</p>
            </div>

            {/* Card Grid */}
            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {pages.map(page => (
                        <div
                            key={page.id}
                            onClick={() => openEditor(page)}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand-300 transition-all p-3 group cursor-pointer"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-2">
                                <div className="p-1.5 bg-brand-50 rounded-md">
                                    <Globe size={14} className="text-brand-600" />
                                </div>
                                <button
                                    onClick={(e) => handleDeletePage(page.id, e)}
                                    className="p-1 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="삭제"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            {/* Name and Content Preview */}
                            <h3 className="font-medium text-sm text-gray-900 truncate mb-0.5" title={page.name}>{page.name}</h3>
                            <p className="text-xs text-gray-400 truncate mb-1">{page.content.title}</p>
                            <p className="text-[10px] text-gray-300 font-mono truncate mb-2">/p/{page.slug}</p>

                            {/* Actions */}
                            <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                                <button
                                    onClick={(e) => copyLink(page.slug, e)}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                >
                                    <Copy size={10} />
                                    복사
                                </button>
                                <a
                                    href={`/p/${page.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center px-2 py-1 bg-brand-50 border border-brand-100 rounded text-xs font-medium text-brand-600 hover:bg-brand-100 transition-colors"
                                    title="새 탭에서 열기"
                                >
                                    <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    ))}

                    {pages.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Globe size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">접수처가 없습니다</p>
                            <p className="text-sm mb-4">새로운 접수처를 만들어 고객 정보를 수집하세요.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
                            >
                                <Plus size={16} className="mr-1" /> 첫 접수처 만들기
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal with Preview */}
            {editingPage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex">
                        {/* Left: Form */}
                        <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">페이지 편집</h2>
                                <button onClick={() => setEditingPage(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={editContent.title}
                                        onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                                    <input
                                        type="text"
                                        value={editContent.description}
                                        onChange={(e) => setEditContent({ ...editContent, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">입력 필드 라벨</label>
                                    <input
                                        type="text"
                                        value={editContent.inputLabel}
                                        onChange={(e) => setEditContent({ ...editContent, inputLabel: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">입력 필드 Placeholder</label>
                                    <input
                                        type="text"
                                        value={editContent.inputPlaceholder}
                                        onChange={(e) => setEditContent({ ...editContent, inputPlaceholder: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">전송 버튼 텍스트</label>
                                    <input
                                        type="text"
                                        value={editContent.buttonText}
                                        onChange={(e) => setEditContent({ ...editContent, buttonText: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">완료 제목</label>
                                    <input
                                        type="text"
                                        value={editContent.successTitle}
                                        onChange={(e) => setEditContent({ ...editContent, successTitle: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">완료 메시지</label>
                                    <input
                                        type="text"
                                        value={editContent.successMessage}
                                        onChange={(e) => setEditContent({ ...editContent, successMessage: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">테마 색상</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={editContent.primaryColor || '#4f46e5'}
                                            onChange={(e) => setEditContent({ ...editContent, primaryColor: e.target.value })}
                                            className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={editContent.primaryColor || '#4f46e5'}
                                            onChange={(e) => setEditContent({ ...editContent, primaryColor: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                                            placeholder="#4f46e5"
                                        />
                                    </div>
                                    {/* Color Presets */}
                                    <div className="flex gap-2 mt-2">
                                        {['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#1f2937'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setEditContent({ ...editContent, primaryColor: color })}
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={handleSaveContent}
                                        disabled={saving}
                                        className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : '저장'}
                                    </button>
                                    <button
                                        onClick={() => setEditingPage(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="w-1/2 bg-gray-100 p-6 overflow-y-auto flex items-center justify-center">
                            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden transform scale-90">
                                {/* Preview header with dynamic color */}
                                <div className="px-6 py-8 text-center" style={{ backgroundColor: editContent.primaryColor || '#4f46e5' }}>
                                    <h1 className="text-xl font-bold text-white mb-1">{editContent.title || 'Title'}</h1>
                                    <p className="text-white/70 text-sm">{editContent.description || 'Description'}</p>
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {editContent.inputLabel || 'Label'}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone size={16} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                disabled
                                                placeholder={editContent.inputPlaceholder || 'Placeholder'}
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                            />
                                        </div>
                                    </div>
                                    {/* Button with dynamic color */}
                                    <button
                                        className="w-full py-2.5 text-white rounded-lg font-medium text-sm"
                                        style={{ backgroundColor: editContent.primaryColor || '#4f46e5' }}
                                    >
                                        {editContent.buttonText || 'Submit'}
                                    </button>
                                </div>
                                <div className="px-6 py-3 bg-gray-50 border-t text-center">
                                    <p className="text-[10px] text-gray-400">Powered by FlexiCRM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
