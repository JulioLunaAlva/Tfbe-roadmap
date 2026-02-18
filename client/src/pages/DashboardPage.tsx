import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { Zap } from 'lucide-react';
import { DashboardKPIs } from '../components/dashboard/DashboardKPIs';
import { DashboardActivity } from '../components/dashboard/DashboardActivity';
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

import API_URL from '../config/api';

export const DashboardPage = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

        return {
            total, completed, delayed, inProgress, completionRate,
            techData, phaseData, complexityData, areaData, valueData, transfLeadData
        };
    }, [initiatives]);

    if (loading) return (
        <div className="flex items-center justify-center h-96 text-[var(--text-tertiary)]">
            <div className="animate-spin mr-2"><Zap size={20} /></div>
            Cargando inteligencia de negocio...
        </div>
    );

    return (
        <div className="p-2 md:p-6 max-w-[1800px] mx-auto animate-in fade-in duration-500 space-y-6">
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Transformación</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visión general del portafolio del año {year}</p>
            </div>

            {/* Row 1: KPIs - 5 Cards */}
            <DashboardKPIs
                total={metrics.total}
                completed={metrics.completed}
                delayed={metrics.delayed}
                inProgress={metrics.inProgress}
                completionRate={metrics.completionRate}
            />

            {/* Row 2: Value Distribution & Complexity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DashboardValue valueData={metrics.valueData} total={metrics.total} />
                </div>
                <div className="lg:col-span-1">
                    <DashboardComplexity complexityData={metrics.complexityData} />
                </div>
            </div>

            {/* Row 3: Timeline & Portfolio Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DashboardTimeline initiatives={initiatives} />
                </div>
                <div className="lg:col-span-1">
                    <DashboardHealth
                        total={metrics.total}
                        completed={metrics.completed}
                        delayed={metrics.delayed}
                        inProgress={metrics.inProgress}
                    />
                </div>
            </div>

            {/* Row 4: Trends & Active Support Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DashboardTrends initiatives={initiatives} />
                </div>
                <div className="lg:col-span-1">
                    <DashboardActiveSupport />
                </div>
            </div>

            {/* Row 5: Transformation Leads, Area, Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <DashboardTransfLead
                        transfLeadData={metrics.transfLeadData}
                        total={metrics.total}
                    />
                </div>
                <div className="lg:col-span-1">
                    <DashboardAreaChart areaData={metrics.areaData} />
                </div>
                <div className="lg:col-span-1">
                    <DashboardLeaderboard initiatives={initiatives} />
                </div>
            </div>

            {/* Row 6: Priority Initiatives, Phase, Tech */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <DashboardActivity initiatives={initiatives} />
                </div>
                <div className="lg:col-span-1">
                    <DashboardPhase phaseData={metrics.phaseData} />
                </div>
                <div className="lg:col-span-1">
                    <DashboardTech techData={metrics.techData} />
                </div>
            </div>
        </div>
    );
};
