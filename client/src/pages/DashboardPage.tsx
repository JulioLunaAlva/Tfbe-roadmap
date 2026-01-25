
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { Zap } from 'lucide-react';
import { DashboardKPIs } from '../components/dashboard/DashboardKPIs';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { DashboardActivity } from '../components/dashboard/DashboardActivity';
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

        return {
            total, completed, delayed, inProgress, completionRate,
            techData, phaseData, complexityData
        };
    }, [initiatives]);

    if (loading) return (
        <div className="flex items-center justify-center h-96 text-[var(--text-tertiary)]">
            <div className="animate-spin mr-2"><Zap size={20} /></div>
            Cargando inteligencia de negocio...
        </div>
    );

    return (
        <div className="p-2 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Transformación</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visión general del portafolio del año {year}</p>
            </div>

            <DashboardKPIs
                total={metrics.total}
                completed={metrics.completed}
                delayed={metrics.delayed}
                inProgress={metrics.inProgress}
                completionRate={metrics.completionRate}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <DashboardCharts
                        techData={metrics.techData}
                        phaseData={metrics.phaseData}
                        complexityData={metrics.complexityData}
                    />
                </div>
                <div className="xl:col-span-1">
                    <DashboardActivity initiatives={initiatives} />
                </div>
            </div>
        </div>
    );
};
