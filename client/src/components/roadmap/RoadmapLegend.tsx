import React from 'react';
import { Flag, Star, CheckCircle, PauseCircle } from 'lucide-react';

interface Props {
    highlightedStatus?: number | null;
    onHighlight?: (status: number | null) => void;
}

export const RoadmapLegend: React.FC<Props> = ({ highlightedStatus = null, onHighlight }) => {
    const handleToggle = (status: number) => {
        if (!onHighlight) return;
        if (highlightedStatus === status) {
            onHighlight(null);
        } else {
            onHighlight(status);
        }
    };

    return (
        <div className="flex flex-wrap gap-3.5 text-xs text-[var(--text-secondary)] items-center bg-[var(--bg-secondary)] px-4 py-2.5 rounded-xl shadow-sm border border-[var(--border-color)]">
            {/* Timeline Milestones */}
            <div className="flex items-center space-x-1.5 cursor-help" title="Hito de Inicio de la Iniciativa">
                <div className="w-3.5 h-3.5 bg-sky-500 rotate-45 rounded-[2px] shadow-sm ring-1 ring-white dark:ring-gray-900 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full -rotate-45" />
                </div>
                <span className="font-medium text-[11px]">Inicio</span>
            </div>

            <div className="flex items-center space-x-1.5 cursor-help" title="Hito de Fin de la Iniciativa">
                <div className="w-3.5 h-3.5 bg-rose-500 rotate-45 rounded-[2px] shadow-sm ring-1 ring-white dark:ring-gray-900 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full -rotate-45" />
                </div>
                <span className="font-medium text-[11px]">Fin</span>
            </div>

            <div className="flex items-center space-x-1.5 cursor-help" title="Línea de la semana actual">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                    HOY
                </span>
                <span className="font-medium text-[11px]">Día Actual</span>
            </div>

            <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>

            {/* Custom Markers */}
            <div className="flex items-center space-x-1 cursor-help" title="Hito Fecha Inicio">
                <Star size={13} className="text-yellow-500 fill-current dark:text-yellow-600" />
                <span className="text-[11px]">Inicio Plan</span>
            </div>

            <div className="flex items-center space-x-1 cursor-help" title="Hito Fecha Plan término planificada">
                <Flag size={13} className="text-gray-500 fill-current dark:text-gray-400" />
                <span className="text-[11px]">Hito Plan</span>
            </div>

            <div className="flex items-center space-x-1 cursor-help" title="Hito Fecha planeada entrega">
                <CheckCircle size={13} className="text-green-600 dark:text-green-500" />
                <span className="text-[11px]">Entrega</span>
            </div>

            <div className="flex items-center space-x-1 cursor-help" title="Hito On Hold — Iniciativa en pausa">
                <PauseCircle size={13} className="text-yellow-500 dark:text-yellow-400" />
                <span className="text-[11px]">On Hold</span>
            </div>

            <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>

            {/* Continuous Timeline Status Pills (Interactive) */}
            <div
                className={`flex items-center space-x-1.5 cursor-pointer transition-all ${highlightedStatus !== null && highlightedStatus !== 1 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(1)}
                title="Filtrar por En plan"
            >
                <div className="w-5 h-2.5 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full shadow-sm"></div>
                <span className="text-[11px] font-medium">En plan</span>
            </div>

            <div
                className={`flex items-center space-x-1.5 cursor-pointer transition-all ${highlightedStatus !== null && highlightedStatus !== 3 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(3)}
                title="Filtrar por Avance conforme plan"
            >
                <div className="w-5 h-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-sm"></div>
                <span className="text-[11px] font-medium">Avance conforme plan</span>
            </div>

            <div
                className={`flex items-center space-x-1.5 cursor-pointer transition-all ${highlightedStatus !== null && highlightedStatus !== 4 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(4)}
                title="Filtrar por Atraso"
            >
                <div className="w-5 h-2.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-full shadow-sm"></div>
                <span className="text-[11px] font-medium">Atraso</span>
            </div>

            <div
                className={`flex items-center space-x-1.5 cursor-pointer transition-all ${highlightedStatus !== null && highlightedStatus !== 2 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(2)}
                title="Filtrar por Atraso / Redefinición Funcional"
            >
                <div className="w-5 h-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-sm"></div>
                <span className="text-[11px] font-medium">Atraso / Redefinición Funcional</span>
            </div>
        </div>
    );
};
