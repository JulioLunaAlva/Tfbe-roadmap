import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
    initiativeId: string;
    phaseId: number;
    year: number;
    week: number;
    currentValue: number;
    currentComment: string;
    onSave: (value: number, comment: string) => Promise<void>;
    onClose: () => void;
}

export const ProgressEditPopover: React.FC<Props> = ({
    week, currentValue, currentComment, onSave, onClose
}) => {
    const [value, setValue] = useState(currentValue);
    const [comment, setComment] = useState(currentComment || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(value, comment);
        setSaving(false);
        onClose();
    };

    return (
        <div className="absolute z-50 bg-white shadow-xl border border-gray-200 rounded-md p-4 w-64 -mt-24 ml-2 max-w-xs">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-700">Semana {week}</h4>
                <button onClick={onClose}><X size={14} /></button>
            </div>

            <div className="space-y-3">

                {/* Status Selection */}
                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-xs font-semibold text-gray-700">Estado / Color</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            className={`p-2 text-xs rounded border ${value === 2 ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'} bg-yellow-400 text-black font-medium`}
                            onClick={() => setValue(2)}
                        >
                            D. Técnico
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 1 ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'} bg-gray-300 text-black font-medium`}
                            onClick={() => setValue(1)}
                        >
                            D. Funcional
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 3 ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'} bg-green-500 text-white font-medium`}
                            onClick={() => setValue(3)}
                        >
                            Conforme Plan
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 4 ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'} bg-red-600 text-white font-medium`}
                            onClick={() => setValue(4)}
                        >
                            Atraso
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 0 ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'} bg-white text-gray-500 col-span-2`}
                            onClick={() => setValue(0)}
                        >
                            Limpiar (Vacío)
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500">Comentario</label>
                    <textarea
                        className="w-full mt-1 border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-brand-red outline-none"
                        rows={2}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-brand-red text-white text-xs py-1.5 rounded font-medium hover:bg-brand-darkRed disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    );
};
