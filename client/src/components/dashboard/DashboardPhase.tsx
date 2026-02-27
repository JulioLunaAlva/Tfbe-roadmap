
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InitiativeListModal } from './InitiativeListModal';

interface PhaseProps {
    phaseData: { name: string; value: number }[];
    initiatives: any[];
}

export const DashboardPhase = ({ phaseData, initiatives }: PhaseProps) => {
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleBarClick = (data: any) => {
        if (data && data.name) {
            setSelectedPhase(data.name);
            setIsModalOpen(true);
        }
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedPhase || !initiatives) return [];
        return initiatives.filter(i => {
            const activePhase = i.phases?.find((p: any) => p.is_active);
            const phaseName = activePhase ? activePhase.name : 'Planning';
            return phaseName === selectedPhase;
        });
    }, [selectedPhase, initiatives]);

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                        Distribución por Fase
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                        Muestra en qué fase del ciclo de vida se encuentra cada iniciativa actualmente
                    </p>
                </div>
                <div className="h-[300px] w-full">
                    {phaseData.length > 0 ? (
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
                                <Tooltip />
                                <Bar
                                    dataKey="value"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                    onClick={handleBarClick}
                                    cursor="pointer"
                                >
                                    {phaseData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][index % 6]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No hay datos de fases disponibles
                        </div>
                    )}
                </div>
            </div>

            <InitiativeListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Iniciativas en Fase: ${selectedPhase}`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
