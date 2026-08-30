import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { useArea } from '../../context/AreaContext';
import { clsx } from 'clsx';

export const AreaSwitcher: React.FC<{ isSidebarOpen?: boolean }> = ({ isSidebarOpen = true }) => {
    const { activeArea, userAreas, setActiveArea } = useArea();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // When sidebar is closed, just show a minimal badge/icon
    if (!isSidebarOpen) {
        return (
            <div className="w-full flex items-center justify-center h-20 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg relative"
                     style={{ backgroundColor: activeArea?.color || '#E10600' }}>
                    <Building2 size={20} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[var(--bg-sidebar)]"></div>
                </div>
            </div>
        );
    }

    // If only 1 area, show a static header
    if (userAreas.length <= 1) {
        return (
            <div className="h-24 p-4 border-b border-[var(--border-color)] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="relative flex-shrink-0">
                        <Building2 size={24} style={{ color: activeArea?.color || '#E10600' }} />
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-3 h-3 border-2 border-[var(--bg-sidebar)]"></div>
                    </div>
                    <h1 className="text-sm font-extrabold tracking-tight text-[var(--text-sidebar-primary)] leading-tight line-clamp-2 uppercase">
                        {activeArea?.name || 'Cargando...'}
                    </h1>
                </div>
                {activeArea && (
                    <div className="text-[10px] font-bold text-[var(--text-sidebar-secondary)] bg-[var(--bg-sidebar-hover)] px-2 py-0.5 rounded-full border border-[var(--border-color)] uppercase">
                        {activeArea.slug}
                    </div>
                )}
            </div>
        );
    }

    // If multiple areas, show dropdown header
    return (
        <div ref={ref} className="relative h-24 border-b border-[var(--border-color)] flex flex-col justify-center px-4 w-full">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={clsx(
                    'w-full flex items-center gap-3 p-2 rounded-xl border border-transparent transition-all text-left group',
                    'hover:bg-[var(--bg-sidebar-hover)] hover:border-[var(--border-color)]',
                    isOpen && 'bg-[var(--bg-sidebar-hover)] border-[var(--border-color)]'
                )}
            >
                {/* Logo / Color Icon */}
                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm"
                         style={{ backgroundColor: activeArea?.color || '#E10600' }}>
                        <Building2 size={20} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-3.5 h-3.5 border-2 border-[var(--bg-sidebar)]"></div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-[var(--text-sidebar-secondary)] uppercase tracking-wider mb-0.5">Espacio de trabajo</p>
                    <h1 className="text-sm font-bold text-[var(--text-sidebar-primary)] truncate">
                        {activeArea?.name || 'Seleccionar Área'}
                    </h1>
                </div>

                <ChevronDown
                    size={16}
                    className={clsx(
                        'text-[var(--text-sidebar-secondary)] transition-transform flex-shrink-0 opacity-0 group-hover:opacity-100',
                        isOpen && 'rotate-180 opacity-100'
                    )}
                />
            </button>

            {isOpen && (
                <div className={clsx(
                    'absolute left-4 right-4 top-[85px] z-50 rounded-xl border shadow-2xl overflow-hidden py-1',
                    'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                )}>
                    <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Tus Áreas</p>
                    </div>
                    {userAreas.map(area => (
                        <button
                            key={area.id}
                            onClick={() => { setActiveArea(area); setIsOpen(false); }}
                            className={clsx(
                                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                                'hover:bg-[var(--bg-tertiary)]',
                                activeArea?.id === area.id && 'bg-indigo-500/10'
                            )}
                        >
                            <div className="w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0"
                                 style={{ backgroundColor: area.color }}>
                                <Building2 size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className={clsx(
                                    "block text-sm font-medium truncate",
                                    activeArea?.id === area.id ? "text-indigo-400" : "text-[var(--text-primary)]"
                                )}>
                                    {area.name}
                                </span>
                            </div>
                            {activeArea?.id === area.id && (
                                <Check size={14} className="text-indigo-400 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
