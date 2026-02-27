import { X, User } from 'lucide-react';
import { clsx } from 'clsx';

interface Initiative {
    id: string;
    name: string;
    champion: string;
    progress: number;
    status: string;
    area: string;
}

interface InitiativeListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initiatives: Initiative[];
}

export const InitiativeListModal = ({ isOpen, onClose, title, initiatives }: InitiativeListModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-[#1E2630] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {initiatives.length} {initiatives.length === 1 ? 'iniciativa encontrada' : 'iniciativas encontradas'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {initiatives.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No se encontraron iniciativas.</div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {initiatives.map(item => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#252D38] transition-colors group rounded-md mx-2 my-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {item.name}
                                            </h4>
                                            <div className="flex items-center mt-2 text-xs text-gray-500">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md font-medium mr-3">
                                                    {item.area || 'Sin Área'}
                                                </span>
                                                <span className="flex items-center bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded border border-gray-100 dark:border-gray-700">
                                                    <User size={12} className="mr-1.5" /> {item.champion}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-full mb-1",
                                                item.status === 'Entregado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    item.status === 'Retrasado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            )}>
                                                {item.status}
                                            </span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">{item.progress}%</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-3">
                                        <div
                                            className={clsx("h-full rounded-full transition-all duration-500",
                                                item.status === 'Retrasado' ? 'bg-red-500' :
                                                    item.status === 'Entregado' ? 'bg-green-500' : 'bg-blue-500'
                                            )}
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
