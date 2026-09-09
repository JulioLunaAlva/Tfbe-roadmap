import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

interface Initiative {
    champion: string;
    status: string;
    progress: number;
}

interface LeaderboardProps {
    initiatives: Initiative[];
}

interface ChampionStats {
    name: string;
    totalInitiatives: number;
    completedInitiatives: number;
    avgProgress: number;
    successRate: number;
}

export const DashboardLeaderboard = ({ initiatives }: LeaderboardProps) => {
    // Calculate champion statistics
    const calculateChampionStats = (): ChampionStats[] => {
        const championsMap = new Map<string, { total: number; completed: number; totalProgress: number }>();

        initiatives.forEach(initiative => {
            const champion = initiative.champion || 'Sin Asignar';
            const current = championsMap.get(champion) || { total: 0, completed: 0, totalProgress: 0 };

            current.total += 1;
            current.totalProgress += initiative.progress || 0;
            if (initiative.status === 'Entregado') {
                current.completed += 1;
            }

            championsMap.set(champion, current);
        });

        const stats: ChampionStats[] = Array.from(championsMap.entries()).map(([name, data]) => ({
            name,
            totalInitiatives: data.total,
            completedInitiatives: data.completed,
            avgProgress: Math.round(data.totalProgress / data.total),
            successRate: Math.round((data.completed / data.total) * 100)
        }));

        // Sort by: 1) Success rate, 2) Total initiatives
        return stats.sort((a, b) => {
            if (b.successRate !== a.successRate) return b.successRate - a.successRate;
            return b.totalInitiatives - a.totalInitiatives;
        }).slice(0, 5);
    };

    const topChampions = calculateChampionStats();

    const getMedalIcon = (index: number) => {
        switch (index) {
            case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
            case 1: return <Medal className="w-5 h-5 text-gray-400" />;
            case 2: return <Award className="w-5 h-5 text-amber-600" />;
            default: return <div className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400">#{index + 1}</div>;
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="card h-full p-6">
            <h3 className="text-base font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 mb-6 flex items-center">
                <span className="w-[3px] h-5 bg-amber-500 rounded-full mr-3"></span>
                Leaderboard Champions
            </h3>

            {topChampions.length === 0 ? (
                <div className="text-center text-zinc-400 py-8">
                    No hay datos de champions disponibles
                </div>
            ) : (
                <div className="space-y-4">
                    {topChampions.map((champion, index) => (
                        <div
                            key={champion.name}
                            className={clsx(
                                'p-4 rounded-lg transition-all hover:shadow-md',
                                index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-2 border-yellow-200 dark:border-yellow-800' :
                                    index === 1 ? 'bg-gradient-to-r from-zinc-50 to-slate-50 dark:from-zinc-900/10 dark:to-slate-900/10 border border-zinc-200 dark:border-zinc-700' :
                                        index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-200 dark:border-orange-800' :
                                            'bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-white/[0.06]'
                            )}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    {/* Medal/Rank */}
                                    <div className="flex-shrink-0">
                                        {getMedalIcon(index)}
                                    </div>

                                    {/* Avatar */}
                                    <div className={clsx(
                                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                                        index === 0 ? 'bg-yellow-500 text-white' :
                                            index === 1 ? 'bg-zinc-400 text-white' :
                                                index === 2 ? 'bg-amber-600 text-white' :
                                                    'bg-zinc-600 text-white'
                                    )}>
                                        {getInitials(champion.name)}
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <div className="font-bold text-zinc-900 dark:text-white text-sm">
                                            {champion.name}
                                        </div>
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {champion.totalInitiatives} iniciativa{champion.totalInitiatives !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Success Rate Badge */}
                                <div className={clsx(
                                    'px-3 py-1 rounded-md text-xs font-bold',
                                    champion.successRate >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        champion.successRate >= 60 ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' :
                                            champion.successRate >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                )}>
                                    {champion.successRate}% éxito
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/50">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {champion.completedInitiatives}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                                        Completadas
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-zinc-900 dark:text-white flex items-center justify-center">
                                        {champion.avgProgress}%
                                    </div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                                        Progreso Avg
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                                        Top {index + 1}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
