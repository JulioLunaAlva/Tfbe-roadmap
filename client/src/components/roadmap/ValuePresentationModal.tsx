
import { X, Award, MapPin, User, Rocket, CheckCircle2, Layout, Maximize2 } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-2xl group"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            <div className="w-full h-full max-w-7xl mx-auto p-8 flex flex-col animate-in slide-in-from-bottom-12 duration-700 ease-out">
                {/* PPT Header */}
                <div className="mb-12 border-l-8 border-red-600 pl-8 py-2">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded">Impacto & Valor</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4">
                        {initiative.name}
                    </h1>
                    <div className="flex items-center gap-6 text-gray-400">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-red-500" />
                            <span className="text-sm font-bold uppercase tracking-wider">{initiative.area}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-red-500" />
                            <span className="text-sm font-bold uppercase tracking-wider">Champion: {initiative.champion || 'N/A'}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="flex items-center gap-2">
                            <Rocket size={16} className="text-red-500" />
                            <span className="text-sm font-bold uppercase tracking-wider">Status: {initiative.status || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar pb-12">
                    {pillars.map((pillar, index) => {
                        const Icon = pillar.icon;
                        const content = data[pillar.key];
                        const isEmpty = !content || content === '' || content === '<p></p>';

                        return (
                            <div 
                                key={pillar.key}
                                className={`group relative bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-900/20 flex flex-col h-full overflow-hidden`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Background Decorative Circle */}
                                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-5 blur-3xl transition-all group-hover:scale-150 ${pillar.iconBg}`} />

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-4 rounded-2xl ${pillar.iconBg} ${pillar.iconColor} shadow-xl shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                                        <Icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                        {pillar.label}
                                    </h3>
                                </div>

                                <div className="flex-1 prose prose-invert prose-sm max-w-none">
                                    {isEmpty ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-20 italic text-gray-400 py-8">
                                            <div className="w-12 h-px bg-white/20 mb-4" />
                                            <span>Sin información registrada</span>
                                        </div>
                                    ) : (
                                        <div 
                                            className="text-gray-300 leading-relaxed text-sm lg:text-base font-medium space-y-2"
                                            dangerouslySetInnerHTML={{ __html: content }}
                                        />
                                    )}
                                </div>

                                {/* Bottom Decorative Line */}
                                <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
                                    <CheckCircle2 size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isEmpty ? 'text-gray-700' : pillar.iconColor}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* PPT Footer */}
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600 rounded-lg">
                            <Award size={18} className="text-white" />
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-widest">Transformación Finanzas · 2026</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Confidencial · Uso Interno</p>
                </div>
            </div>
        </div>
    );
};
