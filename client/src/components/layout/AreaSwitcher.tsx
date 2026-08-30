import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useArea } from '../../context/AreaContext';
import { clsx } from 'clsx';

export const AreaSwitcher: React.FC = () => {
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

    // If only 1 area, show a static badge — no dropdown needed
    if (userAreas.length <= 1) {
        if (!activeArea) return null;
        return (
            <div className="px-3 py-2 mx-2 mb-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activeArea.color }}
                    />
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{activeArea.name}</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative px-2 mb-2">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left',
                    'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-indigo-400',
                    isOpen && 'border-indigo-500 ring-1 ring-indigo-500/30'
                )}
            >
                {activeArea && (
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activeArea.color }}
                    />
                )}
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate flex-1">
                    {activeArea?.name ?? 'Seleccionar área'}
                </span>
                <ChevronDown
                    size={14}
                    className={clsx('text-gray-400 transition-transform flex-shrink-0', isOpen && 'rotate-180')}
                />
            </button>

            {isOpen && (
                <div className={clsx(
                    'absolute left-0 right-0 mt-1 z-50 rounded-lg border shadow-xl overflow-hidden',
                    'bg-[var(--bg-card)] border-[var(--border-color)]'
                )}>
                    {userAreas.map(area => (
                        <button
                            key={area.id}
                            onClick={() => { setActiveArea(area); setIsOpen(false); }}
                            className={clsx(
                                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                                'hover:bg-[var(--bg-hover)]',
                                activeArea?.id === area.id && 'bg-indigo-500/10'
                            )}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: area.color }}
                            />
                            <span className="text-xs font-medium text-[var(--text-primary)] flex-1 truncate">
                                {area.name}
                            </span>
                            {activeArea?.id === area.id && (
                                <Check size={12} className="text-indigo-400 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
