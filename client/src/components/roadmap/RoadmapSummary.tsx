import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

export const RoadmapSummary = () => {
    const { token } = useAuth();
    const [initiatives, setInitiatives] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/api/initiatives`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => Array.isArray(data) ? setInitiatives(data) : setInitiatives([]))
            .catch(console.error);
    }, [token]);

    // Calculate Stats
    const total = initiatives.length;

    // Calculate area counts
    const byArea = initiatives.reduce((acc, curr) => {
        const a = curr.area || 'Sin Área';
        acc[a] = (acc[a] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 text-sm mb-6">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Total Box */}
                <div className="flex flex-col justify-center items-center bg-brand-gray p-4 rounded w-32 border border-gray-300">
                    <span className="text-3xl font-bold text-brand-red">{total}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Total</span>
                </div>

                {/* Area Counts Grid */}
                <div className="flex-1">
                    <h4 className="font-bold text-gray-700 mb-2 border-b pb-1 uppercase text-xs">Iniciativas Por Área</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                        {Object.entries(byArea).map(([area, count]) => (
                            <div key={area} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                                <span className="text-gray-600 truncate mr-2" title={area}>{area}</span>
                                <span className="font-bold text-brand-black">{String(count)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
