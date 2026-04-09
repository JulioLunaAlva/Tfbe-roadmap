
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2 } from 'lucide-react';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    onResize?: () => void;
    currentSize?: number;
}

export const SortableWidget = ({ id, children, className, onResize, currentSize }: SortableWidgetProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const getSizeLabel = (size: number) => {
        if (size === 4) return "Pequeño (1/3)";
        if (size === 6) return "Mediano (1/2)";
        if (size === 8) return "Grande (2/3)";
        if (size === 12) return "Completo (1/1)";
        return "Ajustar tamaño";
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group h-full ${className}`}
        >
            {/* Action Bar - Only visible on hover */}
            <div className="absolute top-2 right-2 z-20 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Resize Button */}
                {onResize && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onResize();
                        }}
                        className="p-1.5 rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm transition-colors"
                        title={`Cambiar tamaño (Actual: ${getSizeLabel(currentSize || 4)})`}
                    >
                        <Maximize2 size={16} />
                    </button>
                )}

                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1.5 rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm"
                    title="Arrastrar para mover"
                >
                    <GripVertical size={16} />
                </div>
            </div>

            {/* Widget Content */}
            <div className="h-full">
                {children}
            </div>
        </div>
    );
};
