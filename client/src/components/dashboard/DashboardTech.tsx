
import { useState, useMemo } from 'react';
import { InitiativeListModal } from './InitiativeListModal';
import { clsx } from 'clsx';
import { Cpu, ChevronRight } from 'lucide-react';

interface TechProps {
    techData: { name: string; value: number }[];
    initiatives: any[];
}

export const DashboardTech = ({ techData, initiatives }: TechProps) => {
    const [selectedTech, setSelectedTech] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const totalInitiatives = initiatives.length;

    const handleTechClick = (name: string) => {
        setSelectedTech(name);
        setIsModalOpen(true);
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedTech || !initiatives) return [];
        return initiatives.filter(i => {
            return i.technologies && Array.isArray(i.technologies) && i.technologies.includes(selectedTech);
        });
    }, [selectedTech, initiatives]);

    // Color mapping for a premium look
    const colors = [
        'bg-blue-500', 
        'bg-indigo-500', 
        'bg-purple-500', 
        'bg-pink-500', 
        'bg-emerald-500', 
        'bg-amber-500'
    ];

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col transition-all duration-300 hover:shadow-md">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg mr-3">
                                <Cpu size={20} />
                            </span>
                            Ecosistema Tecnológico
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                            Mapa completo de capacidades tecnológicas en el portafolio
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 max-h-[400px]">
                    {techData.length > 0 ? (
                        techData.map((tech, index) => {
                            const percentage = totalInitiatives > 0 
                                ? Math.round((tech.value / totalInitiatives) * 100) 
                                : 0;
                            
                            return (
                                <div 
                                    key={tech.name}
                                    onClick={() => handleTechClick(tech.name)}
                                    className="group cursor-pointer"
                                >
                                    <div className="flex justify-between items-end mb-1.5">
                                        <div className="flex items-center">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                                {tech.name}
                                            </span>
                                            <span className="ml-2 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                {tech.value} {tech.value === 1 ? 'Iniciativa' : 'Iniciativas'}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-xs font-black text-gray-900 dark:text-white">
                                            {percentage}%
                                            <ChevronRight size={14} className="ml-1 text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                    
                                    <div className="relative h-2.5 w-full bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden">
                                        {/* Background Glow Effect on Hover */}
                                        <div className={clsx(
                                            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                                            colors[index % colors.length]
                                        )} />
                                        
                                        {/* Main Bar */}
                                        <div 
                                            className={clsx(
                                                "absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out",
                                                colors[index % colors.length]
                                            )}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No hay datos de tecnologías disponibles
                        </div>
                    )}
                </div>

                {techData.length > 3 && (
                    <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                        <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-medium italic">
                            Haz clic en cualquier tecnología para ver los detalles
                        </p>
                    </div>
                )}
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
