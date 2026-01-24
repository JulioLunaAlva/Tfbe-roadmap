import { Search, Filter } from 'lucide-react';

interface FiltersProps {
    areas: string[];
    statuses: string[];
    transformationLeads: string[];
    selectedArea: string;
    setSelectedArea: (v: string) => void;
    selectedStatus: string;
    setSelectedStatus: (v: string) => void;
    selectedTransfLead: string;
    setSelectedTransfLead: (v: string) => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
}

export const RoadmapFilters = ({
    areas,
    statuses,
    transformationLeads,
    selectedArea,
    setSelectedArea,
    selectedStatus,
    setSelectedStatus,
    selectedTransfLead,
    setSelectedTransfLead,
    searchTerm,
    setSearchTerm
}: FiltersProps) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] items-end shadow-sm">
            <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-[var(--text-tertiary)]">Buscar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar iniciativa..."
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-md pl-10 pr-4 py-2 focus:ring-1 focus:ring-[#E10600] focus:border-[#E10600] outline-none placeholder:text-[var(--text-tertiary)]"
                    />
                </div>
            </div>

            <div className="space-y-1 w-full md:w-48">
                <label className="text-xs font-medium text-[var(--text-tertiary)]">Filtrar por Área</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />
                    <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-md pl-9 pr-8 py-2 focus:ring-1 focus:ring-[#E10600] appearance-none cursor-pointer"
                    >
                        <option value="ALL">Todas las Áreas</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-1 w-full md:w-48">
                <label className="text-xs font-medium text-[var(--text-tertiary)]">Estatus</label>
                <div className="relative">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-md px-3 py-2 focus:ring-1 focus:ring-[#E10600] appearance-none cursor-pointer"
                    >
                        <option value="ALL">Todos los Estatus</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="space-y-1 w-full md:w-48">
                <label className="text-xs font-medium text-[var(--text-tertiary)]">Resp. Transformación</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />
                    <select
                        value={selectedTransfLead}
                        onChange={(e) => setSelectedTransfLead(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-md pl-9 pr-8 py-2 focus:ring-1 focus:ring-[#E10600] appearance-none cursor-pointer"
                    >
                        <option value="ALL">Todos</option>
                        {transformationLeads.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};
