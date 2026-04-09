
import { useState, useMemo } from 'react';
import { InitiativeListModal } from './InitiativeListModal';
import { clsx } from 'clsx';
import { Users, ChevronRight, TrendingUp } from 'lucide-react';

interface Props {
    initiatives: any[];
}

export const DashboardDeveloper = ({ initiatives }: Props) => {
    const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Aggregate by developer_owner
    const counts = initiatives.reduce((acc: Record<string, number>, curr) => {
        const owners = Array.isArray(curr.developer_owner)
            ? curr.developer_owner
            : (curr.developer_owner ? [curr.developer_owner] : []);

        if (owners.length === 0) {
            acc['Sin Asignar'] = (acc['Sin Asignar'] || 0) + 1;
        } else {
            owners.forEach((owner: string) => {
                acc[owner?.trim()] = (acc[owner?.trim()] || 0) + 1;
            });
        }
        return acc;
    }, {});

    const sortedData = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Show top 10

    const handleDeveloperClick = (name: string) => {
        setSelectedDeveloper(name);
        setIsModalOpen(true);
    };

    const filteredInitiatives = useMemo(() => {
        if (!selectedDeveloper || !initiatives) return [];
        return initiatives.filter(i => {
            const owners = Array.isArray(i.developer_owner) ? i.developer_owner : (i.developer_owner ? [i.developer_owner] : []);
            if (selectedDeveloper === 'Sin Asignar') return owners.length === 0;
            return owners.some((o: string) => o?.trim() === selectedDeveloper);
        });
    }, [selectedDeveloper, initiatives]);

    const getInitials = (name: string) => {
        if (!name || name === 'Sin Asignar') return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (index: number) => {
        const colors = [
            'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
            'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
            'bg-cyan-500', 'bg-violet-500'
        ];
        return colors[index % colors.length];
    };

    return (
        <>
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col transition-all duration-300 hover:shadow-md">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg mr-3">
                                <Users size={20} />
                            </span>
                            Carga por Desarrollador
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                            Distribución de iniciativas asignadas al equipo de D&A
                        </p>
                    </div>
                    {initiatives.length > 0 && (
                        <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            <TrendingUp size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Activos</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {sortedData.length > 0 ? (
                        sortedData.map(([name, count], idx) => {
                            const percentage = initiatives.length > 0 ? Math.round((count / initiatives.length) * 100) : 0;
                            
                            return (
                                <div
                                    key={name}
                                    className="group relative flex items-center p-2 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer"
                                    onClick={() => handleDeveloperClick(name)}
                                >
                                    {/* Avatar */}
                                    <div className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0 transition-transform group-hover:scale-110",
                                        name === 'Sin Asignar' ? 'bg-gray-400 dark:bg-gray-600' : getAvatarColor(idx)
                                    )}>
                                        {getInitials(name)}
                                    </div>

                                    {/* Info */}
                                    <div className="ml-4 flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                                {name}
                                            </span>
                                            <span className="text-[11px] font-black text-gray-900 dark:text-white ml-2">
                                                {count}
                                            </span>
                                        </div>
                                        
                                        {/* HUD Progress Bar */}
                                        <div className="relative h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={clsx(
                                                    "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out",
                                                    name === 'Sin Asignar' ? 'bg-gray-300 dark:bg-gray-600' : getAvatarColor(idx)
                                                )}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Floating Percentage Indicator on Hover */}
                                    <div className="hidden group-hover:flex items-center ml-3 text-gray-300 dark:text-gray-600">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm py-12">
                            No hay datos de desarrolladores disponibles
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800/50 flex justify-center">
                    <button className="text-[10px] font-bold text-blue-500 dark:text-blue-400 hover:underline uppercase tracking-widest opacity-80">
                        Ver equipo completo
                    </button>
                </div>
            </div>

            <InitiativeListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Iniciativas de Desarrollador: ${selectedDeveloper}`}
                initiatives={filteredInitiatives}
            />
        </>
    );
};
