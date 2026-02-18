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
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center shrink-0">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                Iniciativas por Área
            </h3>

            <div className="flex-1 flex flex-col lg:flex-row items-center gap-6 min-h-0">
                {/* Pie Chart - Take max available space */}
                <div className="flex-1 w-full h-full min-h-[250px] flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={areaData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius="90%"
                                innerRadius="60%"
                                fill="#8884d8"
                                dataKey="value"
                                label={false}
                                paddingAngle={2}
                            >
                                {areaData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{total}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                </div>

                {/* Legend with Stats - Enhanced */}
                <div className="w-full lg:w-1/3 shrink-0 flex flex-col justify-center">
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {areaData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-[#252D38] transition-colors group cursor-default">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={item.name}>
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                                    <span className="text-[10px] text-gray-400 min-w-[30px] text-right">
                                        {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
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
