import React from 'react';
import { Flag, Star, CheckCircle } from 'lucide-react';

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
        <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] items-center bg-[var(--bg-secondary)] p-3 rounded-lg shadow-sm border border-[var(--border-color)]">
            {/* Markers */}
            <div className="flex items-center space-x-1 cursor-help" title="Hito Fecha original término planificada">
                <Flag size={14} className="text-gray-600 fill-current dark:text-gray-400" />
                <span>Fecha original</span>
            </div>

            <div className="flex items-center space-x-1 cursor-help" title="Hito Fecha planeada entrega">
                <CheckCircle size={14} className="text-green-600 dark:text-green-500" />
                <span>Fecha entrega</span>
            </div>

            <div className="flex items-center space-x-1 cursor-help" title="Hito Fecha Champion/Funcional">
                <Star size={14} className="text-yellow-500 fill-current dark:text-yellow-600" />
                <span>Fecha Champion</span>
            </div>

            <div className="h-4 w-px bg-[var(--border-color)] mx-2"></div>

            {/* Colors (Interactive) */}
            <div
                className={`flex items-center space-x-1 cursor-pointer transition-opacity ${highlightedStatus !== null && highlightedStatus !== 2 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(2)}
            >
                <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                <span>Desarrollo Técnico</span>
            </div>

            <div
                className={`flex items-center space-x-1 cursor-pointer transition-opacity ${highlightedStatus !== null && highlightedStatus !== 1 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(1)}
            >
                <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                <span>Desarrollo Funcional</span>
            </div>

            <div
                className={`flex items-center space-x-1 cursor-pointer transition-opacity ${highlightedStatus !== null && highlightedStatus !== 3 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(3)}
            >
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>Avance conforme plan</span>
            </div>

            <div
                className={`flex items-center space-x-1 cursor-pointer transition-opacity ${highlightedStatus !== null && highlightedStatus !== 4 ? 'opacity-30' : 'hover:opacity-80'}`}
                onClick={() => handleToggle(4)}
            >
                <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                <span>Atraso / Redefinición</span>
            </div>
        </div>
    );
};
