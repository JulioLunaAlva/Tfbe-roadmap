import { useState, useRef, useEffect } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

// Predefined color palette for tags
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Prioritario': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
    'Quick Win': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
    'Piloto': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    'Requiere Aprobación': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    'Bloqueado': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
    'En Revisión': { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
    'Mejora Continua': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
    'Regulatorio': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
};

const DEFAULT_COLOR = { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' };

const SUGGESTED_TAGS = Object.keys(TAG_COLORS);

const getTagColor = (tag: string) => TAG_COLORS[tag] || DEFAULT_COLOR;

interface TagsEditorProps {
    initiativeId: string;
    tags: string[];
    onTagsChanged: (newTags: string[]) => void;
    readOnly?: boolean;
}

export const TagsEditor = ({ initiativeId, tags, onTagsChanged, readOnly }: TagsEditorProps) => {
    const { token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    const saveTags = async (newTags: string[]) => {
        onTagsChanged(newTags);
        try {
            await fetch(`${API_URL}/api/initiatives/${initiativeId}/tags`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tags: newTags }),
            });
        } catch (err) {
            console.error('Failed to save tags:', err);
        }
    };

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (!trimmed || tags.includes(trimmed)) return;
        saveTags([...tags, trimmed]);
        setInputValue('');
    };

    const removeTag = (tag: string) => {
        saveTags(tags.filter(t => t !== tag));
    };

    const filteredSuggestions = SUGGESTED_TAGS.filter(
        s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
        <div className="relative inline-flex flex-wrap items-center gap-0.5">
            {/* Display tags */}
            {tags.map(tag => {
                const color = getTagColor(tag);
                return (
                    <span
                        key={tag}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[8px] font-bold border ${color.bg} ${color.text} ${color.border} whitespace-nowrap`}
                    >
                        {tag}
                        {!readOnly && (
                            <button
                                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                className="hover:opacity-70 ml-0.5"
                            >
                                <X size={8} />
                            </button>
                        )}
                    </span>
                );
            })}

            {/* Add button */}
            {!readOnly && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="inline-flex items-center gap-0.5 px-1 py-0 rounded text-[8px] text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                    title="Agregar etiqueta"
                >
                    <Plus size={8} />
                    <Tag size={8} />
                </button>
            )}

            {/* Popover */}
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-[#1E2630] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-48"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && inputValue.trim()) {
                                addTag(inputValue);
                            }
                        }}
                        placeholder="Escribir o elegir..."
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none mb-1.5"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                        {filteredSuggestions.map(s => {
                            const color = getTagColor(s);
                            return (
                                <button
                                    key={s}
                                    onClick={() => { addTag(s); }}
                                    className={`w-full text-left px-2 py-1 text-[10px] font-semibold rounded hover:opacity-80 transition-colors flex items-center gap-1.5 ${color.bg} ${color.text}`}
                                >
                                    <Tag size={10} />
                                    {s}
                                </button>
                            );
                        })}
                        {inputValue.trim() && !SUGGESTED_TAGS.includes(inputValue.trim()) && !tags.includes(inputValue.trim()) && (
                            <button
                                onClick={() => addTag(inputValue)}
                                className="w-full text-left px-2 py-1 text-[10px] font-semibold rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1.5"
                            >
                                <Plus size={10} />
                                Crear "{inputValue.trim()}"
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
