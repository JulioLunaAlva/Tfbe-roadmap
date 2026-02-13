
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardKPIs } from '../components/dashboard/DashboardKPIs';
import { DashboardActivity } from '../components/dashboard/DashboardActivity';
import { DashboardAreaChart } from '../components/dashboard/DashboardAreaChart';
import { DashboardHealth } from '../components/dashboard/DashboardHealth';
import { DashboardLeaderboard } from '../components/dashboard/DashboardLeaderboard';
import { DashboardTimeline } from '../components/dashboard/DashboardTimeline';
import { DashboardTrends } from '../components/dashboard/DashboardTrends';
import { DashboardValue } from '../components/dashboard/DashboardValue';
import { DashboardTransfLead } from '../components/dashboard/DashboardTransfLead';
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
        <div className="p-2 md:p-6 max-w-[1800px] mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Transformación</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visión general del portafolio del año {year}</p>
            </div>

            {/* KPIs - 5 Cards */}
            <DashboardKPIs
                total={metrics.total}
                completed={metrics.completed}
                delayed={metrics.delayed}
                inProgress={metrics.inProgress}
                completionRate={metrics.completionRate}
            />

            {/* Row: Transformation Lead + Complexity Portfolio */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Transformation Lead - Left */}
                <DashboardTransfLead
                    transfLeadData={metrics.transfLeadData}
                    total={metrics.total}
                />

                {/* Complexity Portfolio - Right */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <span className="w-1 h-6 bg-amber-500 rounded-full mr-3"></span>
                            Complejidad del Portafolio
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                            Distribución de iniciativas según su nivel de complejidad (Alta, Media, Baja)
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {metrics.complexityData.map((item) => (
                            <div key={item.name} className="flex items-center p-4 bg-gray-50 dark:bg-[#252D38] rounded-lg hover:shadow-md transition-all">
                                <div className={`w-3 h-12 rounded-full mr-4 ${item.name === 'Alta' ? 'bg-red-500' :
                                    item.name === 'Media' ? 'bg-amber-500' : 'bg-green-500'
                                    }`}></div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{item.name} Complejidad</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Value Distribution - After Complexity */}
            <DashboardValue valueData={metrics.valueData} total={metrics.total} />

            {/* Row 1: Area Chart + Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <DashboardAreaChart areaData={metrics.areaData} />
                <DashboardHealth
                    total={metrics.total}
                    completed={metrics.completed}
                    delayed={metrics.delayed}
                    inProgress={metrics.inProgress}
                />
            </div>

            {/* Row 2: Phase + Tech Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Phase Distribution */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                            Distribución por Fase
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                            Muestra en qué fase del ciclo de vida se encuentra cada iniciativa actualmente
                        </p>
                    </div>
                    <div className="h-[300px] w-full">
                        {metrics.phaseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.phaseData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" opacity={0.3} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {metrics.phaseData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][index % 6]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                No hay datos de fases disponibles
                            </div>
                        )}
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                            Top Tecnologías
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                            Las 6 tecnologías más utilizadas en el portafolio de iniciativas
                        </p>
                    </div>
                    <div className="h-[300px] w-full">
                        {metrics.techData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.techData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#6B7280', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                    />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                        {metrics.techData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][index % 6]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                No hay datos de tecnologías disponibles
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3: Timeline + Leaderboard */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2">
                    <DashboardTimeline initiatives={initiatives} />
                </div>
                <div className="xl:col-span-1">
                    <DashboardLeaderboard initiatives={initiatives} />
                </div>
            </div>

            {/* Row 4: Trends */}
            <DashboardTrends initiatives={initiatives} />

            {/* Row 5: Priority Initiatives (existing) */}
            <div className="mt-6">
                <DashboardActivity initiatives={initiatives} />
            </div>
        </div>
    );
};
