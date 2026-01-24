import React, { useEffect, useRef } from 'react';
import { Flag, Star, CheckCircle, Trash2 } from 'lucide-react';

interface Props {
    x: number;
    y: number;
    onClose: () => void;
    onSelect: (type: string) => void;
    onDelete?: () => void; // If clicking an existing marker
    hasExisting?: boolean;
}

export const MilestoneContextMenu: React.FC<Props> = ({ x, y, onClose, onSelect, onDelete, hasExisting }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Adjust position if close to edge (simple check)
    const style = {
        top: y,
        left: x,
    };

    return (
        <div
            ref={ref}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48 text-sm"
            style={style}
        >
            <div className="px-3 py-1 text-xs font-bold text-gray-500 uppercase border-b border-gray-100 mb-1">
                Agregar Hito
            </div>

            <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
                onClick={() => onSelect('flag')}
            >
                <Flag size={14} className="text-gray-600 fill-current" />
                <span>Fecha Original</span>
            </button>

            <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
                onClick={() => onSelect('check')}
            >
                <CheckCircle size={14} className="text-green-600" />
                <span>Fecha Entrega</span>
            </button>

            <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
                onClick={() => onSelect('star')}
            >
                <Star size={14} className="text-yellow-500 fill-current" />
                <span>Fecha Champion</span>
            </button>

            {hasExisting && onDelete && (
                <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                        onClick={onDelete}
                    >
                        <Trash2 size={14} />
                        <span>Eliminar Hito</span>
                    </button>
                </>
            )}
        </div>
    );
};
