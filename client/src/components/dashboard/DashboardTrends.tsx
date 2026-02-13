import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Initiative {
    created_at?: string;
    status: string;
}

interface TrendsProps {
    initiatives: Initiative[];
}

export const DashboardTrends = ({ initiatives }: TrendsProps) => {
    // Generate monthly data for the current year
    const generateMonthlyData = () => {
        const currentYear = new Date().getFullYear();
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        const monthlyData = months.map((month, index) => {
            const monthStart = new Date(currentYear, index, 1);
            const monthEnd = new Date(currentYear, index + 1, 0);

            // Count initiatives created in this month
            const created = initiatives.filter(i => {
                if (!i.created_at) return false;
                const createdDate = new Date(i.created_at);
                return createdDate >= monthStart && createdDate <= monthEnd;
            }).length;

            // Count completed initiatives (assuming they were completed in the same month they were created for demo)
            const completed = initiatives.filter(i => {
                if (!i.created_at || i.status !== 'Entregado') return false;
                const createdDate = new Date(i.created_at);
                return createdDate >= monthStart && createdDate <= monthEnd;
            }).length;

            // Calculate cumulative
            return {
                month,
                created,
                completed,
                cumulative: 0 // Will be calculated below
            };
        });

        // Calculate cumulative
        let cumulative = 0;
        monthlyData.forEach(data => {
            cumulative += data.created;
            data.cumulative = cumulative;
        });

        return monthlyData;
    };

    const data = generateMonthlyData();

    // Calculate totals
    const totalCreated = data.reduce((sum, d) => sum + d.created, 0);
    const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
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
        return null;
    };

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                    Tendencias del Portafolio
                </h3>

                {/* Summary Stats */}
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

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                        <Legend
                            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                            iconType="circle"
                        />
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
                </ResponsiveContainer>
            </div>

            {/* Insights */}
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
        </div>
    );
};
