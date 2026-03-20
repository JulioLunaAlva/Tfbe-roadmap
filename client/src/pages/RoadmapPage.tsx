import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { RoadmapTable } from '../components/roadmap/RoadmapTable';
import { RoadmapSummary } from '../components/roadmap/RoadmapSummary';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import type { Step } from 'react-joyride';

export const RoadmapPage = () => {
    const [runTour, setRunTour] = useState<boolean | undefined>(undefined);

    const roadmapSteps: Step[] = [
        {
            target: '.tour-target-title-roadmap',
            content: 'Aquí puedes ver el Roadmap completo de las iniciativas planeadas para este año.',
            disableBeacon: true,
        },
        {
            target: '.tour-roadmap-summary',
            content: 'Este es el resumen de iniciativas general, agrupado por áreas.',
        },
        {
            target: '.tour-roadmap-table',
            content: 'Esta tabla interactiva te permite ver el detalle de cada iniciativa a lo largo de las semanas.',
        }
    ];

    return (
        <div className="w-full px-4 space-y-6">
            <div className="flex justify-between items-center tour-target-title-roadmap">
                <h2 className="text-xl font-bold text-slate-100">Roadmap de Iniciativas</h2>
                <button
                    onClick={() => {
                        localStorage.removeItem('roadmapTourCompleted');
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
                tourKey="roadmapTourCompleted"
                runTour={runTour}
            />

            <div className="tour-roadmap-summary">
                <RoadmapSummary />
            </div>
            
            <div className="tour-roadmap-table">
                <RoadmapTable />
            </div>
        </div>
    );
};
