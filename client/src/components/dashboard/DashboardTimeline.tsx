import { Calendar, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface Initiative {
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    progress: number;
    status: string;
    area: string;
}

interface TimelineProps {
    initiatives: Initiative[];
}

export const DashboardTimeline = ({ initiatives }: TimelineProps) => {
    // Get current month and next 5 months
    const getMonths = () => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            months.push({
                label: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
                fullDate: date
            });
        }
        return months;
    };

    const months = getMonths();

    // Filter initiatives with dates and sort by start date
    const initiativesWithDates = initiatives
        .filter(i => i.start_date && i.end_date)
        .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
        .slice(0, 8); // Show max 8 initiatives

    const getAreaColor = (area: string) => {
        const colors: Record<string, string> = {
            'Finanzas': 'bg-blue-500',
            'IT': 'bg-purple-500',
            'Operaciones': 'bg-green-500',
            'RRHH': 'bg-orange-500',
            'Comercial': 'bg-pink-500',
        };
        return colors[area] || 'bg-gray-500';
    };

    const getStatusColor = (status: string) => {
        if (status === 'Entregado') return 'bg-green-500';
        if (status === 'Retrasado') return 'bg-red-500';
        return 'bg-blue-500';
    };

    const calculatePosition = (date: Date) => {
        const firstMonth = months[0].fullDate;
        const lastMonth = new Date(months[months.length - 1].fullDate);
        lastMonth.setMonth(lastMonth.getMonth() + 1);

        const totalDays = (lastMonth.getTime() - firstMonth.getTime()) / (1000 * 60 * 60 * 24);
        const daysSinceStart = (date.getTime() - firstMonth.getTime()) / (1000 * 60 * 60 * 24);

        return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
    };

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                Timeline de Iniciativas
            </h3>

            {initiativesWithDates.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay iniciativas con fechas definidas</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Month Headers */}
                    <div className="flex justify-between px-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                        {months.map((month, idx) => (
                            <div key={idx} className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                {month.label}
                            </div>
                        ))}
                    </div>

                    {/* Timeline Items */}
                    <div className="space-y-4">
                        {initiativesWithDates.map((initiative) => {
                            const startDate = new Date(initiative.start_date!);
                            const endDate = new Date(initiative.end_date!);
                            const startPos = calculatePosition(startDate);
                            const endPos = calculatePosition(endDate);
                            const width = endPos - startPos;

                            return (
                                <div key={initiative.id} className="relative">
                                    {/* Initiative Name */}
                                    <div className="flex items-center mb-2">
                                        <div className={clsx('w-2 h-2 rounded-full mr-2', getAreaColor(initiative.area))}></div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                            {initiative.name}
                                        </span>
                                        <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {initiative.progress}%
                                        </span>
                                    </div>

                                    {/* Timeline Bar */}
                                    <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={clsx(
                                                'absolute h-full rounded-full transition-all',
                                                getStatusColor(initiative.status),
                                                'opacity-80 hover:opacity-100'
                                            )}
                                            style={{
                                                left: `${startPos}%`,
                                                width: `${width}%`
                                            }}
                                            title={`${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`}
                                        >
                                            {/* Progress Indicator */}
                                            <div
                                                className="h-full bg-white/30 rounded-full"
                                                style={{ width: `${initiative.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
                            Entregado
                        </div>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-3 h-3 rounded bg-blue-500 mr-2"></div>
                            En Curso
                        </div>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-3 h-3 rounded bg-red-500 mr-2"></div>
                            Retrasado
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
