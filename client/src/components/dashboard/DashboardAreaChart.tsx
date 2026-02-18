
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
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center shrink-0">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                Iniciativas por Área
            </h3>

            {/* Content Container - Vertical Layout */}
            <div className="flex-1 flex flex-col min-h-0">

                {/* 1. Chart Section - Top (Flexible height, but min space reserved) */}
                <div className="flex-1 min-h-[220px] flex items-center justify-center relative -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={areaData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                innerRadius={70}
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
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{total}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total</span>
                    </div>
                </div>

                {/* 2. Legend Section - Bottom (Grid Layout) */}
                <div className="mt-2 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {areaData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    {/* Text auto-sized, giving priority to full name */}
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate" title={item.name}>
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0 ml-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                                    <span className="text-xs text-gray-400 w-[32px] text-right">
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

