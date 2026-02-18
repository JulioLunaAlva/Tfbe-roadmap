
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export const SortableWidget = ({ id, children, className }: SortableWidgetProps) => {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group h-full ${className}`}
        >
            {/* Drag Handle - Only visible on hover */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm"
                title="Arrastrar para mover"
            >
                <GripVertical size={16} />
            </div>

            {/* Widget Content */}
            <div className="h-full">
                {children}
            </div>
        </div>
    );
};
