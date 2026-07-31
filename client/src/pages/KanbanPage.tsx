import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanSquare, Flag, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Initiative {
    id: string;
    name: string;
    area: string;
    status: string;
    progress: number;
    champion: string;
}

const KANBAN_COLUMNS = [
    { id: 'En plan', label: 'En Plan', color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' },
    { id: 'En Curso', label: 'En Curso', color: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800' },
    { id: 'Retrasado', label: 'Retrasado', color: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
    { id: 'Entregado', label: 'Entregado', color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' }
];

// Helper to normalize backend statuses to our columns
const normalizeStatus = (status: string | null | undefined) => {
    if (!status) return 'En plan';
    const s = status.toLowerCase();
    if (s.includes('entregado')) return 'Entregado';
    if (s.includes('curso') || s.includes('avance')) return 'En Curso';
    if (s.includes('retrasado') || s.includes('atraso')) return 'Retrasado';
    return 'En plan'; // Default fallback
};

const SortableItem = ({ item }: { item: Initiative }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={clsx(
                "p-3 mb-2 rounded-lg border bg-white dark:bg-[#1A2332] shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 transition-colors",
                isDragging ? "opacity-50 ring-2 ring-indigo-500 scale-105" : "border-gray-200 dark:border-gray-700/50"
            )}
        >
            <h4 className="text-sm font-bold text-gray-800 dark:text-white leading-tight mb-2">{item.name}</h4>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium truncate max-w-[120px]">{item.area}</span>
                <div className="flex items-center gap-1">
                    <Flag size={12} className={item.progress >= 100 ? "text-emerald-500" : "text-amber-500"} />
                    <span>{item.progress ?? 0}%</span>
                </div>
            </div>
            {item.champion && (
                <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded px-1.5 py-0.5 inline-block">
                    {item.champion}
                </div>
            )}
        </div>
    );
};

const KanbanColumn = ({ label, color, items }: { id: string, label: string, color: string, items: Initiative[] }) => {
    return (
        <div className="flex flex-col min-w-[280px] w-[280px] h-full flex-shrink-0">
            <div className={clsx("p-3 rounded-t-lg border-t border-x font-bold text-sm text-gray-700 dark:text-gray-200 flex justify-between items-center", color)}>
                {label}
                <span className="bg-white/50 dark:bg-black/20 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                    {items.length}
                </span>
            </div>
            <div className={clsx("flex-1 p-2 rounded-b-lg border-b border-x bg-gray-50/50 dark:bg-[#0D1520]/50 overflow-y-auto custom-scrollbar", color)}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="min-h-[150px]">
                        {items.map(item => (
                            <SortableItem key={item.id} item={item} />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};

export const KanbanPage = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitiatives = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/initiatives?year=${year}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Map statuses to standard columns
                    const mapped = data.map(i => ({
                        ...i,
                        kanbanStatus: normalizeStatus(i.status)
                    }));
                    setInitiatives(mapped);
                }
            } catch (error) {
                console.error("Error fetching for Kanban:", error);
            }
            setLoading(false);
        };
        if (token) fetchInitiatives();
    }, [token, year]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        
        // Find which initiative was dragged
        const draggedInit = initiatives.find(i => i.id === activeId);
        if (!draggedInit) return;

        // Determine destination column
        // If dropped over another item, it gets its status. If dropped directly in empty column area, we need to map column ids.
        // Wait, dnd-kit sortable over.id is the ID of the item it hovered over.
        // Let's implement a simpler list if over is an item:
        const overInit = initiatives.find(i => i.id === over.id);
        const destinationStatus = overInit ? (overInit as any).kanbanStatus : KANBAN_COLUMNS.find(c => c.id === over.id)?.id;
        
        if (!destinationStatus) return;

        const sourceStatus = (draggedInit as any).kanbanStatus;

        if (sourceStatus === destinationStatus) {
            // Reordering within same column
            setInitiatives(items => {
                const oldIndex = items.findIndex(i => i.id === activeId);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            // We could call an API here to save intra-column order, but skipped for MVP.
        } else {
            // Moving between columns
            setInitiatives(items => items.map(i => {
                if (i.id === activeId) return { ...i, kanbanStatus: destinationStatus, status: destinationStatus };
                return i;
            }));

            // Call API to update real status
            try {
                await fetch(`${API_URL}/api/initiatives/${activeId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    // Send minimal payload or full if required. The backend requires full, so we must fetch or merge.
                    // Actually, the PUT endpoint updates whatever is sent if it's PATCH, but the existing endpoint is PUT and requires full body.
                    // Wait, let's just send the status update if we have a PATCH, or we send the full init object.
                    body: JSON.stringify({
                        ...draggedInit,
                        status: destinationStatus,
                        year // Required by put route
                    })
                });
            } catch (err) {
                console.error("Failed to update status", err);
                // Revert optimist UI if failed
            }
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] p-4 overflow-hidden">
            <div className="mb-4 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
                    <KanbanSquare size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">Tablero Kanban</h1>
                    <p className="text-xs text-[var(--text-tertiary)]">Visualización ágil de iniciativas por estatus</p>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div className="flex h-full gap-4 pb-2 items-start">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        {KANBAN_COLUMNS.map(col => {
                            const colItems = initiatives.filter(i => (i as any).kanbanStatus === col.id);
                            return (
                                <KanbanColumn 
                                    key={col.id}
                                    id={col.id}
                                    label={col.label}
                                    color={col.color}
                                    items={colItems}
                                />
                            );
                        })}
                    </DndContext>
                </div>
            </div>
        </div>
    );
};
