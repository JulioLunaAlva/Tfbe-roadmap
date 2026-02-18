import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AreaChartProps {
    areaData: { name: string; value: number; color: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-white dark:bg-[#1E2630] border border-gray-200 dark:border-gray-700 p-3 rounded shadow-lg text-sm">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">{data.name}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {data.value} Iniciativas
                </p>
            </div>
        );
    }
    return null;
};

export const DashboardAreaChart = ({ areaData }: AreaChartProps) => {
    const total = areaData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                Iniciativas por Área
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-[280px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={areaData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                innerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={false}
                            >
                                {areaData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend with Stats - Enhanced */}
                <div className="space-y-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Total: <span className="font-bold text-gray-900 dark:text-white text-lg">{total}</span> iniciativas
                    </div>
                    <div className="max-h-[240px] overflow-y-auto pr-2 space-y-2">
                        {areaData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#252D38] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A3441] transition-colors group">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-gray-800 group-hover:ring-4 transition-all"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={item.name}>
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[45px] text-right">
                                        ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
