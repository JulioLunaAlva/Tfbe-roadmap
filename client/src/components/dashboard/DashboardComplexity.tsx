
import React from 'react';

interface ComplexityProps {
    complexityData: { name: string; value: number }[];
}

export const DashboardComplexity: React.FC<ComplexityProps> = ({ complexityData }) => {
    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <span className="w-1 h-6 bg-amber-500 rounded-full mr-3"></span>
                    Complejidad del Portafolio
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                    Distribución de iniciativas según su nivel de complejidad (Alta, Media, Baja)
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {complexityData.map((item) => (
                    <div key={item.name} className="flex items-center p-4 bg-gray-50 dark:bg-[#252D38] rounded-lg hover:shadow-md transition-all">
                        <div className={`w-3 h-12 rounded-full mr-4 ${item.name === 'Alta' ? 'bg-red-500' :
                            item.name === 'Media' ? 'bg-amber-500' : 'bg-green-500'
                            }`}></div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
                            <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{item.name} Complejidad</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
