import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useArea } from '../context/AreaContext';
import {
    FolderOpen, Plus, Trash2, Download, Upload, FileText,
    FilePieChart, File, Search, FolderPlus, ChevronRight,
    MoreVertical, Clock, HardDrive, X, Edit2, Check,
    Presentation, Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import API_URL from '../config/api';
import { UserAvatar } from '../components/common/UserAvatar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Folder {
    id: string;
    name: string;
    description: string;
    business_area_id: string;
    file_count: number;
    created_by_name: string;
    created_by_avatar?: string;
    created_at: string;
}

interface PresentationFile {
    id: string;
    folder_id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by_name: string;
    uploaded_by_avatar?: string;
    created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
};

const fileIcon = (name: string, mime: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['pptx', 'ppt'].includes(ext)) return { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'PowerPoint' };
    if (['pdf'].includes(ext)) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'PDF' };
    if (['xlsx', 'xls'].includes(ext)) return { icon: Layers, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Excel' };
    if (['docx', 'doc'].includes(ext)) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Word' };
    if (mime?.startsWith('image/')) return { icon: FilePieChart, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Imagen' };
    return { icon: File, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20', label: 'Archivo' };
};

// ─── Modal: Nueva Carpeta ─────────────────────────────────────────────────────

const NewFolderModal = ({ onClose, onSave }: { onClose: () => void; onSave: (name: string, desc: string) => void }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <FolderPlus size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Carpeta</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Crea un apartado para organizar presentaciones</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nombre</label>
                        <input
                            ref={inputRef}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name, desc)}
                            placeholder="Ej. Presentaciones Cierre Q3 2026"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="Describe el contenido de esta carpeta..."
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        Cancelar
                    </button>
                    <button
                        disabled={!name.trim()}
                        onClick={() => name.trim() && onSave(name, desc)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
                    >
                        Crear Carpeta
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Component: File Card ──────────────────────────────────────────────────────

const FileCard = ({ file, canEdit, onDelete, onDownload }: {
    file: PresentationFile;
    canEdit: boolean;
    onDelete: () => void;
    onDownload: () => void;
}) => {
    const { icon: Icon, color, bg, label } = fileIcon(file.original_name, file.mime_type);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="group relative bg-white dark:bg-[#1a2332] rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-200 overflow-hidden">
            {/* Color accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                        <Icon size={24} className={color} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', bg, color)}>
                            {label}
                        </span>
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(v => !v)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition opacity-0 group-hover:opacity-100"
                            >
                                <MoreVertical size={14} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-8 z-20 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1.5 min-w-[140px]">
                                    <button onClick={() => { onDownload(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                        <Download size={14} className="text-indigo-500" /> Descargar
                                    </button>
                                    {canEdit && (
                                        <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* File name */}
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-3 line-clamp-2 min-h-[2.5rem]">
                    {file.original_name}
                </p>

                {/* Meta */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <HardDrive size={11} className="flex-shrink-0" />
                        <span>{formatBytes(file.size_bytes)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <UserAvatar
                            name={file.uploaded_by_name}
                            imageUrl={file.uploaded_by_avatar}
                            size="xs"
                        />
                        <span className="truncate">{file.uploaded_by_name || 'Desconocido'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <Clock size={11} className="flex-shrink-0" />
                        <span>{formatDate(file.created_at)}</span>
                    </div>
                </div>

                {/* Download button */}
                <button
                    onClick={onDownload}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                >
                    <Download size={13} /> Descargar
                </button>
            </div>
        </div>
    );
};

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

const UploadZone = ({ onUpload, uploading }: { onUpload: (file: File) => void; uploading: boolean }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onUpload(file);
    };

    return (
        <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={clsx(
                'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
                dragging
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                uploading && 'opacity-50 cursor-wait'
            )}
        >
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pptx,.ppt,.pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                onChange={e => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ''; } }}
            />
            <div className="flex flex-col items-center gap-3">
                <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center transition-all', dragging ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-gray-800')}>
                    {uploading
                        ? <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        : <Upload size={22} className={dragging ? 'text-indigo-500' : 'text-gray-400'} />
                    }
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {uploading ? 'Subiendo archivo...' : 'Arrastra aquí o haz clic para subir'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">PPTX, PDF, DOCX, XLSX, Imágenes — Máx. 50 MB</p>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const PresentationsPage = () => {
    const { token, user } = useAuth();
    const { activeArea } = useArea();
    const canEdit = user?.role === 'admin' || user?.role === 'editor';

    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [files, setFiles] = useState<PresentationFile[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // ── Fetch folders ──────────────────────────────────────────────────────
    const fetchFolders = useCallback(async () => {
        if (!token) return;
        setLoadingFolders(true);
        try {
            // Build query string — areaQueryParam starts with '&', strip it
            const areaParam = activeArea?.id ? `business_area_id=${activeArea.id}` : '';
            const url = `${API_URL}/api/presentations/folders${areaParam ? `?${areaParam}` : ''}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data: Folder[] = await res.json();
                setFolders(data);
                // Auto-select first folder if none selected
                if (data.length > 0) setSelectedFolder(prev => prev ?? data[0]);
            } else {
                const errText = await res.text();
                console.error('Presentations API error:', res.status, errText);
            }
        } catch (err) {
            console.error('fetchFolders failed:', err);
        } finally {
            setLoadingFolders(false);
        }
    }, [token, activeArea?.id]);

    useEffect(() => { fetchFolders(); }, [fetchFolders]);

    // ── Fetch files of selected folder ────────────────────────────────────
    const fetchFiles = useCallback(async (folderId: string) => {
        if (!token) return;
        setLoadingFiles(true);
        try {
            const res = await fetch(`${API_URL}/api/presentations/folders/${folderId}/files`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setFiles(await res.json());
        } finally {
            setLoadingFiles(false);
        }
    }, [token]);

    useEffect(() => {
        if (selectedFolder) fetchFiles(selectedFolder.id);
        else setFiles([]);
    }, [selectedFolder, fetchFiles]);

    // ── Create folder ──────────────────────────────────────────────────────
    const handleCreateFolder = async (name: string, desc: string) => {
        if (!token) return;
        const payload: any = { name, description: desc };
        if (activeArea?.id) payload.business_area_id = activeArea.id;

        const res = await fetch(`${API_URL}/api/presentations/folders`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setShowNewFolder(false);
            await fetchFolders();
        }
    };

    // ── Delete folder ──────────────────────────────────────────────────────
    const handleDeleteFolder = async (folder: Folder) => {
        if (!confirm(`¿Eliminar la carpeta "${folder.name}" y todos sus archivos? Esta acción no se puede deshacer.`)) return;
        await fetch(`${API_URL}/api/presentations/folders/${folder.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (selectedFolder?.id === folder.id) setSelectedFolder(null);
        await fetchFolders();
    };

    // ── Upload file ────────────────────────────────────────────────────────
    const handleUpload = async (file: File) => {
        if (!selectedFolder || !token) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/presentations/folders/${selectedFolder.id}/files`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                await fetchFiles(selectedFolder.id);
                await fetchFolders(); // refresh file_count
            }
        } finally {
            setUploading(false);
        }
    };

    // ── Delete file ────────────────────────────────────────────────────────
    const handleDeleteFile = async (fileId: string) => {
        if (!confirm('¿Eliminar este archivo?')) return;
        await fetch(`${API_URL}/api/presentations/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (selectedFolder) await fetchFiles(selectedFolder.id);
        await fetchFolders();
    };

    // ── Download file ──────────────────────────────────────────────────────
    const handleDownload = async (file: PresentationFile) => {
        const res = await fetch(`${API_URL}/api/presentations/files/${file.id}/download`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Rename folder ──────────────────────────────────────────────────────
    const handleRenameFolder = async (folder: Folder) => {
        if (!editName.trim() || editName === folder.name) { setEditingId(null); return; }
        await fetch(`${API_URL}/api/presentations/folders/${folder.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName.trim(), description: folder.description })
        });
        setEditingId(null);
        await fetchFolders();
    };

    const filteredFiles = files.filter(f => f.original_name.toLowerCase().includes(search.toLowerCase()));

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex h-full bg-[var(--bg-primary)] overflow-hidden">
            {/* ── Left Panel: Folders sidebar ────────────────────────────── */}
            <aside className="w-72 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-white dark:bg-[#111827]">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <FolderOpen size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Presentaciones</h1>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{activeArea?.name || 'Portafolio'}</p>
                        </div>
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => setShowNewFolder(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
                        >
                            <Plus size={14} /> Nueva Carpeta
                        </button>
                    )}
                </div>

                {/* Folder list */}
                <div className="flex-1 overflow-y-auto py-2">
                    {loadingFolders ? (
                        <div className="flex flex-col gap-2 p-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                            ))}
                        </div>
                    ) : folders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 px-4 text-center">
                            <FolderPlus size={28} className="text-gray-300 dark:text-gray-700" />
                            <p className="text-xs text-gray-400 dark:text-gray-600">Aún no hay carpetas. {canEdit ? 'Crea la primera.' : ''}</p>
                        </div>
                    ) : (
                        folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder)}
                                className={clsx(
                                    'group mx-2 my-0.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 flex items-center gap-3',
                                    selectedFolder?.id === folder.id
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                )}
                            >
                                <div className={clsx(
                                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                                    selectedFolder?.id === folder.id
                                        ? 'bg-indigo-100 dark:bg-indigo-800'
                                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                                )}>
                                    <FolderOpen size={15} className={selectedFolder?.id === folder.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {editingId === folder.id ? (
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleRenameFolder(folder); if (e.key === 'Escape') setEditingId(null); }}
                                                className="flex-1 text-xs bg-white dark:bg-gray-900 border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none"
                                            />
                                            <button onClick={() => handleRenameFolder(folder)} className="text-green-500 hover:text-green-600"><Check size={13} /></button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                                        </div>
                                    ) : (
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">{folder.name}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{folder.file_count} {folder.file_count === 1 ? 'archivo' : 'archivos'}</p>
                                        {folder.created_by_name && (
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                                <span>·</span>
                                                <UserAvatar name={folder.created_by_name} imageUrl={folder.created_by_avatar} size="xs" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                    {canEdit && (
                                        <>
                                            <button
                                                onClick={() => { setEditingId(folder.id); setEditName(folder.name); }}
                                                className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                                            >
                                                <Edit2 size={11} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFolder(folder)}
                                                className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </>
                                    )}
                                    <ChevronRight size={12} className={clsx('text-gray-300 transition-transform', selectedFolder?.id === folder.id && 'text-indigo-400')} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Stats footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">
                        {folders.length} carpeta{folders.length !== 1 ? 's' : ''} · {folders.reduce((a, f) => a + f.file_count, 0)} archivo{folders.reduce((a, f) => a + f.file_count, 0) !== 1 ? 's' : ''}
                    </p>
                </div>
            </aside>

            {/* ── Right Panel: File content area ─────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {selectedFolder ? (
                    <>
                        {/* Content header */}
                        <div className="px-8 pt-7 pb-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-1">
                                        <FolderOpen size={11} />
                                        <span>Presentaciones</span>
                                        <ChevronRight size={11} />
                                        <span className="text-indigo-500">{selectedFolder.name}</span>
                                    </div>
                                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{selectedFolder.name}</h2>
                                    {selectedFolder.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedFolder.description}</p>
                                    )}
                                    {selectedFolder.created_by_name && (
                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                                            <span>Creado por</span>
                                            <UserAvatar name={selectedFolder.created_by_name} imageUrl={selectedFolder.created_by_avatar} size="xs" />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{selectedFolder.created_by_name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Buscar archivo..."
                                            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a2332] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 transition"
                                        />
                                        {search && (
                                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                    {/* Stats badge */}
                                    <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        {selectedFolder.file_count} {selectedFolder.file_count === 1 ? 'archivo' : 'archivos'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content body */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {/* Upload zone for editors */}
                            {canEdit && (
                                <div className="mb-6">
                                    <UploadZone onUpload={handleUpload} uploading={uploading} />
                                </div>
                            )}

                            {/* Files grid */}
                            {loadingFiles ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <Presentation size={28} className="text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {search ? 'No se encontraron resultados' : 'Esta carpeta está vacía'}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {search ? 'Intenta con otro término de búsqueda' : canEdit ? 'Sube tu primera presentación arriba.' : 'No hay archivos disponibles aún.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredFiles.map(file => (
                                        <FileCard
                                            key={file.id}
                                            file={file}
                                            canEdit={canEdit}
                                            onDelete={() => handleDeleteFile(file.id)}
                                            onDownload={() => handleDownload(file)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Empty state: no folder selected */
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-inner">
                                <Presentation size={36} className="text-indigo-500" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-[#111827] border-2 border-gray-100 dark:border-gray-800 flex items-center justify-center">
                                <Plus size={14} className="text-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Centro de Presentaciones</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                {folders.length > 0
                                    ? 'Selecciona una carpeta para ver sus presentaciones.'
                                    : canEdit
                                        ? 'Crea tu primera carpeta para comenzar a organizar tus presentaciones ejecutivas.'
                                        : 'Aún no hay presentaciones disponibles para este portafolio.'
                                }
                            </p>
                        </div>
                        {canEdit && folders.length === 0 && (
                            <button
                                onClick={() => setShowNewFolder(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-sm"
                            >
                                <FolderPlus size={16} /> Crear primera carpeta
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* New folder modal */}
            {showNewFolder && (
                <NewFolderModal
                    onClose={() => setShowNewFolder(false)}
                    onSave={handleCreateFolder}
                />
            )}
        </div>
    );
};
