
import { useState, useMemo } from 'react';
import { AlertTriangle, Activity, CheckCircle2, ChevronRight, BarChart3 } from 'lucide-react';
import { InitiativeListModal } from './InitiativeListModal';
import { clsx } from 'clsx';

interface ComplexityProps {
    complexityData: { name: string; value: number }[];
    initiatives: any[];
}

export const DashboardComplexity = ({ complexityData, initiatives }: ComplexityProps) => {
    const [selectedComplexity, setSelectedComplexity] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const total = complexityData.reduce((acc, curr) => acc + curr.value, 0);

    const getConfig = (name: string) => {
        switch (name) {
            case 'Alta': return { 
                color: 'text-rose-500', 
                bg: 'bg-rose-50 dark:bg-rose-950/30', 
                border: 'border-rose-100 dark:border-rose-900/40', 
                icon: AlertTriangle,
                barColor: 'bg-rose-500'
            };
            case 'Media': return { 
                color: 'text-amber-500', 
                bg: 'bg-amber-50 dark:bg-amber-950/30', 
                border: 'border-amber-100 dark:border-amber-900/40', 
                icon: Activity,
                barColor: 'bg-amber-500'
            };
            default: return { 
                color: 'text-emerald-500', 
                bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
                border: 'border-emerald-100 dark:border-emerald-900/40', 
                icon: CheckCircle2,
                barColor: 'bg-emerald-500'
            };
        }
    };

    const handleCardClick = (name: string) => {
        setSelectedComplexity(name);
        setIsModalOpen(true);
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedComplexity || !initiatives) return [];
        return initiatives.filter(i => i.complexity === selectedComplexity);
    }, [selectedComplexity, initiatives]);

    // Order data as Alta, Media, Baja for the segmented bar
    const sortedData = useMemo(() => {
        const order = ['Alta', 'Media', 'Baja'];
        return [...complexityData].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    }, [complexityData]);

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col transition-all duration-300 hover:shadow-md">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg mr-3">
                            <BarChart3 size={20} />
                        </span>
                        Mezcla de Complejidad
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Desglose de esfuerzo y riesgo técnico del portafolio actual
                    </p>
                </div>

                {/* Segmented Progress Bar */}
                <div className="mb-8 overflow-hidden rounded-full h-4 flex w-full bg-gray-100 dark:bg-gray-800 shadow-inner">
                    {sortedData.map((item) => {
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        const config = getConfig(item.name);
                        if (percentage === 0) return null;
                        
                        return (
                            <div 
                                key={`bar-${item.name}`}
                                className={clsx(config.barColor, "h-full transition-all duration-1000 ease-out border-r border-white/10 last:border-0")}
                                style={{ width: `${percentage}%` }}
                                title={`${item.name}: ${Math.round(percentage)}%`}
                            />
                        );
                    })}
                </div>

                <div className="flex-1 grid grid-cols-1 gap-4">
                    {sortedData.map((item) => {
                        const config = getConfig(item.name);
                        const Icon = config.icon;
                        const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

                        return (
                            <div
                                key={item.name}
                                className={clsx(
                                    "relative group overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer p-0.5",
                                    config.border,
                                    "hover:shadow-lg hover:-translate-y-0.5"
                                )}
                                onClick={() => handleCardClick(item.name)}
                            >
                                <div className={clsx("absolute inset-0 opacity-100 transition-opacity", config.bg)} />
                                
                                <div className="relative z-10 p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={clsx(
                                            "p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110",
                                            "bg-white dark:bg-[#111827]",
                                            config.color
                                        )}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <div className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                                                {item.value}
                                            </div>
                                            <div className="flex items-center mt-1.5">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                        <div className={clsx("text-lg font-black", config.color)}>
                                            {percentage}%
                                        </div>
                                        <div className="flex items-center text-gray-300 dark:text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold uppercase mr-1">Detalles</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                        Portafolio Total: <span className="text-gray-700 dark:text-gray-200 font-bold">{total} Iniciativas</span>
                    </p>
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
