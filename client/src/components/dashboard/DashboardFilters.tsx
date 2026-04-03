import React from 'react';
import { Filter, X } from 'lucide-react';
import { MultiSelectDropdown } from '../roadmap/MultiSelectDropdown';

interface DashboardFiltersProps {
    transformationLeads: string[];
    selectedLeads: string[];
    setSelectedLeads: (leads: string[]) => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
    transformationLeads,
    selectedLeads,
    setSelectedLeads
}) => {
    const hasActiveFilters = selectedLeads.length > 0;

    return (
        <div className="bg-white dark:bg-[#1E2630] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-wrap items-end gap-4 mb-6">
            <div className="w-full md:w-64">
                <MultiSelectDropdown
                    label="Resp. Transformación"
                    icon={<Filter size={14} />}
                    options={transformationLeads}
                    selectedValues={selectedLeads}
                    onChange={setSelectedLeads}
                    placeholder="Todos los Responsables"
                />
            </div>

            {hasActiveFilters && (
                <button
                    onClick={() => setSelectedLeads([])}
                    className="flex items-center space-x-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-md"
                >
                    <X size={14} />
                    <span>Limpiar Filtros</span>
                </button>
            )}

            <div className="flex-1 flex justify-end items-center">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                    * Los datos de todos los widgets se filtran automáticamente al seleccionar un responsable.
                </p>
            </div>
        </div>
    );
};
