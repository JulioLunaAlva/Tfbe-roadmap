import { useState, useMemo } from 'react';
import { TrendingUp, Briefcase, Shield, Clock } from 'lucide-react';
import { InitiativeListModal } from './InitiativeListModal';

interface ValueWidgetProps {
    valueData: { name: string; value: number; color: string }[];
    total: number;
    initiatives: any[];
}

const VALUE_ICONS: Record<string, any> = {
    'Estrategico Alto Valor': TrendingUp,
    'Operational Value': Briefcase,
    'Mandatorio/Compliance': Shield,
    'Deferred/Not prioritized': Clock
};

export const DashboardValue = ({ valueData, total, initiatives }: ValueWidgetProps) => {
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCardClick = (name: string) => {
        setSelectedValue(name);
        setIsModalOpen(true);
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedValue || !initiatives) return [];
        return initiatives.filter(i => i.value === selectedValue);
    }, [selectedValue, initiatives]);

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                        Distribución por Valor
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                        Clasificación de iniciativas según su valor estratégico
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {valueData.map((item) => {
                        const Icon = VALUE_ICONS[item.name] || Briefcase;
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

                        return (
                            <div
                                key={item.name}
                                className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group cursor-pointer"
                                onClick={() => handleCardClick(item.name)}
                            >
                                {/* Colored top border */}
                                <div className="h-1" style={{ backgroundColor: item.color }}></div>

                                <div className="p-4 bg-white dark:bg-[#252D38]">
                                    {/* Icon */}
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: item.color + '20' }}
                                    >
                                        <Icon size={24} style={{ color: item.color }} />
                                    </div>

                                    {/* Count */}
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                        {item.value}
                                    </div>

                                    {/* Percentage */}
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        {percentage}% del total
                                    </div>

                                    {/* Label */}
                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                        {item.name}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: item.color
                                            }}
                                        ></div>
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
                title={`Iniciativas de Valor: ${selectedValue}`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
