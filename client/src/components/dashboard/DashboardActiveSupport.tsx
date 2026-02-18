
import React from 'react';

export const DashboardActiveSupport: React.FC = () => {
    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Iniciativas en Soporte Activo (Área)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                Este widget mostrará las iniciativas que se encuentran en etapa de soporte activo.
                <br />
                <span className="text-xs italic mt-2 block">(Próximamente con datos reales)</span>
            </p>
        </div>
    );
};
