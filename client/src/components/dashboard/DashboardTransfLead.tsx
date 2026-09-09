import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { InitiativeListModal } from './InitiativeListModal';

interface TransfLeadWidgetProps {
    transfLeadData: { name: string; value: number }[];
    total: number;
    initiatives: any[];
}

export const DashboardTransfLead = ({ transfLeadData, total, initiatives }: TransfLeadWidgetProps) => {
    const [selectedLead, setSelectedLead] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Show all transformation leads, sorted by count
    const allLeads = transfLeadData
        .filter(item => item.name && item.name.trim() !== '')
        .sort((a, b) => b.value - a.value);

    const handleCardClick = (name: string) => {
        setSelectedLead(name);
        setIsModalOpen(true);
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedLead || !initiatives) return [];
        return initiatives.filter(i => i.transformation_lead === selectedLead);
    }, [selectedLead, initiatives]);

    return (
        <>
            <div className="card h-full p-6">
                <div className="mb-6">
                    <h3 className="text-base font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center">
                        <span className="w-[3px] h-5 bg-[#E10600] rounded-full mr-3"></span>
                        Responsables Transformación
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 ml-7">
                        Distribución de iniciativas por responsable de transformación
                    </p>
                </div>

                {allLeads.length > 0 ? (
                    <div className="space-y-3">
                        {allLeads.map((lead, index) => {
                            const percentage = total > 0 ? ((lead.value / total) * 100).toFixed(1) : 0;
                            // Coca-Cola color palette - cycles through colors
                            const colorPalette = [
                                'bg-[#E10600]',      // Coca-Cola Red
                                'bg-[#C40500]',      // Dark Red
                                'bg-[#1a1a1a]',      // Black
                                'bg-[#6B7280]',      // Gray
                                'bg-[#991B1B]'       // Burgundy Red
                            ];
                            const bgColorPalette = [
                                'bg-red-50 dark:bg-red-900/20',
                                'bg-red-100 dark:bg-red-900/30',
                                'bg-gray-100 dark:bg-gray-800/30',
                                'bg-gray-50 dark:bg-gray-700/20',
                                'bg-red-50 dark:bg-red-900/20'
                            ];

                            // Use modulo to cycle colors
                            const colorIndex = index % colorPalette.length;
                            const color = colorPalette[colorIndex];
                            const bgColor = bgColorPalette[colorIndex];

                            return (
                                <div
                                    key={lead.name}
                                    className={`p-4 rounded-lg ${bgColor} hover:shadow-md transition-all group cursor-pointer`}
                                    onClick={() => handleCardClick(lead.name)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                                                <Users size={16} className="text-white" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate" title={lead.name}>
                                                {lead.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {lead.value}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                ({percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color} transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Users size={48} className="mb-3 opacity-30" />
                        <p className="text-sm">No hay responsables de transformación asignados</p>
                    </div>
                )}
            </div>

            <InitiativeListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Iniciativas de Responsable: ${selectedLead}`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
