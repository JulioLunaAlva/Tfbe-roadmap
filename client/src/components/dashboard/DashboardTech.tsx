
import { useState, useMemo } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { InitiativeListModal } from './InitiativeListModal';

interface TechProps {
    techData: { name: string; value: number }[];
    initiatives: any[];
}

export const DashboardTech = ({ techData, initiatives }: TechProps) => {
    const [selectedTech, setSelectedTech] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleBarClick = (data: any) => {
        if (data && data.name) {
            setSelectedTech(data.name);
            setIsModalOpen(true);
        }
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedTech || !initiatives) return [];
        return initiatives.filter(i => {
            return i.technologies && Array.isArray(i.technologies) && i.technologies.includes(selectedTech);
        });
    }, [selectedTech, initiatives]);

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
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
                    {techData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    formatter={(value: any) => [`${value} iniciativas`, 'Total']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{ fontSize: '12px', color: '#6B7280' }}
                                />
                                <Pie
                                    data={techData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={handleBarClick}
                                    cursor="pointer"
                                >
                                    {techData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][index % 6]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No hay datos de tecnologías disponibles
                        </div>
                    )}
                </div>
            </div>

            <InitiativeListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Iniciativas de Tecnología: ${selectedTech}`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
