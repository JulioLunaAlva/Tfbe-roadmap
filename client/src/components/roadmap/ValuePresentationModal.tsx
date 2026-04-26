
import { X, Award, MapPin, User, Rocket } from 'lucide-react';

interface ValueData {
    business_value: string;
    operational_efficiency: string;
    fte_detail: string;
    qualitative_benefit: string;
    users_reached_detail: string;
    estimated_savings_detail: string;
}

interface PillarConfig {
    key: keyof ValueData;
    label: string;
    icon: any;
    gradient: string;
    iconBg: string;
    iconColor: string;
}

interface PresentationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initiative: {
        name: string;
        area: string;
        champion?: string;
        status?: string;
    };
    data: ValueData;
    pillars: PillarConfig[];
}

export const ValuePresentationModal = ({ isOpen, onClose, initiative, data, pillars }: PresentationModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex flex-col p-6 md:p-12 overflow-hidden animate-in fade-in duration-300">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 z-[10000]"
            >
                <X size={28} />
            </button>

            {/* Slide Content */}
            <div className="w-full max-w-7xl mx-auto h-full flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                
                {/* Header */}
                <div className="mb-10 border-l-4 border-red-600 pl-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded">Iniciativa Finalizada</span>
                        <div className="h-px w-20 bg-white/20" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight max-w-4xl">
                        {initiative.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-400">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-red-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">{initiative.area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-red-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Champion: {initiative.champion || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Rocket size={14} className="text-red-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Status: {initiative.status || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Pillars Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto custom-scrollbar pb-10 pr-2">
                    {pillars.map((pillar, idx) => {
                        const Icon = pillar.icon;
                        const content = data[pillar.key];
                        const isEmpty = !content || content === '' || content === '<p></p>';

                        return (
                            <div 
                                key={pillar.key}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.05] transition-all duration-300"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-xl ${pillar.iconBg} ${pillar.iconColor}`}>
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                                        {pillar.label}
                                    </h3>
                                </div>
                                
                                <div className="flex-1 overflow-hidden">
                                    {isEmpty ? (
                                        <p className="text-xs text-gray-600 italic">No se registró información para este pilar.</p>
                                    ) : (
                                        <div 
                                            className="text-gray-300 text-sm leading-relaxed prose prose-invert prose-xs max-w-none
                                                [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2"
                                            dangerouslySetInnerHTML={{ __html: content }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Award size={16} className="text-red-500" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Transformación Finanzas</span>
                    </div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                        Confidencial · Reporte de Impacto
                    </div>
                </div>
            </div>
        </div>
    );
};
