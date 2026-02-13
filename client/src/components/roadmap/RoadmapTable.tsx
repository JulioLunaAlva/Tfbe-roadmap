import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Star, Plus, Trash2, Pencil, Flag, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useYear } from '../../context/YearContext';
import { ProgressEditPopover } from './ProgressEditPopover';
import { CreateInitiativeModal } from '../initiatives/CreateInitiativeModal';
import { EditInitiativeModal } from '../initiatives/EditInitiativeModal';
import { MilestoneContextMenu } from './MilestoneContextMenu';
import API_URL from '../../config/api';
import { RoadmapFilters } from './RoadmapFilters';

interface Initiative {
    id: string;
    name: string;
    area: string;
    phases: InitiativePhase[];
    is_top_priority: boolean;
    champion: string;
    complexity: string;
    year: number;
    notes: string;
    transformation_lead?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    progress?: number;
    technologies?: string[];
    value?: string;
}
interface InitiativePhase {
    id: string;
    phase_id: number;
    name: string;
    custom_order: number;
    is_active: boolean;
    progress?: number;
    notes?: string;
    technologies?: string[];
}
interface Progress {
    initiative_id: string;
    phase_id: number;
    week_number: number;
    progress_value: number;
    comment: string;
    year: number;
}

interface Milestone {
    id: string;
    initiative_id: string;
    type: 'flag' | 'star' | 'check';
    week_number: number;
}

const getProgressColor = (val: number) => {
    switch (val) {
        case 1: return 'bg-gray-300'; // Desarrollo Funcional
        case 2: return 'bg-yellow-400'; // Desarrollo Técnico
        case 3: return 'bg-green-500'; // Avance conforme plan
        case 4: return 'bg-red-600'; // Atraso
        default: return '';
    }
};

const getComplexityColor = (complexity?: string) => {
    const c = (complexity || '').toUpperCase();
    if (c === 'ALTA') return 'bg-[#FDECEC] text-[#991B1B] dark:bg-[#451e1e] dark:text-[#FCA5A5]';
    if (c === 'MEDIA') return 'bg-[#FFF4CC] text-[#854D0E] dark:bg-[#423618] dark:text-[#FCD34D]';
    return 'bg-[#E8F5E9] text-[#166534] dark:bg-[#163C28] dark:text-[#86EFAC]';
};

export const RoadmapTable = () => {
    const { user, token } = useAuth();
    const { isPresentationMode } = useTheme();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const { year } = useYear();
    const [loading, setLoading] = useState(true);

    // Milestones State
    const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        initiativeId: string;
        week: number;
        existingId?: string;
    } | null>(null);

    // Create Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Edit Modal State
    const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);

    // Editing State (Cells)
    const [editingCell, setEditingCell] = useState<{
        initiativeId: string;
        phaseId: number;
        week: number;
        target: EventTarget & HTMLElement;
    } | null>(null);

    const fetchInitiatives = async () => {
        try {
            const res = await fetch(`${API_URL}/api/initiatives?year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setInitiatives(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setInitiatives([]);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchInitiatives();
            setLoading(false);
        };
        if (token) load();
    }, [token, year]);

    // Fetch Milestones
    useEffect(() => {
        if (initiatives.length > 0 && token) {
            const fetchAll = async () => {
                const msMap: Record<string, Milestone[]> = {};
                await Promise.all(initiatives.map(async (init) => {
                    try {
                        const res = await fetch(`${API_URL}/api/milestones/${init.id}`, { headers: { Authorization: `Bearer ${token}` } });
                        const data = await res.json();
                        if (Array.isArray(data)) msMap[init.id] = data;
                    } catch (e) { console.error(e); }
                }));
                setMilestones(msMap);
            };
            fetchAll();
        }
    }, [initiatives, token]);

    // Load progress
    useEffect(() => {
        if (initiatives.length > 0 && token) {
            const fetchAllProgress = async () => {
                const allP: Record<string, Progress> = {};
                await Promise.all(initiatives.map(async (init) => {
                    const res = await fetch(`${API_URL}/api/progress/${init.id}`, { headers: { Authorization: `Bearer ${token}` } });
                    const data: Progress[] = await res.json();
                    if (Array.isArray(data)) {
                        data.forEach(p => {
                            const key = `${p.initiative_id}-${p.phase_id === null ? 0 : p.phase_id}-${p.week_number}`;
                            allP[key] = p;
                        });
                    }
                }));
                setProgressMap(prev => ({ ...prev, ...allP }));
            };
            fetchAllProgress();
        }
    }, [initiatives, token]);

    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        try {
            await fetch(`${API_URL}/api/initiatives/${id}/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ direction })
            });
            await fetchInitiatives();
        } catch (e) {
            console.error(e);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, initId: string, week: number) => {
        e.preventDefault();
        const existing = milestones[initId]?.find(m => m.week_number === week);
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            initiativeId: initId,
            week,
            existingId: existing?.id
        });
    };

    const handleAddMilestone = async (type: string) => {
        if (!contextMenu) return;
        const { initiativeId, week } = contextMenu;
        try {
            const res = await fetch(`${API_URL}/api/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    initiative_id: initiativeId,
                    type,
                    year,
                    week_number: week,
                    description: 'Hito manual'
                })
            });
            if (res.ok) {
                const newM = await res.json();
                setMilestones(prev => ({
                    ...prev,
                    [initiativeId]: [...(prev[initiativeId] || []), newM]
                }));
            }
        } catch (e) { console.error(e); }
        setContextMenu(null);
    };

    const handleDeleteInitiative = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta iniciativa?')) return;
        try {
            await fetch(`${API_URL}/api/initiatives/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setInitiatives(prev => prev.filter(i => i.id !== id));
            await fetchInitiatives();
        } catch (e) { console.error(e); }
    };

    const handleDeleteMilestone = async () => {
        if (!contextMenu?.existingId) return;
        try {
            await fetch(`${API_URL}/api/milestones/${contextMenu.existingId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setMilestones(prev => ({
                ...prev,
                [contextMenu.initiativeId]: prev[contextMenu.initiativeId].filter(m => m.id !== contextMenu.existingId)
            }));
        } catch (e) { console.error(e); }
        setContextMenu(null);
    }

    const renderMilestone = (initId: string, week: number) => {
        const ms = milestones[initId]?.find(m => m.week_number === week);
        if (!ms) return null;

        let icon = null;
        if (ms.type === 'flag') icon = <Flag size={12} className="text-gray-600 fill-current" />;
        if (ms.type === 'star') icon = <Star size={12} className="text-yellow-500 fill-current" />;
        if (ms.type === 'check') icon = <CheckCircle size={12} className="text-green-600" />;

        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="bg-white/90 rounded-full p-0.5 shadow-sm">
                    {icon}
                </div>
            </div>
        );
    };

    const CALENDAR_SCHEMA = useMemo(() => [
        {
            name: 'Q1',
            months: [
                { name: 'Ene', weeks: [1, 2, 3, 4, 5] },
                { name: 'Feb', weeks: [6, 7, 8, 9] },
                { name: 'Mar', weeks: [10, 11, 12, 13] }
            ]
        },
        {
            name: 'Q2',
            months: [
                { name: 'Abr', weeks: [14, 15, 16, 17] },
                { name: 'May', weeks: [18, 19, 20, 21, 22] },
                { name: 'Jun', weeks: [23, 24, 25, 26] }
            ]
        },
        {
            name: 'Q3',
            months: [
                { name: 'Jul', weeks: [27, 28, 29, 30] },
                { name: 'Ago', weeks: [31, 32, 33, 34, 35] },
                { name: 'Sep', weeks: [36, 37, 38, 39] }
            ]
        },
        {
            name: 'Q4',
            months: [
                { name: 'Oct', weeks: [40, 41, 42, 43, 44] },
                { name: 'Nov', weeks: [45, 46, 47, 48] },
                { name: 'Dic', weeks: [49, 50, 51, 52] }
            ]
        }
    ], []);

    const flatWeeks = useMemo(() => {
        return CALENDAR_SCHEMA.flatMap(q => q.months.flatMap(m => m.weeks));
    }, [CALENDAR_SCHEMA]);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCellClick = (e: React.MouseEvent<HTMLElement>, initId: string, phaseId: number, week: number) => {
        if (user?.role === 'viewer') return;
        setEditingCell({
            initiativeId: initId,
            phaseId,
            week,
            target: e.currentTarget
        });
    };

    const getCurrentWeekNumber = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    const currentWeekNumber = useMemo(() => getCurrentWeekNumber(), []);
    const todayFormatted = useMemo(() => new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), []);

    const handlePhaseProgressUpdate = async (initId: string, phaseRowId: string, phaseId: number, val?: number, note?: string) => {
        setInitiatives(prev => prev.map(i => {
            if (i.id === initId) {
                const newPhases = i.phases.map(p => {
                    if (p.id === phaseRowId) {
                        return {
                            ...p,
                            progress: val !== undefined ? val : p.progress,
                            notes: note !== undefined ? note : p.notes
                        };
                    }
                    return p;
                });

                let total = i.progress;
                if (val !== undefined) {
                    const activePhases = newPhases.filter(p => p.is_active);
                    total = activePhases.length > 0
                        ? Math.round(activePhases.reduce((acc, p) => acc + (p.progress || 0), 0) / activePhases.length)
                        : 0;
                }
                return { ...i, phases: newPhases, progress: total };
            }
            return i;
        }));

        try {
            const payload: any = {};
            if (val !== undefined) payload.progress = val;
            if (note !== undefined) payload.notes = note;

            const res = await fetch(`${API_URL}/api/initiatives/${initId}/phases/${phaseId}/progress`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed');
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveProgress = async (val: number, comment: string) => {
        if (!editingCell) return;
        const { initiativeId, phaseId, week } = editingCell;

        try {
            const res = await fetch(`${API_URL}/api/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    initiative_id: initiativeId,
                    phase_id: phaseId === 0 ? null : phaseId,
                    year,
                    week_number: week,
                    progress_value: val,
                    comment
                })
            });
            const saved: Progress = await res.json();
            const key = `${saved.initiative_id}-${saved.phase_id === null ? 0 : saved.phase_id}-${saved.week_number}`;
            setProgressMap(prev => ({ ...prev, [key]: saved }));
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedTransfLead, setSelectedTransfLead] = useState('ALL');

    const uniqueAreas = useMemo(() => Array.from(new Set(initiatives.map(i => i.area).filter((x): x is string => !!x))).sort(), [initiatives]);
    const uniqueStatuses = useMemo(() => Array.from(new Set(initiatives.map(i => i.status).filter((x): x is string => !!x))).sort(), [initiatives]);
    const uniqueTransfLeads = useMemo(() => Array.from(new Set(initiatives.map(i => i.transformation_lead).filter((x): x is string => !!x))).sort(), [initiatives]);

    const filteredInitiatives = useMemo(() => {
        return initiatives.filter(i => {
            const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.champion.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesArea = selectedArea === 'ALL' || i.area === selectedArea;
            const matchesStatus = selectedStatus === 'ALL' || i.status === selectedStatus;
            const matchesTransf = selectedTransfLead === 'ALL' || (i.transformation_lead || '') === selectedTransfLead;
            return matchesSearch && matchesArea && matchesStatus && matchesTransf;
        });
    }, [initiatives, searchTerm, selectedArea, selectedStatus, selectedTransfLead]);



    // Column Resizing State with database persistence
    const getInitialColWidths = () => {
        const saved = localStorage.getItem('roadmap-column-widths');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved column widths:', e);
            }
        }
        // Default widths
        return {
            initiative: 400,
            value: 140,
            champion: 128,
            tech: 128,
            complexity: 80,
            status: 96,
            comment: 192,
            transformation_lead: 128,
            progress: 64,
            start: 80,
            end: 80
        };
    };

    const [colWidths, setColWidths] = useState(getInitialColWidths());
    const saveTimeoutRef = React.useRef<number | null>(null);

    // Fetch column widths from database on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const res = await fetch(`${API_URL}/api/preferences/roadmap_column_widths`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const dbWidths = await res.json();
                    setColWidths(dbWidths);
                    // Also update localStorage as cache
                    localStorage.setItem('roadmap-column-widths', JSON.stringify(dbWidths));
                }
            } catch (error) {
                console.log('Using localStorage/default widths (DB fetch failed)');
            }
        };

        if (token) {
            fetchPreferences();
        }
    }, [token]);

    // Debounced save to database
    const saveColumnWidthsToDb = React.useCallback((widths: any) => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout to save after 500ms of no changes
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await fetch(`${API_URL}/api/preferences/roadmap_column_widths`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(widths)
                });
            } catch (error) {
                console.error('Failed to save column widths to database:', error);
            }
        }, 500);
    }, [token]);

    // Save column widths to localStorage and database whenever they change
    useEffect(() => {
        localStorage.setItem('roadmap-column-widths', JSON.stringify(colWidths));
        saveColumnWidthsToDb(colWidths);
    }, [colWidths, saveColumnWidthsToDb]);

    const resizingRef = React.useRef<{ col: string; startX: number; startWidth: number } | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;
            const { col, startX, startWidth } = resizingRef.current;
            const diff = e.clientX - startX;
            setColWidths((prev: typeof colWidths) => ({ ...prev, [col]: Math.max(50, startWidth + diff) }));
        };

        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null;
                document.body.style.cursor = 'default';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResize = (e: React.MouseEvent, col: string) => {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = { col, startX: e.clientX, startWidth: (colWidths as any)[col] };
        document.body.style.cursor = 'col-resize';
    };

    const ResizeHandle = ({ col }: { col: string }) => (
        <div
            onMouseDown={(e) => startResize(e, col)}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-50 group-hover:bg-white/20 transition-colors"
        />
    );

    if (loading && initiatives.length === 0) return <div className="p-10 text-center text-[var(--text-secondary)]">Cargando roadmap...</div>;

    return (
        <div className="flex flex-col space-y-2">
            {!isPresentationMode && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-1 mb-2 gap-4">
                    <div className="flex-1 w-full">
                        <RoadmapFilters
                            areas={uniqueAreas}
                            statuses={uniqueStatuses}
                            transformationLeads={uniqueTransfLeads}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            selectedArea={selectedArea}
                            setSelectedArea={setSelectedArea}
                            selectedStatus={selectedStatus}
                            setSelectedStatus={setSelectedStatus}
                            selectedTransfLead={selectedTransfLead}
                            setSelectedTransfLead={setSelectedTransfLead}
                        />
                    </div>
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-[#E10600] text-white rounded-md hover:bg-red-700 shadow-sm text-sm font-bold transition-transform transform hover:scale-105 h-10 mt-1"
                        >
                            <Plus size={16} />
                            <span>Nueva Iniciativa</span>
                        </button>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center px-2">
                <div className="text-sm text-[var(--text-secondary)] capitalize">{todayFormatted}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Mostrando {filteredInitiatives.length} iniciativas</div>
            </div>

            <div id="roadmap-table-container" className="overflow-x-auto border border-[var(--border-color)] rounded-lg shadow sm:rounded-lg bg-[var(--bg-secondary)] relative">
                <table className="min-w-full divide-y divide-[var(--border-color)] table-fixed">
                    <thead className="bg-gradient-to-b from-[#E10600] to-[#C40500] text-white shadow-md z-20">
                        <tr>
                            <th rowSpan={3} style={{ width: colWidths.initiative, minWidth: colWidths.initiative }} className="group px-6 py-3 text-left text-xs font-bold uppercase tracking-wider sticky left-0 bg-[#E10600] z-20 border-r border-[#B90500] border-b border-[#B90500] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)] relative">
                                Iniciativa <ResizeHandle col="initiative" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.value, minWidth: colWidths.value }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Valor <ResizeHandle col="value" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.champion, minWidth: colWidths.champion }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Champion <ResizeHandle col="champion" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.tech, minWidth: colWidths.tech }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Tecnología <ResizeHandle col="tech" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.complexity, minWidth: colWidths.complexity }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Comp. <ResizeHandle col="complexity" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.status, minWidth: colWidths.status }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Estatus <ResizeHandle col="status" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.comment, minWidth: colWidths.comment }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Comentario <ResizeHandle col="comment" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.transformation_lead, minWidth: colWidths.transformation_lead }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Transf. <ResizeHandle col="transformation_lead" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.progress, minWidth: colWidths.progress }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Prog. <ResizeHandle col="progress" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.start, minWidth: colWidths.start }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Inicio <ResizeHandle col="start" />
                            </th>
                            <th rowSpan={3} style={{ width: colWidths.end, minWidth: colWidths.end }} className="group px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider bg-[#E10600] text-white border-r border-b border-[#B90500] relative">
                                Fin <ResizeHandle col="end" />
                            </th>
                            {CALENDAR_SCHEMA.map(q => (
                                <th
                                    key={q.name}
                                    colSpan={q.months.reduce((acc, m) => acc + m.weeks.length, 0)}
                                    className="px-2 py-1 text-center text-xs font-bold text-white border-r-2 border-b border-[#B90500] bg-[#CC0500] box-border tracking-widest"
                                >
                                    <span className="inline-block bg-black/25 rounded px-2 py-0.5 shadow-sm">{q.name}</span>
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {CALENDAR_SCHEMA.flatMap(q => q.months).map((m, i) => (
                                <th
                                    key={`${m.name}-${i}`}
                                    colSpan={m.weeks.length}
                                    // Always add a visible border-r for every month to separate "Ene | Feb | Mar"
                                    className="px-2 py-0.5 text-center text-[10px] font-medium text-white border-b border-[#B90500] bg-[#E10600] border-r border-[#B90500]"
                                >
                                    <span className="inline-block bg-black/10 rounded px-1.5">{m.name}</span>
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {flatWeeks.map(w => {
                                // Calculate Relative Week Number (1-4 or 1-5 per month)
                                let relativeWeek = 1;
                                let isMonthEnd = false;
                                let accumulatedWeeks = 0;
                                let found = false;

                                // Find which month this week belongs to
                                for (const q of CALENDAR_SCHEMA) {
                                    for (const m of q.months) {
                                        const monthWeekCount = m.weeks.length;
                                        // Check if current week (w) falls within this month's range
                                        if (w > accumulatedWeeks && w <= accumulatedWeeks + monthWeekCount) {
                                            // Calculate position within the month (1-based)
                                            relativeWeek = w - accumulatedWeeks;
                                            // Check if this is the last week of the month
                                            if (w === accumulatedWeeks + monthWeekCount) {
                                                isMonthEnd = true;
                                            }
                                            found = true;
                                            break;
                                        }
                                        accumulatedWeeks += monthWeekCount;
                                    }
                                    // Exit outer loop if we found the month
                                    if (found) break;
                                }

                                const isQuarterEnd = [13, 26, 39, 52].includes(w);
                                const isCurrentWeek = w === currentWeekNumber;

                                return (
                                    <th
                                        key={w}
                                        className={clsx(
                                            "px-0 py-0.5 text-center text-[9px] w-8 min-w-[20px] bg-[var(--bg-secondary)]",
                                            // Base Border
                                            "border-b border-[var(--border-color)]",
                                            // Vertical Separators: Quarter (Thick Red) vs Month (Clear White Line)
                                            isQuarterEnd
                                                ? "border-r-[2px] border-r-[rgba(220,38,38,0.85)] shadow-[1px_0_4px_-1px_rgba(220,38,38,0.3)]"
                                                : isMonthEnd
                                                    ? "border-r border-r-white/20" // Stronger Month Separator
                                                    : "",
                                            // Text Color
                                            "text-[var(--text-tertiary)] opacity-80 font-normal",
                                            // Current Week Gradient overlay
                                            isCurrentWeek ? "!border-l-[2px] !border-l-[#4ADE80] bg-gradient-to-r from-[rgba(34,197,94,0.15)] to-transparent dark:from-[rgba(74,222,128,0.1)] dark:to-transparent text-[#166534] dark:text-[#4ADE80] !font-extrabold shadow-[inset_1px_0_0_0_rgba(74,222,128,0.2)]" : ""
                                        )}
                                    >
                                        {relativeWeek}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-color)]">
                        {filteredInitiatives.map((initiative, idx) => (
                            <React.Fragment key={initiative.id}>
                                <tr className={clsx(
                                    "group border-b text-[var(--text-primary)] transition-colors",
                                    // Light Mode: standard hover. Dark Mode: Alternating rows #1E2630 (even) / #202A35 (odd)
                                    "hover:bg-[var(--bg-tertiary)]",
                                    "dark:hover:bg-[#2A3441]", // Slightly lighter than row colors for hover
                                    idx % 2 === 0 ? "dark:bg-[#1E2630]" : "dark:bg-[#202A35]"
                                )}>
                                    <td className={clsx(
                                        "px-4 py-3 sticky left-0 z-30 border-r border-[var(--border-color)] shadow-sm transition-colors",
                                        "bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-tertiary)]",
                                        // Dark Mode Sticky Fix: Match row color
                                        idx % 2 === 0 ? "dark:bg-[#1E2630]" : "dark:bg-[#202A35]",
                                        "dark:group-hover:bg-[#2A3441]"
                                    )}>
                                        <div className="flex items-center justify-between group-hover:pr-2 transition-all">
                                            <div className="flex items-center flex-1 min-w-0">
                                                <button onClick={() => toggleExpand(initiative.id)} className="mr-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex-shrink-0">
                                                    {expanded[initiative.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-extrabold text-[var(--text-primary)] line-clamp-2 text-wrap tracking-tight" title={initiative.name}>
                                                            {initiative.name}
                                                        </span>
                                                        {initiative.is_top_priority && <Star className="text-yellow-400 fill-current ml-1 flex-shrink-0" size={10} />}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium opacity-80">{initiative.area}</div>
                                                </div>
                                            </div>
                                            {(user?.role === 'admin' || user?.role === 'editor') && !isPresentationMode && (
                                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 bg-[var(--bg-secondary)]/80 backdrop-blur-sm rounded p-1 shadow-sm">
                                                    <button onClick={() => handleReorder(initiative.id, 'up')} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded" title="Mover Arriba"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg></button>
                                                    <button onClick={() => handleReorder(initiative.id, 'down')} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded" title="Mover Abajo"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></button>
                                                    <div className="w-px h-3 bg-[var(--border-color)] mx-1"></div>
                                                    <button onClick={() => setEditingInitiative(initiative)} className="p-1 text-[var(--text-tertiary)] hover:text-blue-400 rounded" title="Editar Iniciativa"><Pencil size={12} /></button>
                                                    <button onClick={() => handleDeleteInitiative(initiative.id)} className="p-1 text-[var(--text-tertiary)] hover:text-red-400 rounded" title="Eliminar Iniciativa"><Trash2 size={12} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {/* Value Cell - NEW */}
                                    <td className="px-2 py-2 text-[10px] border-r border-[var(--border-color)] text-center">
                                        <span className={clsx(
                                            "inline-block px-2 py-1 rounded-md text-[9px] font-semibold whitespace-nowrap",
                                            (() => {
                                                const v = initiative.value;
                                                if (v === 'Estrategico Alto Valor') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
                                                if (v === 'Operational Value') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                                                if (v === 'Mandatorio/Compliance') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
                                                if (v === 'Deferred/Not prioritized') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                                                return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
                                            })()
                                        )}>
                                            {initiative.value || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-[10px] border-r border-[var(--border-color)] text-center truncate text-[var(--text-secondary)] dark:text-gray-200 font-medium" title={initiative.champion}>{initiative.champion}</td>
                                    <td className="px-2 py-2 text-[10px] border-r border-[var(--border-color)] text-center text-[var(--text-secondary)] dark:text-gray-200">
                                        <div className="flex flex-col space-y-1">
                                            {initiative.technologies?.map(t => (
                                                <span key={t} className="inline-block px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded text-[9px] truncate max-w-full">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className={clsx(
                                        "px-2 py-2 text-[10px] border-r border-[var(--border-color)] text-center font-bold",
                                        getComplexityColor(initiative.complexity)
                                    )}>
                                        {initiative.complexity}
                                    </td>
                                    <td className={clsx(
                                        "px-2 py-2 text-[10px] border-r border-[var(--border-color)] text-center font-semibold",
                                        (() => {
                                            const s = initiative.status;
                                            if (s === 'Retrasado' || s === 'Cancelado') return 'bg-[#FCE8E6] text-[#9F1239] dark:bg-[#3F1515] dark:text-[#FDA4AF]';
                                            if (s === 'En curso' || s === 'Avance conforme plan') return 'bg-[#DFF3EA] text-[#115E59] dark:bg-[#134E4A] dark:text-[#5EEAD4]';
                                            if (s === 'Entregado') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
                                            return 'bg-[#F1F3F5] text-[#4B5563] dark:bg-[#27272A] dark:text-[#E5E7EB]';
                                        })()
                                    )}>
                                        {initiative.status || 'En espera'}
                                    </td>
                                    <td className="px-2 py-2 text-[9px] border-r border-[var(--border-color)] whitespace-normal break-words text-[var(--text-secondary)] dark:text-gray-300" title={initiative.notes}>{initiative.notes}</td>
                                    <td className="px-2 py-2 text-[10px] border-r border-[var(--border-color)] text-center truncate text-[var(--text-secondary)] dark:text-gray-200 font-medium" title={initiative.transformation_lead}>
                                        {initiative.transformation_lead}
                                    </td>
                                    <td className="px-2 py-2 text-[10px] border-r border-[var(--border-color)] text-center font-bold bg-[var(--bg-tertiary)] dark:bg-transparent">
                                        <div className="flex items-center space-x-1 justify-center">
                                            <div className="w-12 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                                                <div className={`h-full ${(initiative.progress || 0) >= 100 ? 'bg-[#2ECC71]' : 'bg-[#FACC15]'}`} style={{ width: `${initiative.progress || 0}%` }} />
                                            </div>
                                            <span className="text-[9px] text-[var(--text-tertiary)] dark:text-white font-bold">{initiative.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-[9px] border-r border-[var(--border-color)] text-center bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] dark:bg-transparent dark:text-gray-300 font-medium">{initiative.start_date ? new Date(initiative.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                    <td className="px-2 py-2 text-[9px] border-r border-[var(--border-color)] text-center bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] dark:bg-transparent dark:text-gray-300 font-medium">{initiative.end_date ? new Date(initiative.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                    {flatWeeks.map(w => {
                                        // Recalculate isMonthEnd / isQuarterEnd for body rows
                                        let isMonthEnd = false;
                                        let accumulateWeeks = 0;
                                        for (const q of CALENDAR_SCHEMA) {
                                            for (const m of q.months) {
                                                if (w === accumulateWeeks + m.weeks.length) isMonthEnd = true;
                                                accumulateWeeks += m.weeks.length;
                                            }
                                        }

                                        // Restore Progress Coloring Logic
                                        const key = `${initiative.id}-0-${w}`;
                                        const prog = progressMap[key];
                                        const progressColor = prog ? getProgressColor(prog.progress_value) : '';

                                        return (
                                            <td
                                                key={w}
                                                className={clsx(
                                                    "px-0 py-0 relative h-auto min-h-[3.5rem] transition-colors cursor-pointer",
                                                    // Base Grid
                                                    "border-b border-[var(--border-color)] hover:bg-[var(--item-hover)] dark:hover:bg-[#374151]",
                                                    // Progress Color
                                                    progressColor,
                                                    // Separators: Quarter (Main) vs Month (Subtle)
                                                    [13, 26, 39, 52].includes(w)
                                                        ? "border-r-[2px] border-r-[rgba(220,38,38,0.85)] shadow-[1px_0_4px_-1px_rgba(220,38,38,0.3)]"
                                                        : isMonthEnd
                                                            ? "border-r border-r-[var(--border-color)] dark:border-r-gray-700" // Subtle body month separator
                                                            : "border-r border-[var(--border-color)]",
                                                    // Current Week Highlighter
                                                    w === currentWeekNumber ? "!border-l-[2px] !border-l-[#4ADE80] bg-gradient-to-r from-[rgba(34,197,94,0.15)] to-transparent dark:from-[rgba(74,222,128,0.1)] dark:to-transparent shadow-[inset_1px_0_0_0_rgba(74,222,128,0.2)]" : ""
                                                )}
                                                onContextMenu={(e) => handleContextMenu(e, initiative.id, w)}
                                                onClick={(e) => { if (user?.role === 'viewer') return; handleCellClick(e, initiative.id, 0, w); }}
                                                title={prog?.comment}
                                            >
                                                {!expanded[initiative.id] && <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--bg-secondary)] opacity-50"></div>}
                                                {renderMilestone(initiative.id, w)}
                                            </td>
                                        )
                                    })}
                                </tr>
                                {expanded[initiative.id] && initiative.phases?.map(phase => (
                                    phase.is_active && (
                                        <tr key={phase.id} className="bg-[var(--bg-tertiary)] dark:bg-[#111827]">
                                            <td className={clsx(
                                                "px-4 py-1.5 sticky left-0 z-10 pl-10 text-[11px] font-medium text-[var(--text-secondary)] border-r border-[var(--border-color)] shadow-sm",
                                                "bg-[var(--bg-tertiary)] dark:bg-[#111827]"
                                            )}>{phase.name}</td>
                                            <td colSpan={3} className="bg-[var(--bg-tertiary)] dark:bg-[#111827] border-r border-[var(--border-color)]"></td>
                                            <td className="px-2 py-1 border-r border-[var(--border-color)] bg-[var(--bg-tertiary)] dark:bg-[#111827] relative group/note">
                                                <div className="flex items-start">
                                                    <textarea
                                                        className="w-full text-[10px] border-[var(--border-color)] rounded p-0.5 focus:ring-1 focus:ring-indigo-500 bg-transparent text-[var(--text-primary)] min-h-[32px] resize-y scrollbar-hide"
                                                        placeholder="..."
                                                        defaultValue={phase.notes || ''}
                                                        id={`note-${phase.id}`}
                                                        rows={1}
                                                        onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                                                        disabled={user?.role === 'viewer'}
                                                        readOnly={user?.role === 'viewer'}
                                                    />
                                                    {user?.role !== 'viewer' && (
                                                        <button onClick={() => { const input = document.getElementById(`note-${phase.id}`) as HTMLTextAreaElement; if (input) handlePhaseProgressUpdate(initiative.id, phase.id, phase.phase_id, undefined, input.value); }} className="ml-1 text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 mt-0.5" title="Guardar Nota"><Pencil size={10} /></button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="bg-[var(--bg-tertiary)] dark:bg-[#111827] border-r border-[var(--border-color)]"></td>
                                            <td className="px-2 py-1 text-[10px] border-r border-[var(--border-color)] text-center font-bold bg-[var(--bg-tertiary)] dark:bg-[#111827]">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-12 text-center border-[var(--border-color)] rounded text-[10px] p-0.5 focus:ring-1 focus:ring-indigo-500 bg-transparent text-[var(--text-primary)]"
                                                    value={phase.progress || 0}
                                                    onChange={(e) => handlePhaseProgressUpdate(initiative.id, phase.id, phase.phase_id, parseInt(e.target.value))}
                                                    disabled={user?.role === 'viewer'}
                                                    readOnly={user?.role === 'viewer'}
                                                />
                                                <span className="ml-0.5">%</span>
                                            </td>
                                            <td colSpan={3} className="bg-[var(--bg-tertiary)] dark:bg-[#111827] border-r border-[var(--border-color)]"></td>
                                            {flatWeeks.map(w => {
                                                const key = `${initiative.id}-${phase.phase_id}-${w}`;
                                                const prog = progressMap[key];
                                                const val = prog?.progress_value || 0;
                                                // Recalculate isMonthEnd / isQuarterEnd for body rows
                                                let isMonthEnd = false;
                                                let accumulateWeeks = 0;
                                                for (const q of CALENDAR_SCHEMA) {
                                                    for (const m of q.months) {
                                                        if (w === accumulateWeeks + m.weeks.length) isMonthEnd = true;
                                                        accumulateWeeks += m.weeks.length;
                                                    }
                                                }

                                                return (
                                                    <td
                                                        key={w}
                                                        onClick={(e) => handleCellClick(e, initiative.id, phase.phase_id, w)}
                                                        className={clsx(
                                                            "border-b border-[var(--border-color)] h-auto min-h-[3rem] cursor-pointer hover:opacity-80 transition-opacity",
                                                            getProgressColor(val),
                                                            // Quarter Separator
                                                            [13, 26, 39, 52].includes(w)
                                                                ? "border-r-[2px] border-r-[rgba(220,38,38,0.85)] shadow-[1px_0_4px_-1px_rgba(220,38,38,0.3)]"
                                                                : isMonthEnd
                                                                    ? "border-r border-r-[var(--border-color)] dark:border-r-gray-700"
                                                                    : "border-r border-[var(--border-color)]",
                                                            // Current Week Highlighter
                                                            w === currentWeekNumber ? "!border-l-[2px] !border-l-[#4ADE80] bg-gradient-to-r from-[rgba(34,197,94,0.15)] to-transparent dark:from-[rgba(74,222,128,0.1)] dark:to-transparent shadow-[inset_1px_0_0_0_rgba(74,222,128,0.2)]" : ""
                                                        )}
                                                        title={prog?.comment}
                                                    ></td>
                                                );
                                            })}
                                        </tr>
                                    )
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {editingCell && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingCell(null)}>
                        <div onClick={e => e.stopPropagation()}>
                            <ProgressEditPopover initiativeId={editingCell.initiativeId} phaseId={editingCell.phaseId} year={year} week={editingCell.week} currentValue={progressMap[`${editingCell.initiativeId}-${editingCell.phaseId}-${editingCell.week}`]?.progress_value || 0} currentComment={progressMap[`${editingCell.initiativeId}-${editingCell.phaseId}-${editingCell.week}`]?.comment || ''} onSave={handleSaveProgress} onClose={() => setEditingCell(null)} />
                        </div>
                    </div>
                )}
                {contextMenu && <MilestoneContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onSelect={handleAddMilestone} onDelete={handleDeleteMilestone} hasExisting={!!contextMenu.existingId} />}
                {editingInitiative && <EditInitiativeModal initiative={editingInitiative} onClose={() => setEditingInitiative(null)} onSave={() => { fetchInitiatives(); setEditingInitiative(null); }} />}
            </div>
            {isCreateModalOpen && <CreateInitiativeModal onClose={() => setIsCreateModalOpen(false)} onSave={fetchInitiatives} />}
        </div>
    );
};
