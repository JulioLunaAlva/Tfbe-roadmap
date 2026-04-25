import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { RoadmapTable } from '../components/roadmap/RoadmapTable';
import { RoadmapSummary } from '../components/roadmap/RoadmapSummary';
import { RoadmapKPIs } from '../components/roadmap/RoadmapKPIs';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import { useAuth } from '../context/AuthContext';
import type { Step } from 'react-joyride';

export const RoadmapPage = () => {
    const { user } = useAuth();
    const [runTour, setRunTour] = useState<boolean | undefined>(undefined);

    const isAdminOrEditor = user?.role === 'admin' || user?.role === 'editor';

    const roadmapSteps: Step[] = isAdminOrEditor ? [
        {
            target: '.tour-target-title-roadmap',
            content: 'Bienvenido al gestor de Roadmap. Aquí puedes supervisar la planificación anual de todas las iniciativas.',
            disableBeacon: true,
        },
        {
            target: '.tour-roadmap-kpis',
            content: 'Estos indicadores resumen el estado del portafolio: iniciativas totales, entregadas, en curso, retrasadas y más.',
        },
        {
            target: '.tour-roadmap-summary',
            content: 'Este resumen te permite identificar rápidamente la carga de trabajo por cada área.',
        },
        {
            target: '.tour-roadmap-table',
            content: '¡Tip! Como editor, puedes hacer clic en las celdas de la tabla para actualizar el progreso o fechas de entrega.',
        }
    ] : [
        {
            target: '.tour-target-title-roadmap',
            content: 'Bienvenido al Roadmap de Iniciativas. Aquí puedes consultar la planificación estratégica del año.',
            disableBeacon: true,
        },
        {
            target: '.tour-roadmap-kpis',
            content: 'Estos indicadores resumen el estado general del portafolio de iniciativas.',
        },
        {
            target: '.tour-roadmap-summary',
            content: 'Consulta el despliegue de iniciativas agrupadas por las distintas áreas de la organización.',
        },
        {
            target: '.tour-roadmap-table',
            content: 'Utiliza esta tabla para dar seguimiento al cumplimiento de los hitos y fechas pactadas.',
        }
    ];

    return (
        <div className="w-full px-4 space-y-6">
            <div className="flex justify-between items-center tour-target-title-roadmap">
                <h2 className="text-xl font-bold text-slate-100">Roadmap de Iniciativas</h2>
                <button
                    onClick={() => {
                        localStorage.removeItem(`roadmapTourCompleted_${user?.role || 'user'}`);
                        setRunTour(true);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Repetir recorrido"
                >
                    <HelpCircle size={24} />
                </button>
            </div>

            <OnboardingTour
                steps={roadmapSteps}
                tourKey={`roadmapTourCompleted_${user?.role || 'user'}`}
                runTour={runTour}
            />

            <div className="tour-roadmap-kpis">
                <RoadmapKPIs />
            </div>

            <div className="tour-roadmap-summary">
                <RoadmapSummary />
            </div>
            
            <div className="tour-roadmap-table">
                <RoadmapTable />
            </div>
        </div>
    );
};
