import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { Zap, HelpCircle } from 'lucide-react';
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
import { DashboardTech } from '../components/dashboard/DashboardTech';
import { DashboardDeveloper } from '../components/dashboard/DashboardDeveloper';
import { DashboardQuarter } from '../components/dashboard/DashboardQuarter';
import { DashboardFilters } from '../components/dashboard/DashboardFilters';

import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import type { Step } from 'react-joyride';

import API_URL from '../config/api';

export const DashboardPage = () => {
    const { token } = useAuth();
    const { user } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [runTour, setRunTour] = useState<boolean | undefined>(undefined);

    const isAdminOrEditor = user?.role === 'admin' || user?.role === 'editor';

    const dashboardSteps: Step[] = isAdminOrEditor ? [
        {
            target: '.tour-target-title',
            content: '¡Bienvenido al Dashboard de Gestión! Como editor, aquí puedes supervisar y organizar todo el portafolio.',
            disableBeacon: true,
        },
        {
            target: '.tour-widget-kpis',
            content: 'Estos son los KPIs principales. Te permiten ver de un vistazo el avance de todas las iniciativas.',
        },
        {
            target: '.tour-dashboard-grid',
            content: '¡Tip! Puedes arrastrar y soltar cualquier tarjeta para reordenar el dashboard a tu gusto.',
        },
        {
            target: '.tour-widget-timeline',
            content: 'Utiliza la línea de tiempo para visualizar la duración y entrega de los proyectos.',
        }
    ] : [
        {
            target: '.tour-target-title',
            content: '¡Bienvenido al Dashboard de Transformación! Aquí puedes consultar el estado actual del portafolio.',
            disableBeacon: true,
        },
        {
            target: '.tour-widget-kpis',
            content: 'Consulta estos indicadores para conocer el progreso general y posibles retrasos.',
        },
        {
            target: '.tour-widget-timeline',
            content: 'Aquí puedes ver las fechas clave y el cronograma de las iniciativas.',
        }
    ];

    const defaultOrder = [
        'kpis',
        'value', 'complexity', 'quarters',
        'timeline', 'health',
        'trends', 'active-support',
        'transf-lead', 'area', 'leaderboard',
        'activity', 'key-initiatives', 'tech', 'developer'
    ];

    const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('dashboard_widget_order');
        if (saved) {
            const parsed = JSON.parse(saved);
            const missing = defaultOrder.filter(id => !parsed.includes(id));

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

    const transformationLeads = useMemo(() => {
        const leads = new Set<string>();
        initiatives.forEach(i => {
            const lead = i.transformation_lead?.trim();
            if (lead) leads.add(lead);
        });
        return Array.from(leads).sort();
    }, [initiatives]);

    const filteredInitiatives = useMemo(() => {
        if (selectedLeads.length === 0) return initiatives;
        return initiatives.filter(i => selectedLeads.includes(i.transformation_lead?.trim() || ''));
    }, [initiatives, selectedLeads]);

    const metrics = useMemo(() => {
        const total = filteredInitiatives.length;
        const completed = filteredInitiatives.filter(i => i.status === 'Entregado').length;
        const delayed = filteredInitiatives.filter(i => i.status === 'Retrasado' || i.status === 'En riesgo').length;
        const inProgress = filteredInitiatives.filter(i =>
            i.status === 'En curso' ||
            i.status === 'En redefinición' ||
            i.status === 'Avance conforme plan'
        ).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const areaCounts: Record<string, number> = {};
        filteredInitiatives.forEach(i => {
            const area = i.area || 'Sin Área';
            areaCounts[area] = (areaCounts[area] || 0) + 1;
        });

        const colorPalette = [
            '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4',
            '#EF4444', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#A855F7',
        ];

        const areaData = Object.keys(areaCounts)
            .map((k, index) => ({
                name: k,
                value: areaCounts[k],
                color: colorPalette[index % colorPalette.length]
            }))
            .sort((a, b) => b.value - a.value);

        const techCounts: Record<string, number> = {};
        filteredInitiatives.forEach(i => {
            if (i.technologies && Array.isArray(i.technologies)) {
                i.technologies.forEach((t: string) => {
                    techCounts[t] = (techCounts[t] || 0) + 1;
                });
            }
        });
        const techData = Object.keys(techCounts)
            .map(k => ({ name: k, value: techCounts[k] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const phaseCountsByMethodology: Record<string, Record<string, number>> = {};
        filteredInitiatives.forEach(i => {
            const methodology = i.methodology_type || 'Hibrida';
            const activePhase = i.phases?.find((p: any) => p.is_active);
            const phaseName = activePhase ? activePhase.name : 'Planning';

            if (!phaseCountsByMethodology[methodology]) {
                phaseCountsByMethodology[methodology] = {};
            }
            phaseCountsByMethodology[methodology][phaseName] = (phaseCountsByMethodology[methodology][phaseName] || 0) + 1;
        });

        const phaseDataByMethodology: Record<string, { name: string, value: number }[]> = {};
        Object.keys(phaseCountsByMethodology).forEach(methodology => {
            phaseDataByMethodology[methodology] = Object.keys(phaseCountsByMethodology[methodology]).map(phaseName => ({
                name: phaseName,
                value: phaseCountsByMethodology[methodology][phaseName]
            }));
        });

        const complexityCounts = filteredInitiatives.reduce((acc: any, curr: any) => {
            const c = curr.complexity || 'N/A';
            acc[c] = (acc[c] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const complexityData = ['Alta', 'Media', 'Baja'].map(k => ({
            name: k,
            value: complexityCounts[k] || 0
        }));

        const valueColors: Record<string, string> = {
            'Estrategico Alto Valor': '#8B5CF6',
            'Operational Value': '#3B82F6',
            'Mandatorio/Compliance': '#F59E0B',
            'Deferred/Not prioritized': '#6B7280'
        };

        const valueData = [
            'Estrategico Alto Valor',
            'Operational Value',
            'Mandatorio/Compliance',
            'Deferred/Not prioritized'
        ].map(val => ({
            name: val,
            value: filteredInitiatives.filter(i => i.value === val).length,
            color: valueColors[val]
        }));

        const transfLeadCounts: Record<string, number> = {};
        filteredInitiatives.forEach(i => {
            const lead = i.transformation_lead?.trim();
            if (lead) {
                transfLeadCounts[lead] = (transfLeadCounts[lead] || 0) + 1;
            }
        });
        const transfLeadData = Object.keys(transfLeadCounts)
            .map(k => ({ name: k, value: transfLeadCounts[k] }))
            .sort((a, b) => b.value - a.value);

        const qCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
        filteredInitiatives.forEach(i => {
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
            techData, phaseDataByMethodology, complexityData, areaData, valueData, transfLeadData, quartersData
        };
    }, [filteredInitiatives]);

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

    const widgetsConfig: Record<string, { component: React.ReactNode, span: string }> = {
        'kpis': {
            component: <DashboardKPIs total={metrics.total} completed={metrics.completed} delayed={metrics.delayed} inProgress={metrics.inProgress} completionRate={metrics.completionRate} initiatives={filteredInitiatives} />,
            span: 'col-span-12'
        },
        'value': {
            component: <DashboardValue valueData={metrics.valueData} total={metrics.total} initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-8'
        },
        'complexity': {
            component: <DashboardComplexity complexityData={metrics.complexityData} initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'quarters': {
            component: <DashboardQuarter quartersData={metrics.quartersData} initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'timeline': {
            component: <DashboardTimeline initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-8'
        },
        'health': {
            component: <DashboardHealth total={metrics.total} completed={metrics.completed} delayed={metrics.delayed} inProgress={metrics.inProgress} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'trends': {
            component: <DashboardTrends initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-8'
        },
        'active-support': {
            component: <DashboardActiveSupport />,
            span: 'col-span-12 lg:col-span-4'
        },
        'transf-lead': {
            component: <DashboardTransfLead transfLeadData={metrics.transfLeadData} total={metrics.total} initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'area': {
            component: <DashboardAreaChart areaData={metrics.areaData} initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'leaderboard': {
            component: <DashboardLeaderboard initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'activity': {
            component: <DashboardActivity initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'key-initiatives': {
            component: <DashboardKeyInitiatives initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'tech': {
            component: <DashboardTech techData={metrics.techData} initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
        'developer': {
            component: <DashboardDeveloper initiatives={filteredInitiatives} />,
            span: 'col-span-12 lg:col-span-4'
        },
    };

    return (
        <div className="p-2 md:p-6 max-w-[1800px] mx-auto animate-in fade-in duration-500 space-y-6">
            <div className="flex justify-between items-center mb-2 tour-target-title">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Transformación</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Visión general del portafolio del año {year}</p>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem(`dashboardTourCompleted_${user?.role || 'user'}`);
                        setRunTour(true);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Repetir recorrido"
                >
                    <HelpCircle size={24} />
                </button>
            </div>

            <DashboardFilters
                transformationLeads={transformationLeads}
                selectedLeads={selectedLeads}
                setSelectedLeads={setSelectedLeads}
            />

            <OnboardingTour
                steps={dashboardSteps}
                tourKey={`dashboardTourCompleted_${user?.role || 'user'}`}
                runTour={runTour}
            />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={widgetOrder}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-12 gap-6 tour-dashboard-grid">
                        {widgetOrder.map((widgetId) => {
                            const widget = widgetsConfig[widgetId];
                            if (!widget) return null;

                            return (
                                <div key={widgetId} className={`${widget.span} tour-widget-${widgetId}`}>
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
