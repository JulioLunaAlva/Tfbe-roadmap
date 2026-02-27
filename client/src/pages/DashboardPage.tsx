
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { Zap } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

import { SortableWidget } from '../components/dashboard/SortableWidget';

// Components
import { DashboardKPIs } from '../components/dashboard/DashboardKPIs';
import { DashboardActivity } from '../components/dashboard/DashboardActivity';
import { DashboardKeyInitiatives } from '../components/dashboard/DashboardKeyInitiatives';
import { DashboardAreaChart } from '../components/dashboard/DashboardAreaChart';
import { DashboardHealth } from '../components/dashboard/DashboardHealth';
import { DashboardLeaderboard } from '../components/dashboard/DashboardLeaderboard';
import { DashboardTimeline } from '../components/dashboard/DashboardTimeline';
import { DashboardTrends } from '../components/dashboard/DashboardTrends';
import { DashboardValue } from '../components/dashboard/DashboardValue';
import { DashboardTransfLead } from '../components/dashboard/DashboardTransfLead';
import { DashboardActiveSupport } from '../components/dashboard/DashboardActiveSupport';
import { DashboardComplexity } from '../components/dashboard/DashboardComplexity';
import { DashboardPhase } from '../components/dashboard/DashboardPhase';
import { DashboardTech } from '../components/dashboard/DashboardTech';
import { DashboardDeveloper } from '../components/dashboard/DashboardDeveloper';
import { DashboardQuarter } from '../components/dashboard/DashboardQuarter';

import API_URL from '../config/api';

export const DashboardPage = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Widgets Configuration ---
    // Defined inside component to access data, or outside if static
    // We need a map of components to render dynamically

    // Default Order of Widget IDs
    const defaultOrder = [
        'kpis',
        'value', 'complexity', 'quarters',
        'timeline', 'health',
        'trends', 'active-support',
        'transf-lead', 'area', 'leaderboard',
        'activity', 'key-initiatives', 'phase', 'tech', 'developer'
    ];

    const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('dashboard_widget_order');
        if (saved) {
            const parsed = JSON.parse(saved);
            const missing = defaultOrder.filter(id => !parsed.includes(id));

            // Si el usuario ya tenía un orden guardado pero le falta el nuevo widget 'quarters',
            // lo insertamos explícitamente después de 'complexity' o al principio, 
            // en lugar de enviarlo hasta el final.
            if (missing.includes('quarters')) {
                const targetIdx = parsed.indexOf('complexity') !== -1
                    ? parsed.indexOf('complexity')
                    : (parsed.indexOf('value') !== -1 ? parsed.indexOf('value') : 1);

                if (targetIdx !== -1) {
                    parsed.splice(targetIdx + 1, 0, 'quarters');
                } else {
                    parsed.splice(2, 0, 'quarters');
                }

                const otherMissing = missing.filter(id => id !== 'quarters');
                return [...parsed, ...otherMissing];
            }

            if (missing.includes('key-initiatives')) {
                const targetIdx = parsed.indexOf('activity');

                if (targetIdx !== -1) {
                    parsed.splice(targetIdx + 1, 0, 'key-initiatives');
                } else {
                    parsed.splice(3, 0, 'key-initiatives');
                }

                const otherMissing = missing.filter(id => id !== 'key-initiatives');
                return [...parsed, ...otherMissing];
            }

            return [...parsed, ...missing];
        }
        return defaultOrder;
    });

    useEffect(() => {
        localStorage.setItem('dashboard_widget_order', JSON.stringify(widgetOrder));
    }, [widgetOrder]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/api/initiatives?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                setInitiatives(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [token, year]);

    // Data Processing for Charts & KPIs
    const metrics = useMemo(() => {
        const total = initiatives.length;
        const completed = initiatives.filter(i => i.status === 'Entregado').length;
        const delayed = initiatives.filter(i => i.status === 'Retrasado').length;
        const inProgress = initiatives.filter(i => i.status === 'En curso').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Area Distribution Logic
        const areaCounts: Record<string, number> = {};
        initiatives.forEach(i => {
            const area = i.area || 'Sin Área';
            areaCounts[area] = (areaCounts[area] || 0) + 1;
        });

        // Dynamic color palette - vibrant colors for better distinction
        const colorPalette = [
            '#3B82F6', // Blue
            '#8B5CF6', // Purple
            '#10B981', // Green
            '#F59E0B', // Orange
            '#EC4899', // Pink
            '#06B6D4', // Cyan
            '#EF4444', // Red
            '#84CC16', // Lime
            '#F97316', // Orange-Red
            '#6366F1', // Indigo
            '#14B8A6', // Teal
            '#A855F7', // Purple-Pink
        ];

        const areaData = Object.keys(areaCounts)
            .map((k, index) => ({
                name: k,
                value: areaCounts[k],
                color: colorPalette[index % colorPalette.length]
            }))
            .sort((a, b) => b.value - a.value);

        // Tech Stack Logic
        const techCounts: Record<string, number> = {};
        initiatives.forEach(i => {
            if (i.technologies && Array.isArray(i.technologies)) {
                i.technologies.forEach((t: string) => {
                    techCounts[t] = (techCounts[t] || 0) + 1;
                });
            }
        });
        const techData = Object.keys(techCounts)
            .map(k => ({ name: k, value: techCounts[k] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6

        // Phase Logic
        const phaseCounts: Record<string, number> = {};
        initiatives.forEach(i => {
            // Find active phase
            const activePhase = i.phases?.find((p: any) => p.is_active);
            const phaseName = activePhase ? activePhase.name : 'Planning'; // Default if none
            phaseCounts[phaseName] = (phaseCounts[phaseName] || 0) + 1;
        });
        const phaseData = Object.keys(phaseCounts)
            .map(k => ({ name: k, value: phaseCounts[k] }));

        // Complexity Logic
        const complexityCounts = initiatives.reduce((acc: any, curr: any) => {
            const c = curr.complexity || 'N/A';
            acc[c] = (acc[c] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const complexityData = ['Alta', 'Media', 'Baja'].map(k => ({
            name: k,
            value: complexityCounts[k] || 0
        }));

        // Value Distribution Logic
        const valueColors: Record<string, string> = {
            'Estrategico Alto Valor': '#8B5CF6',      // Purple
            'Operational Value': '#3B82F6',           // Blue
            'Mandatorio/Compliance': '#F59E0B',       // Orange
            'Deferred/Not prioritized': '#6B7280'     // Gray
        };

        const valueData = [
            'Estrategico Alto Valor',
            'Operational Value',
            'Mandatorio/Compliance',
            'Deferred/Not prioritized'
        ].map(val => ({
            name: val,
            value: initiatives.filter(i => i.value === val).length,
            color: valueColors[val]
        }));

        // Transformation Lead Distribution Logic
        const transfLeadCounts: Record<string, number> = {};
        initiatives.forEach(i => {
            const lead = i.transformation_lead?.trim();
            if (lead) {
                transfLeadCounts[lead] = (transfLeadCounts[lead] || 0) + 1;
            }
        });
        const transfLeadData = Object.keys(transfLeadCounts)
            .map(k => ({ name: k, value: transfLeadCounts[k] }))
            .sort((a, b) => b.value - a.value);

        // Quarter Distribution Logic
        const qCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
        initiatives.forEach(i => {
            if (i.end_date) {
                const month = new Date(i.end_date).getMonth() + 1;
                if (month >= 1 && month <= 3) qCounts.Q1++;
                else if (month >= 4 && month <= 6) qCounts.Q2++;
                else if (month >= 7 && month <= 9) qCounts.Q3++;
                else qCounts.Q4++;
            }
        });
        const quartersData = [
            { name: 'Q1', value: qCounts.Q1 },
            { name: 'Q2', value: qCounts.Q2 },
            { name: 'Q3', value: qCounts.Q3 },
            { name: 'Q4', value: qCounts.Q4 }
        ];

        return {
            total, completed, delayed, inProgress, completionRate,
            techData, phaseData, complexityData, areaData, valueData, transfLeadData, quartersData
        };
    }, [initiatives]);

    // Handle Drag End
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96 text-[var(--text-tertiary)]">
            <div className="animate-spin mr-2"><Zap size={20} /></div>
            Cargando inteligencia de negocio...
        </div>
    );

    // Config Mapping
    const widgetsConfig: Record<string, { component: React.ReactNode, span: string }> = {
        'kpis': {
            component: <DashboardKPIs total={metrics.total} completed={metrics.completed} delayed={metrics.delayed} inProgress={metrics.inProgress} completionRate={metrics.completionRate} />,
            span: 'col-span-12'
        },
        'value': {
            component: <DashboardValue valueData={metrics.valueData} total={metrics.total} />,
            span: 'col-span-12 lg:col-span-8'
        },
        'complexity': {
            component: <DashboardComplexity complexityData={metrics.complexityData} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'quarters': {
            component: <DashboardQuarter quartersData={metrics.quartersData} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'timeline': {
            component: <DashboardTimeline initiatives={initiatives} />,
            span: 'col-span-12 lg:col-span-8'
        },
        'health': {
            component: <DashboardHealth total={metrics.total} completed={metrics.completed} delayed={metrics.delayed} inProgress={metrics.inProgress} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'trends': {
            component: <DashboardTrends initiatives={initiatives} />,
            span: 'col-span-12 lg:col-span-8'
        },
        'active-support': {
            component: <DashboardActiveSupport />,
            span: 'col-span-12 lg:col-span-4'
        },
        'transf-lead': {
            component: <DashboardTransfLead transfLeadData={metrics.transfLeadData} total={metrics.total} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'area': {
            component: <DashboardAreaChart areaData={metrics.areaData} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'leaderboard': {
            component: <DashboardLeaderboard initiatives={initiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'activity': {
            component: <DashboardActivity initiatives={initiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'key-initiatives': {
            component: <DashboardKeyInitiatives initiatives={initiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'phase': {
            component: <DashboardPhase phaseData={metrics.phaseData} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'tech': {
            component: <DashboardTech techData={metrics.techData} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'developer': {
            component: <DashboardDeveloper initiatives={initiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
    };

    return (
        <div className="p-2 md:p-6 max-w-[1800px] mx-auto animate-in fade-in duration-500 space-y-6">
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Transformación</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visión general del portafolio del año {year}</p>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={widgetOrder}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-12 gap-6">
                        {widgetOrder.map((widgetId) => {
                            const widget = widgetsConfig[widgetId];
                            if (!widget) return null;

                            return (
                                <div key={widgetId} className={widget.span}>
                                    <SortableWidget id={widgetId}>
                                        {widget.component}
                                    </SortableWidget>
                                </div>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
