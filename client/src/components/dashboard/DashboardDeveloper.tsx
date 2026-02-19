
import React from 'react';

interface Props {
    initiatives: any[];
}

export const DashboardDeveloper: React.FC<Props> = ({ initiatives }) => {
    // Aggregate by developer_owner
    const counts = initiatives.reduce((acc: Record<string, number>, curr) => {
        const owner = curr.developer_owner || 'Sin Asignar';
        acc[owner] = (acc[owner] || 0) + 1;
        return acc;
    }, {});

    const data = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8); // Top 8

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 px-1">
                Iniciativas por Desarrollador
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {data.map(([name, count], idx) => (
                    <div key={name} className="flex items-center justify-between group">
                        <div className="flex items-center flex-1 min-w-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${idx < 3
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                {idx + 1}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {name}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mr-3 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${(count / initiatives.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-6 text-right">
                                {count}
                            </span>
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        No hay datos disponibles
                    </div>
                )}
            </div>
        </div>
    );
};
