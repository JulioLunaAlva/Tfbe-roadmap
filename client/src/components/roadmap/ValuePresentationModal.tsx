import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [step, setStep] = useState(0);

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                setStep(s => Math.min(s + 1, pillars.length));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setStep(s => Math.max(s - 1, 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, pillars.length]);

    // Click navigation (advance on click anywhere except close button)
    const handleScreenClick = (e: React.MouseEvent) => {
        // Prevent advancing if they clicked a button or link
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
            return;
        }
        setStep(s => Math.min(s + 1, pillars.length));
    };

    if (!isOpen) return null;

    const modalContent = (
        <div 
            className="fixed inset-0 z-[999999] bg-[#0B1120] text-white flex flex-col p-6 md:p-12 overflow-hidden animate-in fade-in duration-500 cursor-pointer select-none"
            onClick={handleScreenClick}
        >
            {/* Close Button */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-6 right-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 z-[1000000] cursor-pointer"
                title="Cerrar Presentación (Esc)"
            >
                <X size={28} />
            </button>

            {/* Slide Content */}
            <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center">
                
                {/* Header (Always Visible) */}
                <div className={`mb-10 border-l-4 border-red-600 pl-6 transition-all duration-700 transform ${step === 0 ? 'scale-105 translate-y-12' : 'scale-100 translate-y-0'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-lg shadow-red-600/20">
                            Presentación de Valor
                        </span>
                        <div className="h-px w-32 bg-gradient-to-r from-red-600 to-transparent" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1] max-w-5xl">
                        {initiative.name}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-gray-400 bg-white/5 w-fit px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-red-500" />
                            <span className="text-sm font-bold uppercase tracking-widest text-white/80">{initiative.area}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="flex items-center gap-3">
                            <User size={16} className="text-red-500" />
                            <span className="text-sm font-bold uppercase tracking-widest text-white/80">Champion: {initiative.champion || 'N/A'}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="flex items-center gap-3">
                            <Rocket size={16} className="text-red-500" />
                            <span className="text-sm font-bold uppercase tracking-widest text-white/80">Status: {initiative.status || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Initial Step Hint */}
                {step === 0 && (
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-gray-500 text-sm font-medium animate-pulse flex flex-col items-center gap-2">
                        <span>Haz clic o usa las flechas para comenzar</span>
                        <div className="w-px h-8 bg-gradient-to-b from-gray-500 to-transparent" />
                    </div>
                )}

                {/* Pillars Grid */}
                <div className={`flex-1 transition-opacity duration-500 min-h-0 relative ${step > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full overflow-y-auto custom-scrollbar pb-6 pr-2">
                        {pillars.map((pillar, idx) => {
                            const isVisible = step > idx;
                            const Icon = pillar.icon;
                            const content = data[pillar.key];
                            const isEmpty = !content || content === '' || content === '<p></p>';

                            return (
                                <div 
                                    key={pillar.key}
                                    className={`bg-white/[0.04] border border-white/10 rounded-3xl p-6 flex flex-col transition-all duration-700 transform relative overflow-hidden backdrop-blur-sm
                                        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}
                                >
                                    {/* Subtle gradient background based on pillar theme */}
                                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 blur-3xl ${pillar.iconBg}`} />

                                    <div className="flex items-center gap-4 mb-5 relative z-10">
                                        <div className={`p-4 rounded-2xl ${pillar.iconBg} ${pillar.iconColor} shadow-xl shadow-black/40`}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                            {pillar.label}
                                        </h3>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10 cursor-text" onClick={e => e.stopPropagation()}>
                                        {isEmpty ? (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-xs text-gray-500 italic font-medium">Información no detallada</p>
                                            </div>
                                        ) : (
                                            <div 
                                                className="text-gray-300 text-[15px] leading-relaxed prose prose-invert prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3 prose-li:mb-1 max-w-none font-medium"
                                                dangerouslySetInnerHTML={{ __html: content }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
                            <Award size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="block text-xs font-black text-white uppercase tracking-widest leading-tight">Transformación Finanzas</span>
                            <span className="block text-[10px] text-gray-400 font-bold tracking-widest">Reporte de Impacto 2026</span>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2">
                        {[...Array(pillars.length + 1)].map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStep(i);
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-red-500' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                                title={`Ir al paso ${i}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setStep(s => Math.max(s - 1, 0)); }}
                            disabled={step === 0}
                            className="text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors uppercase tracking-widest"
                        >
                            Anterior
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setStep(s => Math.min(s + 1, pillars.length)); }}
                            disabled={step === pillars.length}
                            className="text-xs font-bold text-red-400 hover:text-red-300 disabled:opacity-30 disabled:hover:text-red-400 transition-colors uppercase tracking-widest"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use portal to render outside the main DOM hierarchy
    return createPortal(modalContent, document.body);
};
