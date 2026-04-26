import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useYear } from '../../context/YearContext';
import API_URL from '../../config/api';
import {
    TrendingUp, CheckCircle2, Zap, AlertTriangle,
    BarChart3, Award, Building2
} from 'lucide-react';

interface KPIData {
    total: number;
    delivered: number;
    in_progress: number;
    delayed: number;
    avg_progress: number;
    value_documented: number;
    areas: number;
}

// Animated counter hook
const useAnimatedCounter = (target: number, duration: number = 1200) => {
    const [count, setCount] = useState(0);
    const prevTarget = useRef(0);

    useEffect(() => {
        if (target === prevTarget.current) return;
        prevTarget.current = target;

        const startTime = performance.now();
        const startVal = count;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(startVal + (target - startVal) * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [target, duration]);

    return count;
};

const KPICard = ({
    label,
    value,
    suffix = '',
    icon: Icon,
    gradient,
    iconBg,
    delay = 0
}: {
    label: string;
    value: number;
    suffix?: string;
    icon: any;
    gradient: string;
    iconBg: string;
    delay?: number;
}) => {
    const animatedValue = useAnimatedCounter(value);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#1E2630] p-3 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 truncate">
                        {label}
                    </p>
                    <p className="text-xl font-extrabold text-gray-800 dark:text-white tracking-tight truncate">
                        {animatedValue}{suffix}
                    </p>
                </div>
                <div className={`p-2 rounded-xl ${iconBg} shadow-sm flex-shrink-0`}>
                    <Icon size={18} className="text-white" />
                </div>
            </div>
        </div>
    );
};

export const RoadmapKPIs = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [data, setData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        fetch(`${API_URL}/api/kpi-summary?year=${year}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, [token, year]);

    if (loading || !data) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 mb-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-[76px] rounded-xl bg-gray-100 dark:bg-[#1E2630] animate-pulse border border-gray-200 dark:border-gray-700/50" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: 'Total Iniciativas',
            value: data.total,
            icon: BarChart3,
            gradient: 'from-indigo-500 to-purple-500',
            iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        },
        {
            label: 'Entregadas',
            value: data.delivered,
            icon: CheckCircle2,
            gradient: 'from-emerald-400 to-green-500',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        },
        {
            label: 'En Curso',
            value: data.in_progress,
            icon: Zap,
            gradient: 'from-blue-400 to-cyan-500',
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        },
        {
            label: 'Retrasadas',
            value: data.delayed,
            icon: AlertTriangle,
            gradient: 'from-red-400 to-rose-500',
            iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
        },
        {
            label: 'Avance Promedio',
            value: data.avg_progress,
            suffix: '%',
            icon: TrendingUp,
            gradient: 'from-amber-400 to-orange-500',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        },
        {
            label: 'Valor Documentado',
            value: data.value_documented,
            icon: Award,
            gradient: 'from-violet-400 to-fuchsia-500',
            iconBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
        },
        {
            label: 'Áreas Activas',
            value: data.areas,
            icon: Building2,
            gradient: 'from-teal-400 to-emerald-500',
            iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 mb-4">
            {cards.map((card, i) => (
                <KPICard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    suffix={card.suffix}
                    icon={card.icon}
                    gradient={card.gradient}
                    iconBg={card.iconBg}
                    delay={i * 80}
                />
            ))}
        </div>
    );
};
