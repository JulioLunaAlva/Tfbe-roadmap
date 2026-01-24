import { Flag, Star, CheckCircle } from 'lucide-react';

export const RoadmapLegend = () => {
    return (
        <div className="flex flex-wrap gap-4 text-xs text-gray-700 mb-4 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            {/* Markers */}
            <div className="flex items-center space-x-1">
                <Flag size={14} className="text-gray-600 fill-current" />
                <span>Fecha original término planificada</span>
            </div>

            <div className="flex items-center space-x-1">
                <CheckCircle size={14} className="text-green-600" />
                <span>Fecha planeada entrega</span>
            </div>

            <div className="flex items-center space-x-1">
                <Star size={14} className="text-yellow-500 fill-current" />
                <span>Fecha Champion/Funcional</span>
            </div>

            <div className="h-4 w-px bg-gray-300 mx-2"></div>

            {/* Colors */}
            <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                <span>Desarrollo Técnico</span>
            </div>

            <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                <span>Desarrollo Funcional</span>
            </div>

            <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>Avance conforme plan</span>
            </div>

            <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                <span>Atraso / Redefinición</span>
            </div>
        </div>
    );
};
