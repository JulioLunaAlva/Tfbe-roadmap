import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GitBranch, Plus, Trash2, X, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';

interface Initiative {
    id: string;
    name: string;
    area: string;
    status?: string;
    progress?: number;
}

interface Dependency {
    id: string;
    source_id: string;
    target_id: string;
    dependency_type: string;
    source_name: string;
    source_area: string;
    source_status: string;
    source_progress: number;
    target_name: string;
    target_area: string;
    target_status: string;
    target_progress: number;
}

interface NodePos {
    id: string;
    x: number;
    y: number;
    name: string;
    area: string;
    status: string;
    progress: number;
}

const getStatusFill = (status?: string) => {
    if (status === 'Entregado') return '#10b981';
    if (status === 'En curso' || status === 'Avance conforme plan') return '#3b82f6';
    if (status === 'Retrasado' || status === 'Atraso') return '#ef4444';
    if (status === 'En redefinición') return '#f59e0b';
    return '#6b7280';
};

const getAreaHue = (area: string) => {
    let hash = 0;
    for (let i = 0; i < area.length; i++) hash = area.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
};

export const DependencyMapPage = () => {
    const { token, user } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [depType, setDepType] = useState('blocks');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [dragNode, setDragNode] = useState<string | null>(null);
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
    const svgRef = useRef<SVGSVGElement>(null);

    const canEdit = user?.role === 'admin' || user?.role === 'editor';

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetch(`${API_URL}/api/initiatives?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/api/dependencies?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([inits, deps]) => {
            setInitiatives(Array.isArray(inits) ? inits : []);
            setDependencies(Array.isArray(deps) ? deps : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [token, year]);

    // Calculate node positions using simple force-directed layout
    const nodes = useMemo(() => {
        const involvedIds = new Set<string>();
        dependencies.forEach(d => {
            involvedIds.add(d.source_id);
            involvedIds.add(d.target_id);
        });

        const involved = initiatives.filter(i => involvedIds.has(i.id));
        if (involved.length === 0) return [];

        const width = 900;
        const height = 500;
        const positions: NodePos[] = [];

        // Group by area for initial placement
        const areaGroups = new Map<string, Initiative[]>();
        involved.forEach(i => {
            const area = i.area || 'Sin Área';
            if (!areaGroups.has(area)) areaGroups.set(area, []);
            areaGroups.get(area)!.push(i);
        });

        const areaKeys = Array.from(areaGroups.keys());
        const angleStep = (2 * Math.PI) / Math.max(areaKeys.length, 1);

        areaKeys.forEach((area, aIdx) => {
            const inits = areaGroups.get(area)!;
            const areaAngle = angleStep * aIdx;
            const areaRadius = Math.min(width, height) * 0.32;
            const centerX = width / 2 + Math.cos(areaAngle) * areaRadius;
            const centerY = height / 2 + Math.sin(areaAngle) * areaRadius;

            inits.forEach((init, iIdx) => {
                const subAngle = (2 * Math.PI * iIdx) / Math.max(inits.length, 1);
                const subRadius = 40 + inits.length * 12;
                const savedPos = nodePositions[init.id];

                positions.push({
                    id: init.id,
                    x: savedPos?.x ?? (centerX + Math.cos(subAngle) * subRadius),
                    y: savedPos?.y ?? (centerY + Math.sin(subAngle) * subRadius),
                    name: init.name,
                    area: init.area || 'Sin Área',
                    status: init.status || '',
                    progress: init.progress || 0,
                });
            });
        });

        return positions;
    }, [initiatives, dependencies, nodePositions]);

    const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        setDragNode(nodeId);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragNode || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setNodePositions(prev => ({ ...prev, [dragNode]: { x, y } }));
    }, [dragNode]);

    const handleMouseUp = useCallback(() => {
        setDragNode(null);
    }, []);

    const handleAddDependency = async () => {
        if (!sourceId || !targetId || sourceId === targetId) return;
        try {
            const res = await fetch(`${API_URL}/api/dependencies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ source_id: sourceId, target_id: targetId, dependency_type: depType }),
            });
            if (res.ok) {
                // Refresh
                const deps = await fetch(`${API_URL}/api/dependencies?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
                setDependencies(deps);
                setShowAddForm(false);
                setSourceId('');
                setTargetId('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteDependency = async (id: string) => {
        if (!confirm('¿Eliminar esta dependencia?')) return;
        try {
            await fetch(`${API_URL}/api/dependencies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            setDependencies(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const nodeMap = useMemo(() => {
        const map = new Map<string, NodePos>();
        nodes.forEach(n => map.set(n.id, n));
        return map;
    }, [nodes]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" /></div>;
    }

    const nodeRadius = 24;

    return (
        <div className="w-full px-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-lg">
                        <GitBranch size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Mapa de Dependencias</h2>
                        <p className="text-xs text-gray-400">
                            {nodes.length} iniciativas vinculadas · {dependencies.length} dependencias · {year}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {canEdit && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg text-xs font-bold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-md"
                        >
                            <Plus size={14} />
                            <span>Agregar Dependencia</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Graph Canvas */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-lg">
                {nodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                        <GitBranch size={40} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium">Sin dependencias registradas</p>
                        <p className="text-xs mt-1">Agrega dependencias entre iniciativas para visualizar el grafo</p>
                    </div>
                ) : (
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="500"
                        viewBox="0 0 900 500"
                        className="cursor-default select-none"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                            </marker>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Edges */}
                        {dependencies.map(dep => {
                            const source = nodeMap.get(dep.source_id);
                            const target = nodeMap.get(dep.target_id);
                            if (!source || !target) return null;

                            const dx = target.x - source.x;
                            const dy = target.y - source.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist === 0) return null;

                            const sx = source.x + (dx / dist) * nodeRadius;
                            const sy = source.y + (dy / dist) * nodeRadius;
                            const tx = target.x - (dx / dist) * (nodeRadius + 10);
                            const ty = target.y - (dy / dist) * (nodeRadius + 10);

                            // Curved line
                            const midX = (sx + tx) / 2;
                            const midY = (sy + ty) / 2;
                            const normalX = -(ty - sy) * 0.15;
                            const normalY = (tx - sx) * 0.15;

                            return (
                                <g key={dep.id} className="group">
                                    <path
                                        d={`M ${sx} ${sy} Q ${midX + normalX} ${midY + normalY} ${tx} ${ty}`}
                                        stroke="#6366f1"
                                        strokeWidth={selectedNode && (selectedNode === dep.source_id || selectedNode === dep.target_id) ? 3 : 1.5}
                                        fill="none"
                                        markerEnd="url(#arrowhead)"
                                        opacity={selectedNode ? (selectedNode === dep.source_id || selectedNode === dep.target_id ? 1 : 0.15) : 0.6}
                                        className="transition-all duration-200"
                                    />
                                    {/* Label */}
                                    <text
                                        x={midX + normalX}
                                        y={midY + normalY - 6}
                                        textAnchor="middle"
                                        className="text-[8px] fill-gray-400 pointer-events-none"
                                    >
                                        {dep.dependency_type === 'blocks' ? 'bloquea' : dep.dependency_type}
                                    </text>

                                    {/* Delete button on hover */}
                                    {canEdit && (
                                        <foreignObject x={midX + normalX - 8} y={midY + normalY - 20} width="16" height="16" className="opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => handleDeleteDependency(dep.id)}
                                                className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                                                title="Eliminar"
                                            >
                                                <X size={8} />
                                            </button>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {nodes.map(node => {
                            const fill = getStatusFill(node.status);
                            const hue = getAreaHue(node.area);
                            const isSelected = selectedNode === node.id;
                            const isConnected = selectedNode ? dependencies.some(d =>
                                (d.source_id === selectedNode && d.target_id === node.id) ||
                                (d.target_id === selectedNode && d.source_id === node.id)
                            ) || selectedNode === node.id : true;

                            return (
                                <g
                                    key={node.id}
                                    className={`cursor-grab ${dragNode === node.id ? 'cursor-grabbing' : ''}`}
                                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                                    onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                                    opacity={selectedNode && !isConnected ? 0.15 : 1}
                                >
                                    {/* Glow ring */}
                                    {isSelected && (
                                        <circle cx={node.x} cy={node.y} r={nodeRadius + 6} fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.5" filter="url(#glow)" />
                                    )}

                                    {/* Area ring */}
                                    <circle cx={node.x} cy={node.y} r={nodeRadius + 2} fill="none" stroke={`hsl(${hue}, 60%, 50%)`} strokeWidth="2" opacity="0.8" />

                                    {/* Main circle */}
                                    <circle cx={node.x} cy={node.y} r={nodeRadius} fill={fill} opacity="0.9" />

                                    {/* Progress arc */}
                                    {node.progress > 0 && node.progress < 100 && (
                                        <circle
                                            cx={node.x} cy={node.y} r={nodeRadius - 3}
                                            fill="none" stroke="white" strokeWidth="3"
                                            strokeDasharray={`${(node.progress / 100) * 2 * Math.PI * (nodeRadius - 3)} ${2 * Math.PI * (nodeRadius - 3)}`}
                                            transform={`rotate(-90, ${node.x}, ${node.y})`}
                                            opacity="0.5"
                                        />
                                    )}

                                    {/* Progress text */}
                                    <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-white pointer-events-none">
                                        {node.progress}%
                                    </text>

                                    {/* Name label */}
                                    <text x={node.x} y={node.y + nodeRadius + 14} textAnchor="middle" className="text-[9px] font-semibold fill-gray-600 dark:fill-gray-300 pointer-events-none">
                                        {node.name.length > 20 ? node.name.slice(0, 18) + '…' : node.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>

            {/* Dependencies List */}
            {dependencies.length > 0 && (
                <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center space-x-2">
                        <Link2 size={14} className="text-indigo-500" />
                        <span>Lista de Dependencias ({dependencies.length})</span>
                    </h3>
                    <div className="space-y-2">
                        {dependencies.map(dep => (
                            <div key={dep.id} className="group flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#111827] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
                                <div className="flex items-center space-x-2 text-xs min-w-0">
                                    <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{dep.source_name}</span>
                                    <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded text-[9px] font-bold flex-shrink-0">
                                        {dep.dependency_type === 'blocks' ? '→ bloquea →' : `→ ${dep.dependency_type} →`}
                                    </span>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{dep.target_name}</span>
                                </div>
                                {canEdit && (
                                    <button onClick={() => handleDeleteDependency(dep.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
                    <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Nueva Dependencia</h3>
                            <button onClick={() => setShowAddForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Iniciativa Origen</label>
                                <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none">
                                    <option value="">Seleccionar...</option>
                                    {initiatives.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Tipo de Dependencia</label>
                                <select value={depType} onChange={e => setDepType(e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none">
                                    <option value="blocks">Bloquea</option>
                                    <option value="requires">Requiere</option>
                                    <option value="relates">Se relaciona</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Iniciativa Destino</label>
                                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none">
                                    <option value="">Seleccionar...</option>
                                    {initiatives.filter(i => i.id !== sourceId).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs text-gray-500 rounded-lg border border-gray-200 dark:border-gray-700">Cancelar</button>
                            <button onClick={handleAddDependency} disabled={!sourceId || !targetId || sourceId === targetId} className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg disabled:opacity-40 transition-all">
                                Crear Dependencia
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
