
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface ChartProps {
    techData: { name: string; value: number }[];
    phaseData: { name: string; value: number }[];
    complexityData: { name: string; value: number }[];
}

const COLORS_TECH = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#1E2630] border border-gray-200 dark:border-gray-700 p-3 rounded shadow-lg text-sm">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {payload[0].value} Iniciativas
                </p>
            </div>
        );
    }
    return null;
};

export const DashboardCharts = ({ techData, phaseData, complexityData }: ChartProps) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Phase Distribution Chart */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                    Distribución por Fase
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={phaseData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
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
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {phaseData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_TECH[index % COLORS_TECH.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tech Radar (Top Technologies) */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                    Top Tecnologías
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={techData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#6B7280', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                {techData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_TECH[index % COLORS_TECH.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Complexity Projects (Smaller or Side) - Optional, merging into grid if needed */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                    <span className="w-1 h-6 bg-amber-500 rounded-full mr-3"></span>
                    Complejidad del Portafolio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {complexityData.map((item) => (
                        <div key={item.name} className="flex items-center p-4 bg-gray-50 dark:bg-[#252D38] rounded-lg">
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
    );
};
