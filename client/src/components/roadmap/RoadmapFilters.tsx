import { useState } from 'react';
import { Search, Filter, Calendar, SlidersHorizontal, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { clsx } from 'clsx';

interface FiltersProps {
    areas: string[];
    statuses: string[];
    transformationLeads: string[];
    technologies: string[];
    developerOwners: string[];
    complexities: string[];
    selectedArea: string[];
    setSelectedArea: (v: string[]) => void;
    selectedStatus: string[];
    setSelectedStatus: (v: string[]) => void;
    selectedTransfLead: string[];
    setSelectedTransfLead: (v: string[]) => void;
    selectedTechnology: string[];
    setSelectedTechnology: (v: string[]) => void;
    selectedDevOwner: string[];
    setSelectedDevOwner: (v: string[]) => void;
    selectedComplexity: string[];
    setSelectedComplexity: (v: string[]) => void;
    selectedQuarters: string[];
    setSelectedQuarters: (v: string[]) => void;
    selectedClassification: string[];
    setSelectedClassification: (v: string[]) => void;
    uniqueValues: string[];
    selectedValue: string[];
    setSelectedValue: (v: string[]) => void;
    uniqueTags: string[];
    selectedTag: string[];
    setSelectedTag: (v: string[]) => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    canCreate: boolean;
    onCreateInitiative: () => void;
}

export const RoadmapFilters = ({
    areas,
    statuses,
    transformationLeads,
    technologies,
    developerOwners,
    complexities,
    selectedArea,
    setSelectedArea,
    selectedStatus,
    setSelectedStatus,
    selectedTransfLead,
    setSelectedTransfLead,
    selectedTechnology,
    setSelectedTechnology,
    selectedDevOwner,
    setSelectedDevOwner,
    selectedComplexity,
    setSelectedComplexity,
    selectedQuarters,
    setSelectedQuarters,
    selectedClassification,
    setSelectedClassification,
    uniqueValues,
    selectedValue,
    setSelectedValue,
    uniqueTags,
    selectedTag,
    setSelectedTag,
    searchTerm,
    setSearchTerm,
    hasActiveFilters,
    onClearFilters,
    canCreate,
    onCreateInitiative
}: FiltersProps) => {
    const [showAdvanced, setShowAdvanced] = useState<boolean>(() => {
        const saved = localStorage.getItem('roadmap_advanced_filters_open');
        return saved === 'true';
    });

    const toggleAdvanced = () => {
        setShowAdvanced(prev => {
            const next = !prev;
            localStorage.setItem('roadmap_advanced_filters_open', String(next));
            return next;
        });
    };

    // Calculate count of secondary filters active
    const advancedFiltersCount = [
        selectedTransfLead.length > 0,
        selectedTechnology.length > 0,
        selectedDevOwner.length > 0,
        selectedComplexity.length > 0,
        selectedClassification.length > 0,
        selectedValue.length > 0,
        selectedTag.length > 0,
    ].filter(Boolean).length;

    return (
        <div className="mb-4 bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] shadow-sm space-y-3">
            {/* ── Main Filter Bar (Row 1) ── */}
            <div className="flex flex-wrap items-end gap-3">
                {/* Search Bar */}
                <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Buscar</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={15} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por iniciativa..."
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-[#E10600] outline-none placeholder:text-[var(--text-tertiary)] h-9 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Primary Dropdowns */}
                <div className="w-full sm:w-auto sm:min-w-[140px]">
                    <MultiSelectDropdown
                        label="Q de Término"
                        icon={<Calendar size={13} />}
                        options={['Q1', 'Q2', 'Q3', 'Q4']}
                        selectedValues={selectedQuarters}
                        onChange={setSelectedQuarters}
                        placeholder="Todos los Qs"
                    />
                </div>

                <div className="w-full sm:w-auto sm:min-w-[170px]">
                    <MultiSelectDropdown
                        label="Área"
                        icon={<Filter size={13} />}
                        options={areas}
                        selectedValues={selectedArea}
                        onChange={setSelectedArea}
                        placeholder="Todas las Áreas"
                    />
                </div>

                <div className="w-full sm:w-auto sm:min-w-[150px]">
                    <MultiSelectDropdown
                        label="Estatus"
                        options={statuses}
                        selectedValues={selectedStatus}
                        onChange={setSelectedStatus}
                        placeholder="Todos los Estatus"
                    />
                </div>

                {/* Advanced Filters Toggle Button */}
                <button
                    type="button"
                    onClick={toggleAdvanced}
                    className={clsx(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all h-9 flex-shrink-0",
                        showAdvanced || advancedFiltersCount > 0
                            ? "bg-red-50 dark:bg-red-900/20 text-[#E10600] border-red-200 dark:border-red-800/40"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--border-color)]"
                    )}
                    title="Ver más filtros de segmentación"
                >
                    <SlidersHorizontal size={13} />
                    <span>Filtros</span>
                    {advancedFiltersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E10600] text-white font-bold">
                            {advancedFiltersCount}
                        </span>
                    )}
                    {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {/* Clear Active Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-xs text-[var(--text-tertiary)] hover:text-[#E10600] flex items-center gap-1 px-2.5 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors h-9 flex-shrink-0 font-medium"
                        title="Limpiar todos los filtros"
                    >
                        <X size={13} />
                        <span className="hidden md:inline">Limpiar</span>
                    </button>
                )}

                {/* Action: Create Initiative Button */}
                {canCreate && (
                    <button
                        onClick={onCreateInitiative}
                        className="ml-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E10600] hover:bg-red-700 text-white rounded-lg shadow-md shadow-red-900/20 text-xs font-bold transition-transform hover:scale-102 h-9 flex-shrink-0"
                    >
                        <Plus size={15} />
                        <span>Nueva Iniciativa</span>
                    </button>
                )}
            </div>

            {/* ── Advanced Filter Panel (Row 2 Collapsible) ── */}
            {showAdvanced && (
                <div className="pt-3 border-t border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-in fade-in duration-200">
                    <MultiSelectDropdown
                        label="Resp. Transformación"
                        options={transformationLeads}
                        selectedValues={selectedTransfLead}
                        onChange={setSelectedTransfLead}
                        placeholder="Todos"
                    />

                    <MultiSelectDropdown
                        label="Tecnología"
                        options={technologies}
                        selectedValues={selectedTechnology}
                        onChange={setSelectedTechnology}
                        placeholder="Todas"
                    />

                    <MultiSelectDropdown
                        label="Dev / Owner"
                        options={developerOwners}
                        selectedValues={selectedDevOwner}
                        onChange={setSelectedDevOwner}
                        placeholder="Todos"
                    />

                    <MultiSelectDropdown
                        label="Complejidad"
                        options={complexities}
                        selectedValues={selectedComplexity}
                        onChange={setSelectedComplexity}
                        placeholder="Todas"
                    />

                    <MultiSelectDropdown
                        label="Clasificación"
                        options={['Top Priority', 'Iniciativa Clave']}
                        selectedValues={selectedClassification}
                        onChange={setSelectedClassification}
                        placeholder="Todas"
                    />

                    <MultiSelectDropdown
                        label="Valor"
                        options={uniqueValues}
                        selectedValues={selectedValue}
                        onChange={setSelectedValue}
                        placeholder="Todos"
                    />

                    <MultiSelectDropdown
                        label="Etiquetas"
                        options={uniqueTags}
                        selectedValues={selectedTag}
                        onChange={setSelectedTag}
                        placeholder="Todas"
                    />
                </div>
            )}
        </div>
    );
};

