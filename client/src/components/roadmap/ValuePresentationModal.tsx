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
    const totalSteps = pillars.length + 1; // 0=Cover, 1-6=Pillars, 7=Summary

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
                setStep(s => Math.min(s + 1, totalSteps));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setStep(s => Math.max(s - 1, 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, totalSteps]);

    // Click navigation
    const handleScreenClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
            return;
        }
        setStep(s => Math.min(s + 1, totalSteps));
    };

    if (!isOpen) return null;

    const currentPillar = step > 0 && step <= pillars.length ? pillars[step - 1] : null;
    const currentData = currentPillar ? data[currentPillar.key] : '';
    const isCurrentEmpty = !currentData || currentData === '' || currentData === '<p></p>';
    const CurrentIcon = currentPillar?.icon;

    const modalContent = (
        <div 
            className="fixed inset-0 z-[999999] bg-[#0B1120] text-white flex flex-col p-6 md:p-12 overflow-hidden animate-in fade-in duration-500 cursor-pointer select-none"
            onClick={handleScreenClick}
        >
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B1120] via-[#0B1120] to-red-900/10 pointer-events-none" />

            {/* Close Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-6 right-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 z-[1000000] cursor-pointer hover:rotate-90"
                title="Cerrar Presentación (Esc)"
            >
                <X size={28} />
            </button>

            {/* Slide Content */}
            <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center relative z-10">
                
                {/* 1. COVER VIEW (Step 0) */}
                {step === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in-95 duration-700">
                        <div className="mb-8 inline-flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded shadow-lg shadow-red-600/30">
                                Impacto & Valor
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-10 leading-[1.1] max-w-5xl">
                            {initiative.name}
                        </h1>
                        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-gray-400 bg-white/5 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <MapPin size={18} className="text-red-500" />
                                <span className="text-base font-bold uppercase tracking-widest text-white/90">{initiative.area}</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-white/20" />
                            <div className="flex items-center gap-3">
                                <User size={18} className="text-red-500" />
                                <span className="text-base font-bold uppercase tracking-widest text-white/90">Champion: {initiative.champion || 'N/A'}</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-white/20" />
                            <div className="flex items-center gap-3">
                                <Rocket size={18} className="text-red-500" />
                                <span className="text-base font-bold uppercase tracking-widest text-white/90">Status: {initiative.status || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="mt-16 text-gray-500 text-sm font-medium animate-pulse flex flex-col items-center gap-3">
                            <span>Haz clic o usa las flechas para comenzar la presentación</span>
                            <div className="w-px h-12 bg-gradient-to-b from-gray-500 to-transparent" />
                        </div>
                    </div>
                )}

                {/* 2. FOCUS VIEW (Steps 1-6) */}
                {step > 0 && step <= pillars.length && currentPillar && (
                    <div className="flex flex-col h-full animate-in slide-in-from-right-16 fade-in duration-500">
                        {/* Mini Header */}
                        <div className="mb-12 border-l-4 border-red-600 pl-6">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-400 tracking-tight leading-tight max-w-4xl truncate">
                                {initiative.name}
                            </h2>
                        </div>

                        {/* Huge Card */}
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className={`absolute inset-0 rounded-[3rem] opacity-5 blur-3xl ${currentPillar.iconBg}`} />
                            <div className="bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-12 md:p-16 flex flex-col w-full max-w-5xl shadow-2xl backdrop-blur-md relative overflow-hidden">
                                <div className="flex items-center gap-6 mb-10 relative z-10">
                                    <div className={`p-6 rounded-3xl ${currentPillar.iconBg} ${currentPillar.iconColor} shadow-xl shadow-black/40`}>
                                        <CurrentIcon size={48} />
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                                        {currentPillar.label}
                                    </h3>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 cursor-text" onClick={e => e.stopPropagation()}>
                                    {isCurrentEmpty ? (
                                        <div className="flex items-center justify-center py-20">
                                            <p className="text-xl text-gray-500 italic font-medium">No se detalló información para este pilar estratégico.</p>
                                        </div>
                                    ) : (
                                        <div 
                                            className="text-gray-200 text-xl md:text-2xl leading-relaxed prose prose-invert prose-p:mb-6 prose-ul:mb-6 prose-ol:mb-6 prose-li:mb-2 max-w-none font-medium
                                            [&>p]:text-gray-300 [&>ul>li]:text-gray-300"
                                            dangerouslySetInnerHTML={{ __html: currentData }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. SUMMARY VIEW (Step 7) */}
                {step === totalSteps && (
                    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-700">
                        {/* Header */}
                        <div className="mb-10 text-center">
                            <h2 className="text-4xl font-black text-white tracking-tight mb-2">Resumen de Impacto</h2>
                            <p className="text-gray-400 text-lg">{initiative.name}</p>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-0">
                            {pillars.map((pillar, idx) => {
                                const Icon = pillar.icon;
                                const content = data[pillar.key];
                                const isEmpty = !content || content === '' || content === '<p></p>';

                                return (
                                    <div 
                                        key={pillar.key}
                                        className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden group"
                                        onClick={(e) => { e.stopPropagation(); setStep(idx + 1); }}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white/10 transition-opacity duration-300" />
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`p-3 rounded-2xl ${pillar.iconBg} ${pillar.iconColor}`}>
                                                <Icon size={20} />
                                            </div>
                                            <h3 className="text-base font-black text-white uppercase tracking-tight">
                                                {pillar.label}
                                            </h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-gray-400 relative z-10">
                                            {isEmpty ? (
                                                <p className="italic opacity-50">Sin detalle</p>
                                            ) : (
                                                <div 
                                                    className="prose prose-invert prose-xs line-clamp-4"
                                                    dangerouslySetInnerHTML={{ __html: content }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between z-10 shrink-0">
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
