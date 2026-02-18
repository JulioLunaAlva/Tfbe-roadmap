
import React from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

interface ComplexityProps {
    complexityData: { name: string; value: number }[];
}

export const DashboardComplexity: React.FC<ComplexityProps> = ({ complexityData }) => {
    // Transform data for RadialBarChart
    // Add fill color directly to data for charts
    const chartData = complexityData.map(item => ({
        name: item.name,
        count: item.value,
        fill: item.name === 'Alta' ? '#EF4444' : // Red
            item.name === 'Media' ? '#F59E0B' : // Amber
                '#10B981' // Emerald
    }));

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <div className="mb-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <span className="w-1 h-6 bg-amber-500 rounded-full mr-3"></span>
                    Complejidad del Portafolio
                </h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="30%"
                        outerRadius="100%"
                        barSize={20}
                        data={chartData}
                        startAngle={180}
                        endAngle={0}
                    >
                        <RadialBar
                            label={{ position: 'insideStart', fill: '#fff' }}
                            background
                            dataKey="count"
                        />
                        <Legend
                            iconSize={10}
                            layout="vertical"
                            verticalAlign="middle"
                            wrapperStyle={{
                                top: '50%',
                                right: 0,
                                transform: 'translate(0, -50%)',
                                lineHeight: '24px'
                            }}
                        />
                        <Tooltip />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>

            {/* Simple Summary Cards at Bottom */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {complexityData.map((item) => (
                    <div key={item.name} className="text-center">
                        <div className={`text-xl font-bold ${item.name === 'Alta' ? 'text-red-500' :
                                item.name === 'Media' ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                            {item.value}
                        </div>
                        <div className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                            {item.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
