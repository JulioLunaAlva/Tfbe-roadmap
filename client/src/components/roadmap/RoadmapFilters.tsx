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
    setSearchTerm
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
        </div>
    );
};

