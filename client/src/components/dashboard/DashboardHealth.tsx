import { Gauge } from 'lucide-react';
import { clsx } from 'clsx';

interface HealthProps {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
}

export const DashboardHealth = ({ total, completed, delayed, inProgress }: HealthProps) => {
    // Calculate health score (0-100)
    const calculateHealthScore = () => {
        if (total === 0) return 0;

        const completionRate = (completed / total) * 100;
        const delayedRate = (delayed / total) * 100;
        const progressRate = (inProgress / total) * 100;

        // Health formula: 
        // - Completion contributes positively (40%)
        // - Delayed contributes negatively (40%)
        // - In Progress contributes positively (20%)
        const score = Math.round(
            (completionRate * 0.4) +
            (Math.max(0, 100 - delayedRate * 2) * 0.4) +
            (progressRate * 0.2)
        );

        return Math.min(100, Math.max(0, score));
    };

    const healthScore = calculateHealthScore();

    const getHealthStatus = (score: number) => {
        if (score >= 80) return { label: 'Excelente', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' };
        if (score >= 60) return { label: 'Saludable', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' };
        if (score >= 40) return { label: 'Atención', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' };
        return { label: 'Crítico', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
    };

    const status = getHealthStatus(healthScore);
    const circumference = 2 * Math.PI * 70; // radius = 70
    const strokeDashoffset = circumference - (healthScore / 100) * circumference;

    const getRecommendations = () => {
        const recommendations = [];
        if (delayed > 0) recommendations.push(`${delayed} iniciativa${delayed > 1 ? 's' : ''} requiere${delayed === 1 ? '' : 'n'} atención inmediata`);
        if (completed / total < 0.5) recommendations.push('Acelerar cierre de iniciativas en curso');
        if (inProgress === 0 && total > completed) recommendations.push('Activar iniciativas pendientes');
        if (recommendations.length === 0) recommendations.push('Portafolio en buen estado, mantener el ritmo');
        return recommendations;
    };

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <span className="w-1 h-6 bg-teal-500 rounded-full mr-3"></span>
                Salud del Portafolio
            </h3>

            <div className="flex flex-col items-center">
                {/* Gauge Chart */}
                <div className="relative w-48 h-48 mb-6">
                    <svg className="transform -rotate-90 w-48 h-48">
                        {/* Background circle */}
                        <circle
                            cx="96"
                            cy="96"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-gray-200 dark:text-gray-700"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="96"
                            cy="96"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={clsx(status.bg.replace('bg-', 'text-'), 'transition-all duration-1000 ease-out')}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Gauge className={clsx('w-8 h-8 mb-2', status.color)} />
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{healthScore}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">de 100</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={clsx(
                    'px-6 py-2 rounded-full font-bold text-sm mb-6',
                    healthScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        healthScore >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            healthScore >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}>
                    Estado: {status.label}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 w-full mb-6">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completed}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Completadas</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgress}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">En Curso</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{delayed}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Retrasadas</div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="w-full bg-gray-50 dark:bg-[#252D38] rounded-lg p-4">
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Recomendaciones</h4>
                    <ul className="space-y-2">
                        {getRecommendations().map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                                <span className="text-indigo-500 mr-2">•</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
