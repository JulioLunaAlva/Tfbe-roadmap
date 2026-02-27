import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { InitiativeListModal } from './InitiativeListModal';

interface DashboardQuarterProps {
    quartersData: { name: string; value: number }[];
    initiatives: any[];
}

const COLORS_QUARTERS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#1E2630] border border-gray-200 dark:border-gray-700 p-3 rounded shadow-lg text-sm">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
                <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    {payload[0].value} Iniciativas
                </p>
            </div>
        );
    }
    return null;
};

export const DashboardQuarter = ({ quartersData, initiatives }: DashboardQuarterProps) => {
    const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const totalWithQ = quartersData.reduce((sum, item) => sum + item.value, 0);

    const handleBarClick = (data: any) => {
        if (data && data.name) {
            setSelectedQuarter(data.name);
            setIsModalOpen(true);
        }
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedQuarter || !initiatives) return [];

        return initiatives.filter(i => {
            if (!i.end_date) return false;

            const month = new Date(i.end_date).getMonth() + 1;
            let q = '';
            if (month >= 1 && month <= 3) q = 'Q1';
            else if (month >= 4 && month <= 6) q = 'Q2';
            else if (month >= 7 && month <= 9) q = 'Q3';
            else q = 'Q4';

            return q === selectedQuarter;
        });
    }, [selectedQuarter, initiatives]);

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                            Cierres por Trimestre (Q)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                            Basado en la fecha de finalización proyectada
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalWithQ}</span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total con Q</p>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quartersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: '#6B7280', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                            <Bar
                                dataKey="value"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                onClick={handleBarClick}
                                cursor="pointer"
                            >
                                {quartersData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_QUARTERS[index % COLORS_QUARTERS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <InitiativeListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Iniciativas de Cierre en ${selectedQuarter}`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
