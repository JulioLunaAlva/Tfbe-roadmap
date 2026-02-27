
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InitiativeListModal } from './InitiativeListModal';

interface PhaseProps {
    phaseDataByMethodology: Record<string, { name: string; value: number }[]>;
    initiatives: any[];
}

export const DashboardPhase = ({ phaseDataByMethodology, initiatives }: PhaseProps) => {
    const [selectedMethodology, setSelectedMethodology] = useState<string>('Hibrida');
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
            const methodology = i.methodology_type || 'Hibrida';
            if (methodology !== selectedMethodology) return false;

            const activePhase = i.phases?.find((p: any) => p.is_active);
            const phaseName = activePhase ? activePhase.name : 'Planning';
            return phaseName === selectedPhase;
        });
    }, [selectedPhase, selectedMethodology, initiatives]);

    const activePhaseData = phaseDataByMethodology[selectedMethodology] || [];

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center mb-3">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                        Distribución por Fase
                    </h3>

                    {/* Methodology Tabs */}
                    <div className="flex gap-2">
                        {['Hibrida', 'Analiticos', 'Reporting'].map(m => (
                            <button
                                key={m}
                                onClick={() => setSelectedMethodology(m)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${selectedMethodology === m
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-[270px] w-full mt-2">
                    {activePhaseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activePhaseData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
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
                                    minPointSize={2}
                                >
                                    {activePhaseData.map((_entry: any, index: number) => (
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
                title={`Fase: ${selectedPhase} (${selectedMethodology})`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
