
import { Star, ChevronRight, User } from 'lucide-react';
import { clsx } from 'clsx';

interface Initiative {
    id: string;
    name: string;
    champion: string;
    progress: number;
    status: string;
    is_top_priority: boolean;
    area: string;
    end_date?: string;
}

interface ActivityProps {
    initiatives: Initiative[];
}

export const DashboardActivity = ({ initiatives }: ActivityProps) => {
    // Filter for Top Priority and Sort by Progress (or any other metric)
    const priorityItems = initiatives
        .filter(i => i.is_top_priority)
        .slice(0, 5); // Top 5

    // If no top priority, just take latest 5
    const displayItems = priorityItems.length > 0 ? priorityItems : initiatives.slice(0, 5);

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                    Iniciativas Prioritarias
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center transition-colors">
                    Ver Todo <ChevronRight size={16} />
                </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No hay iniciativas prioritarias</div>
                ) : (
                    displayItems.map(item => (
                        <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#252D38] transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                        <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium mr-2">
                                            {item.area}
                                        </span>
                                        <span className="flex items-center">
                                            <User size={10} className="mr-1" /> {item.champion}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full mb-1",
                                        item.status === 'Entregado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            item.status === 'Retrasado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    )}>
                                        {item.status}
                                    </span>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.progress}%</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={clsx("h-full rounded-full",
                                        item.status === 'Retrasado' ? 'bg-red-500' :
                                            item.status === 'Entregado' ? 'bg-green-500' : 'bg-blue-500'
                                    )}
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
