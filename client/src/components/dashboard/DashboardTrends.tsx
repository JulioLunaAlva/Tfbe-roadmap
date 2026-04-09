import { ComposedChart, Area, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Sparkles, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface Initiative {
    created_at?: string;
    end_date?: string;
    status: string;
}

interface TrendsProps {
    initiatives: Initiative[];
}

export const DashboardTrends = ({ initiatives }: TrendsProps) => {
    const [viewMode, setViewMode] = useState<'hybrid' | 'legacy'>('hybrid');

    const generateMonthlyData = () => {
        const currentYear = new Date().getFullYear();
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        let runningCreated = 0;
        let runningCompleted = 0;

        return months.map((month, index) => {
            const monthStart = new Date(currentYear, index, 1);
            const monthEnd = new Date(currentYear, index + 1, 0);

            const monthCreated = initiatives.filter(i => {
                if (!i.created_at) return false;
                const createdDate = new Date(i.created_at);
                return createdDate >= monthStart && createdDate <= monthEnd;
            }).length;

            const monthCompleted = initiatives.filter(i => {
                if (!i.end_date || i.status !== 'Entregado') return false;
                const endDate = new Date(i.end_date);
                return endDate >= monthStart && endDate <= monthEnd;
            }).length;

            runningCreated += monthCreated;
            runningCompleted += monthCompleted;

            return {
                month,
                nuevasMensuales: monthCreated,  // Bar
                completadasAcum : runningCompleted, // Line
                volumenTotal: runningCreated, // Area
                created: runningCreated, // Legacy identical logic
                completed: runningCompleted, // Legacy logic
                cumulative: runningCreated // Legacy identical logic
            };
        });
    };

    const data = generateMonthlyData();

    // Summary calculation
    const lastData = data[data.length - 1];
    const totalCreated = lastData.volumenTotal;
    const totalCompleted = lastData.completadasAcum;
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    // Advanced Tooltip UI
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            if (viewMode === 'legacy') {
                return (
                    <div className="bg-white dark:bg-[#1E2630] border border-gray-200 dark:border-gray-700 p-3 rounded shadow-lg text-sm">
                        <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{label}</p>
                        {payload.map((entry: any, index: number) => (
                            <p key={index} style={{ color: entry.color }} className="font-semibold">
                                {entry.name}: {entry.value}
                            </p>
                        ))}
                    </div>
                );
            }

            return (
                <div className="bg-white/90 dark:bg-[#1E2630]/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-xl min-w-[200px]">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-2 mb-3">
                        <p className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[10px]">{label}</p>
                    </div>
                    <div className="space-y-2">
                        {payload.map((entry: any, index: number) => {
                            let displayName = entry.name;
                            if (entry.dataKey === 'nuevasMensuales') displayName = "Nuevas Entradas (Mes)";
                            if (entry.dataKey === 'completadasAcum') displayName = "Acumulado Completado";
                            if (entry.dataKey === 'volumenTotal') displayName = "Volumen Total (Portafolio)";
                            
                            return (
                                <div key={index} className="flex justify-between items-center text-xs">
                                    <span className="flex items-center text-gray-600 dark:text-gray-400 font-medium">
                                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                                        {displayName}
                                    </span>
                                    <span className="font-bold text-gray-900 dark:text-white ml-4">{entry.value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom Legend format
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex justify-center space-x-6 pt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {payload.map((entry: any, index: number) => {
                    let displayName = entry.value;
                    if (entry.dataKey === 'nuevasMensuales') displayName = "Nuevas (Mes)";
                    if (entry.dataKey === 'completadasAcum') displayName = "Completadas (Hist.)";
                    if (entry.dataKey === 'volumenTotal') displayName = "Volumen Total";
                    
                    return (
                        <div key={`item-${index}`} className="flex items-center hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-default">
                            {entry.dataKey === 'nuevasMensuales' ? (
                                <div className="w-3 h-3 mr-2 bg-[#3B82F6] rounded-sm opacity-80" />
                            ) : entry.dataKey === 'volumenTotal' ? (
                                <div className="w-3 h-3 mr-2 bg-gradient-to-t from-[#8B5CF6]/20 to-[#8B5CF6] rounded-full" />
                            ) : (
                                <div className="w-3 h-0.5 mr-2 bg-[#10B981]" />
                            )}
                            {displayName}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-between">
            {/* Conditional Header based on View Mode */}
            {viewMode === 'hybrid' ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                            Tendencias del Portafolio
                            {/* Toggle Button */}
                            <button 
                                onClick={() => setViewMode('legacy')}
                                className="ml-4 flex items-center text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                title="Cambiar tipo de gráfico"
                            >
                                <ToggleRight size={16} className="mr-1.5 text-indigo-500" />
                                Vista Avanzada
                            </button>
                        </h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 ml-4 block">
                            Crecimiento histórico vs Flujo mensual de proyectos
                        </p>
                    </div>

                    <div className="flex items-center space-x-3 self-start md:self-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
                        <div className="px-3 text-right border-r border-gray-200 dark:border-gray-700">
                            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-500">Creadas</div>
                            <div className="text-lg font-black text-indigo-500 leading-none mt-1">{totalCreated}</div>
                        </div>
                        <div className="px-3 text-right border-r border-gray-200 dark:border-gray-700">
                            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-500">Completado</div>
                            <div className="text-lg font-black text-emerald-500 leading-none mt-1">{totalCompleted}</div>
                        </div>
                        <div className="px-3 pr-4 text-right">
                            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-500">Tasa (Win)</div>
                            <div className="text-lg font-black text-gray-800 dark:text-gray-200 flex items-center leading-none mt-1">
                                {completionRate}%
                                {completionRate > 50 ? <TrendingUp size={14} className="ml-1.5 text-emerald-500" /> : <AlertCircle size={14} className="ml-1.5 text-amber-500" />}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                        Tendencias del Portafolio
                        <button 
                            onClick={() => setViewMode('hybrid')}
                            className="ml-4 flex items-center text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Cambiar tipo de gráfico"
                        >
                            <ToggleLeft size={16} className="mr-1.5 text-gray-400" />
                            Vista Clásica
                        </button>
                    </h3>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Creadas</div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalCreated}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Completadas</div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">{totalCompleted}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Tasa</div>
                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                                {completionRate}%
                                <TrendingUp className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Graphic Sector */}
            <div className="h-[300px] w-full mt-2 transition-all duration-500">
                <ResponsiveContainer width="100%" height="100%">
                    {viewMode === 'hybrid' ? (
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVolumen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.15} />
                            
                            <XAxis 
                                dataKey="month" 
                                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                                axisLine={false} 
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis 
                                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                                axisLine={false} 
                                tickLine={false} 
                                tickCount={5}
                                dx={-10}
                            />
                            
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend content={renderLegend} />

                            <Area 
                                type="monotone" 
                                dataKey="volumenTotal" 
                                name="volumenTotal" 
                                stroke="#8B5CF6" 
                                strokeWidth={3} 
                                fill="url(#colorVolumen)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#8B5CF6' }}
                            />
                            
                            <Bar 
                                dataKey="nuevasMensuales" 
                                name="nuevasMensuales" 
                                fill="#3B82F6" 
                                barSize={16}
                                radius={[4, 4, 0, 0]} 
                                opacity={0.8}
                            />

                            <Line 
                                type="monotone" 
                                dataKey="completadasAcum" 
                                name="completadasAcum" 
                                stroke="#10B981" 
                                strokeWidth={3} 
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#10B981' }}
                                strokeLinecap="round"
                            />
                        </ComposedChart>
                    ) : (
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                            
                            <XAxis 
                                dataKey="month" 
                                tick={{ fill: '#6B7280', fontSize: 11 }} 
                                axisLine={false} 
                                tickLine={false} 
                            />
                            <YAxis 
                                tick={{ fill: '#6B7280', fontSize: 11 }} 
                                axisLine={false} 
                                tickLine={false} 
                            />
                            
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                            
                            <Line 
                                type="monotone" 
                                dataKey="created" 
                                name="Creadas" 
                                stroke="#3B82F6" 
                                strokeWidth={2} 
                                dot={{ fill: '#3B82F6', r: 4 }} 
                                activeDot={{ r: 6 }} 
                            />
                            <Line 
                                type="monotone" 
                                dataKey="completed" 
                                name="Completadas" 
                                stroke="#10B981" 
                                strokeWidth={2} 
                                dot={{ fill: '#10B981', r: 4 }} 
                                activeDot={{ r: 6 }} 
                            />
                            <Line 
                                type="monotone" 
                                dataKey="cumulative" 
                                name="Acumuladas" 
                                stroke="#8B5CF6" 
                                strokeWidth={2} 
                                strokeDasharray="5 5" 
                                dot={{ fill: '#8B5CF6', r: 3 }} 
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Smart Insights Zone Premium vs Legacy */}
            {viewMode === 'hybrid' ? (
                <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center mb-3 text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                        <Sparkles size={14} className="mr-2" />
                        Análisis de Progreso
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800/70 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                <strong className="text-gray-900 dark:text-gray-200 block mb-1">Crecimiento del Portafolio:</strong>
                                {totalCreated > 0 
                                    ? `Durante este periodo, se han incorporado un total de ${totalCreated} iniciativas, reflejando el volumen actual de carga de trabajo e innovación.` 
                                    : `El portafolio de iniciativas actualmente se encuentra sin nuevas peticiones registradas.`}
                            </p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800/70 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                <strong className="text-gray-900 dark:text-gray-200 block mb-1">Tasa de Finalización:</strong>
                                {totalCompleted > 0 
                                    ? `El equipo ha entregado satisfactoriamente ${totalCompleted} iniciativas, logrando resolver el ${completionRate}% del volumen total acumulado.` 
                                    : `Aún no se registran iniciativas finalizadas durante este ciclo de trabajo.`}
                            </p>
                        </div>

                        <div className={clsx(
                            "p-3 rounded-lg border transition-colors",
                            totalCreated > 0 ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50" : "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800/70"
                        )}>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                <strong className="text-indigo-700 dark:text-indigo-400 block mb-1">Guía Visual de Tendencias:</strong>
                                La superficie púrpura de fondo muestra cómo crece el portafolio en total. Las columnas azules te muestran rápidamente en qué meses entraron exactamente.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        Insights
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>
                                {totalCreated > 0
                                    ? `Se han creado ${totalCreated} iniciativas en el año actual`
                                    : 'No hay iniciativas creadas este año'}
                            </span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span>
                                {totalCompleted > 0
                                    ? `${totalCompleted} iniciativas completadas (${completionRate}% de tasa de éxito)`
                                    : 'Aún no hay iniciativas completadas'}
                            </span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            <span>
                                La línea acumulada muestra el crecimiento total del portafolio
                            </span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

