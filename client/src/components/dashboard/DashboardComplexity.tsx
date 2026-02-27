
import { useState, useMemo } from 'react';
import { AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { InitiativeListModal } from './InitiativeListModal';

interface ComplexityProps {
    complexityData: { name: string; value: number }[];
    initiatives: any[];
}

export const DashboardComplexity = ({ complexityData, initiatives }: ComplexityProps) => {
    const [selectedComplexity, setSelectedComplexity] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getConfig = (name: string) => {
        switch (name) {
            case 'Alta': return { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/30', icon: AlertTriangle };
            case 'Media': return { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-900/30', icon: Activity };
            default: return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30', icon: CheckCircle2 };
        }
    };

    const total = complexityData.reduce((acc, curr) => acc + curr.value, 0);

    const handleCardClick = (name: string) => {
        setSelectedComplexity(name);
        setIsModalOpen(true);
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedComplexity || !initiatives) return [];
        return initiatives.filter(i => i.complexity === selectedComplexity);
    }, [selectedComplexity, initiatives]);

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="w-1 h-6 bg-amber-500 rounded-full mr-3"></span>
                        Complejidad del Portafolio
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">
                        Distribución por nivel de dificultad técnica y operativa
                    </p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-4">
                    {complexityData.map((item) => {
                        const config = getConfig(item.name);
                        const Icon = config.icon;
                        const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

                        return (
                            <div
                                key={item.name}
                                className={`relative overflow-hidden rounded-lg border ${config.border} ${config.bg} p-4 transition-all hover:shadow-md group cursor-pointer`}
                                onClick={() => handleCardClick(item.name)}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full bg-white dark:bg-[#1E2630] shadow-sm ${config.color}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                                                {item.value}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mt-1">
                                                {item.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-xl font-bold opacity-30 ${config.color}`}>
                                        {percentage}%
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <InitiativeListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Iniciativas de Complejidad: ${selectedComplexity}`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
