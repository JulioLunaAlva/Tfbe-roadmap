import { Search, Filter, Calendar } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';

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
    searchTerm,
    setSearchTerm,
    hasActiveFilters,
    onClearFilters,
    canCreate,
    onCreateInitiative
}: FiltersProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] items-end shadow-sm">
            {/* Row 1 */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-tertiary)]">Buscar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar iniciativa..."
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-md pl-10 pr-4 py-2 focus:ring-1 focus:ring-[#E10600] outline-none placeholder:text-[var(--text-tertiary)]"
                    />
                </div>
            </div>

            <MultiSelectDropdown
                label="Q de Término"
                icon={<Calendar size={14} />}
                options={['Q1', 'Q2', 'Q3', 'Q4']}
                selectedValues={selectedQuarters}
                onChange={setSelectedQuarters}
                placeholder="Todos los Qs"
            />

            <MultiSelectDropdown
                label="Área"
                icon={<Filter size={14} />}
                options={areas}
                selectedValues={selectedArea}
                onChange={setSelectedArea}
                placeholder="Todas las Áreas"
            />

            <MultiSelectDropdown
                label="Estatus"
                options={statuses}
                selectedValues={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Todos los Estatus"
            />

            {/* Row 2 */}
            <MultiSelectDropdown
                label="Resp. Transformación"
                icon={<Filter size={14} />}
                options={transformationLeads}
                selectedValues={selectedTransfLead}
                onChange={setSelectedTransfLead}
                placeholder="Todos"
            />

            <MultiSelectDropdown
                label="Tecnología"
                icon={<Filter size={14} />}
                options={technologies}
                selectedValues={selectedTechnology}
                onChange={setSelectedTechnology}
                placeholder="Todas"
            />

            <MultiSelectDropdown
                label="Dev/Owner"
                icon={<Filter size={14} />}
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
                icon={<Filter size={14} />}
                options={['Top Priority', 'Iniciativa Clave']}
                selectedValues={selectedClassification}
                onChange={setSelectedClassification}
                placeholder="Todas"
            />

            <MultiSelectDropdown
                label="Valor"
                icon={<Filter size={14} />}
                options={uniqueValues}
                selectedValues={selectedValue}
                onChange={setSelectedValue}
                placeholder="Todos"
            />

            {/* Actions at the end of the grid */}
            <div className="flex justify-end items-center space-x-4 col-span-1 md:col-span-2 lg:col-span-2 mt-2">
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-[var(--text-tertiary)] hover:text-[#E10600] text-sm flex items-center transition-colors px-2 py-2"
                        title="Limpiar todos los filtros"
                    >
                        <Search size={14} className="mr-1 opacity-0 w-0" /> {/* Hidden icon for alignment if needed, or use a real icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        Limpiar Filtros
                    </button>
                )}
                {canCreate && (
                    <button
                        onClick={onCreateInitiative}
                        className="flex justify-center items-center space-x-2 px-4 py-2 bg-[#E10600] text-white rounded-md hover:bg-red-700 shadow-sm text-sm font-bold transition-transform transform hover:scale-105 h-10 w-full md:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        <span>Nueva Iniciativa</span>
                    </button>
                )}
            </div>
        </div>
    );
};

