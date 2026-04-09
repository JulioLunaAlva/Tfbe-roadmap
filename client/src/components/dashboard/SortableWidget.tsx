
import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, MoveDiagonal2 } from 'lucide-react';
import { clsx } from 'clsx';

interface WidgetSize {
    w: number;
    h?: number;
}

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    onResize?: (size: WidgetSize) => void;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
    currentSize?: WidgetSize;
}

export const SortableWidget = ({ 
    id, 
    children, 
    className, 
    onResize, 
    onResizeStart, 
    onResizeEnd, 
    currentSize = { w: 4 } 
}: SortableWidgetProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const [isResizing, setIsResizing] = useState(false);
    const [tempSize, setTempSize] = useState<WidgetSize>(currentSize);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef<WidgetSize>(currentSize);
    const widgetRef = useRef<HTMLDivElement | null>(null);

    // Sync tempSize when currentSize changes from outside
    useEffect(() => {
        if (!isResizing) {
            setTempSize(currentSize);
        }
    }, [currentSize, isResizing]);

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsResizing(true);
        if (onResizeStart) onResizeStart();
        
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = { ...currentSize };
        
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEndInternal);
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!widgetRef.current) return;

        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;

        const parentWidth = widgetRef.current.parentElement?.parentElement?.clientWidth || 1200;
        const colWidth = parentWidth / 12;
        const colDelta = Math.round(deltaX / colWidth);
        const newW = Math.max(2, Math.min(12, startSize.current.w + colDelta));

        const baseHeight = startSize.current.h || widgetRef.current.clientHeight;
        const newH = Math.max(150, baseHeight + deltaY);

        setTempSize({ w: newW, h: newH });
    };

    const handleResizeEndInternal = () => {
        setIsResizing(false);
        if (onResizeEnd) onResizeEnd();
        
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEndInternal);
        
        if (onResize) {
            onResize(tempSize);
        }
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isResizing ? 'none' : transition,
        zIndex: isDragging || isResizing ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const getSizeLabel = (size: WidgetSize) => {
        const w = size.w;
        if (w === 4) return "Pequeño (1/3)";
        if (w === 6) return "Mediano (1/2)";
        if (w === 8) return "Grande (2/3)";
        if (w === 12) return "Completo (1/1)";
        return `Personalizado (${w}/12)`;
    };

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                widgetRef.current = node;
            }}
            style={style}
            className={clsx(
                "relative group transition-shadow duration-300",
                isResizing ? "ring-2 ring-indigo-500 shadow-xl z-50" : "h-full",
                className
            )}
        >
            {/* Action Bar */}
            <div className="absolute top-2 right-2 z-20 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const nextW = tempSize.w === 4 ? 6 : tempSize.w === 6 ? 8 : tempSize.w === 8 ? 12 : 4;
                        const newSize = { ...tempSize, w: nextW };
                        setTempSize(newSize);
                        if (onResize) onResize(newSize);
                    }}
                    className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm transition-colors border border-gray-100 dark:border-gray-700"
                    title={`Ajuste rápido (Actual: ${getSizeLabel(tempSize)})`}
                >
                    <Maximize2 size={14} />
                </button>

                <div
                    {...attributes}
                    {...listeners}
                    className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700"
                    title="Arrastrar para mover"
                >
                    <GripVertical size={14} />
                </div>
            </div>

            {/* Content Wrapper */}
            <div className={clsx(
                "bg-white dark:bg-[#1E2630] rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300",
                isResizing ? "h-full" : (tempSize.h ? "" : "h-full")
            )}>
                <div 
                    className="w-full h-full overflow-hidden"
                    style={isResizing ? { height: `${tempSize.h}px` } : undefined}
                >
                    {children}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={handleResizeStart}
                className={clsx(
                    "absolute bottom-2 right-2 z-30 p-1 cursor-nwse-resize rounded-md transition-all",
                    "text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40",
                    isResizing ? "text-indigo-500 opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                title="Arrastra para redimensionar (Ancho y Alto)"
            >
                <MoveDiagonal2 size={16} />
            </div>

            {/* Hud/Indicator */}
            {isResizing && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-500/5 backdrop-blur-[1px] pointer-events-none rounded-xl border-2 border-dashed border-indigo-500/50">
                    <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                        {tempSize.w} Col x {Math.round(tempSize.h || 0)}px
                    </div>
                </div>
            )}
        </div>
    );
};
