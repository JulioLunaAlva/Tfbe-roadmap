import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import API_URL from '../config/api';

export const ImportPage = () => {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ message: string, count?: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/import`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
                setFile(null);
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (e) {
            setError('Network error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Importar Iniciativas</h2>
                <p className="text-gray-500 dark:text-gray-400">Sube el archivo CSV/Excel para actualizar o crear iniciativas masivamente.</p>
                <div className="mt-4">
                    <a
                        href="/plantilla_carga_masiva.csv"
                        download
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium underline flex items-center"
                    >
                        <FileSpreadsheet size={16} className="mr-1" />
                        Descargar Plantilla de Ejemplo (.csv)
                    </a>
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <FileSpreadsheet className="text-indigo-600 w-8 h-8" />
                    </div>
                </div>

                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                />

                {!file ? (
                    <label
                        htmlFor="excel-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Upload className="mr-2 w-4 h-4" />
                        Seleccionar Archivo
                    </label>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {uploading ? 'Procesando...' : 'Iniciar Importación'}
                        </button>
                    </div>
                )}
            </div>

            {result && (
                <div className="bg-green-50 p-4 rounded-md border border-green-200 flex items-start">
                    <CheckCircle className="text-green-500 w-5 h-5 mr-3 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-green-800">Importación Exitosa</h4>
                        <p className="text-sm text-green-700">{result.message}. Procesados: {result.count}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200 flex items-start">
                    <AlertCircle className="text-red-500 w-5 h-5 mr-3 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-800">Error</h4>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
