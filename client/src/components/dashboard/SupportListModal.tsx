import React from 'react';
import { X } from 'lucide-react';

interface SupportItem {
    id: string;
    name: string;
    area: string;
    status: string;
    responsible?: string;
    technology?: string;
}

interface SupportListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: SupportItem[];
}

export const SupportListModal: React.FC<SupportListModalProps> = ({ isOpen, onClose, title, items }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {title}
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-xs py-0.5 px-2.5 rounded-full font-bold">
                            {items.length}
                        </span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-4 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay elementos para mostrar en esta categoría.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-200 hover:shadow-sm dark:hover:border-blue-800 transition-all bg-gray-50/50 dark:bg-[#111827]/50 group">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                                {item.name}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                                    {item.area}
                                                </span>
                                                {item.responsible && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                                        {item.responsible}
                                                    </span>
                                                )}
                                                {item.technology && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                        {item.technology}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
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
