import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
    initiativeId: string;
    phaseId: number;
    year: number;
    weeks: number[];
    onSave: (value: number, comment: string) => Promise<void>;
    onClose: () => void;
}

export const BulkProgressEditPopover: React.FC<Props> = ({
    weeks, onSave, onClose
}) => {
    // Default to empty value since we are mass editing
    const [value, setValue] = useState(0);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(value, comment);
        setSaving(false);
        onClose();
    };

    return (
        <div className="absolute z-50 bg-white shadow-xl border border-gray-200 rounded-md p-4 w-64 -mt-24 ml-2 max-w-xs dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">Varias Semanas ({weeks.length})</h4>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><X size={14} /></button>
            </div>

            <div className="space-y-3">

                {/* Status Selection */}
                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Aplicar Estado / Color a Todas</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            className={`p-2 text-xs rounded border ${value === 2 ? 'ring-2 ring-blue-500 border-transparent dark:ring-blue-400' : 'border-gray-200 dark:border-gray-600'} bg-yellow-400 text-black font-medium`}
                            onClick={() => setValue(2)}
                        >
                            D. Técnico
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 1 ? 'ring-2 ring-blue-500 border-transparent dark:ring-blue-400' : 'border-gray-200 dark:border-gray-600'} bg-gray-300 text-black font-medium`}
                            onClick={() => setValue(1)}
                        >
                            D. Funcional
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 3 ? 'ring-2 ring-blue-500 border-transparent dark:ring-blue-400' : 'border-gray-200 dark:border-gray-600'} bg-green-500 text-white font-medium`}
                            onClick={() => setValue(3)}
                        >
                            Conforme Plan
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 4 ? 'ring-2 ring-blue-500 border-transparent dark:ring-blue-400' : 'border-gray-200 dark:border-gray-600'} bg-red-600 text-white font-medium`}
                            onClick={() => setValue(4)}
                        >
                            Atraso
                        </button>
                        <button
                            className={`p-2 text-xs rounded border ${value === 0 ? 'ring-2 ring-blue-500 border-transparent dark:ring-blue-400' : 'border-gray-200 dark:border-gray-600'} bg-[var(--bg-primary)] text-[var(--text-secondary)] col-span-2`}
                            onClick={() => setValue(0)}
                        >
                            Limpiar (Vacío)
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Comentario para Todas</label>
                    <textarea
                        className="w-full mt-1 border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-brand-red outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={2}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="(Opcional)"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-brand-red text-white text-xs py-1.5 rounded font-medium hover:bg-brand-darkRed disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Guardando...' : 'Guardar Todo'}
                </button>
            </div>
        </div>
    );
};
