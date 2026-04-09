import { ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Initiative {
    created_at?: string;
    end_date?: string;
    status: string;
}

interface TrendsProps {
    initiatives: Initiative[];
}

export const DashboardTrends = ({ initiatives }: TrendsProps) => {
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

            // New entries just in this specific month (Flow)
            const monthCreated = initiatives.filter(i => {
                if (!i.created_at) return false;
                const createdDate = new Date(i.created_at);
                return createdDate >= monthStart && createdDate <= monthEnd;
            }).length;

            // Finished entries in this specific month
            const monthCompleted = initiatives.filter(i => {
                if (!i.end_date || i.status !== 'Entregado') return false;
                const endDate = new Date(i.end_date);
                return endDate >= monthStart && endDate <= monthEnd;
            }).length;

            // Historical Accumulation (Stock)
            runningCreated += monthCreated;
            runningCompleted += monthCompleted;

            return {
                month,
                nuevasMensuales: monthCreated,  // Bar
                completadasAcum : runningCompleted, // Line
                volumenTotal: runningCreated // Area
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
            {/* Standard Widget Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                        Tendencias del Portafolio
                    </h3>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 ml-4 block">
                        Crecimiento histórico vs Flujo mensual de proyectos
                    </p>
                </div>

                {/* Analytical Summary Badges */}
                <div className="flex items-center space-x-3 self-start md:self-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
                    <div className="px-3 text-right border-r border-gray-200 dark:border-gray-700">
                        <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-500">Histórico</div>
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

            {/* Hybrid Advanced Graph Sector */}
            <div className="h-[300px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
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

                        {/* 1. Fondo: Área de Volumen Total Histórico */}
                        <Area 
                            type="monotone" 
                            dataKey="volumenTotal" 
                            name="volumenTotal" 
                            stroke="#8B5CF6" 
                            strokeWidth={3} 
                            fill="url(#colorVolumen)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#8B5CF6' }}
                        />
                        
                        {/* 2. Capa Media: Barras de Ingreso Mensual Nuevo */}
                        <Bar 
                            dataKey="nuevasMensuales" 
                            name="nuevasMensuales" 
                            fill="#3B82F6" 
                            barSize={16}
                            radius={[4, 4, 0, 0]} 
                            opacity={0.8}
                        />

                        {/* 3. Capa Superior: Línea de Crecimiento de Éxito (Completadas) */}
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
                </ResponsiveContainer>
            </div>

            {/* Smart Insights Zone Premium */}
            <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center mb-3 text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                    <Sparkles size={14} className="mr-2" />
                    Observaciones Estratégicas
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800/70 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                            <strong className="text-gray-900 dark:text-gray-200 block mb-1">Volumen Activo:</strong>
                            {totalCreated > 0 
                                ? `El pool de operación ha registrado ingresos de nuevos folios hasta alcanzar un volumen bruto de ${totalCreated} iniciativas detectadas en plataforma.` 
                                : `El canal de operación tecnológica actualmente carece de peticiones detectadas.`}
                        </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800/70 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                            <strong className="text-gray-900 dark:text-gray-200 block mb-1">Cierre de Iteraciones:</strong>
                            {totalCompleted > 0 
                                ? `La curva de éxito cerró ${totalCompleted} expedientes en total marcando un factor constante de bateo logístico del ${completionRate}%.` 
                                : `El ciclo de terminación de software reportó nula actividad de lanzamiento formal por el momento.`}
                        </p>
                    </div>

                    <div className={clsx(
                        "p-3 rounded-lg border transition-colors",
                        totalCreated > 0 ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50" : "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800/70"
                    )}>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                            <strong className="text-indigo-700 dark:text-indigo-400 block mb-1">Lectura de Gráficas:</strong>
                            La montaña de sombra púrpura muestra el empuje general del entorno corporativo. Contrastarlo con las columnas azules para notar en qué mes entraron realmente las peticiones.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
