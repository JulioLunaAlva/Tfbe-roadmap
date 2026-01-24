import { RoadmapTable } from '../components/roadmap/RoadmapTable';
import { RoadmapSummary } from '../components/roadmap/RoadmapSummary';
import { RoadmapLegend } from '../components/roadmap/RoadmapLegend';

export const RoadmapPage = () => {
    return (
        <div className="w-full px-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-100">Roadmap de Iniciativas</h2>
            </div>

            <RoadmapSummary />
            <RoadmapLegend />
            <RoadmapTable />
        </div>
    );
};
