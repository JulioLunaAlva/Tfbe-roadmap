import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Brain, ZoomIn, ZoomOut, Maximize2, Filter, Sparkles, Loader2, X, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { AiInsightDrawer } from '../components/ai/AiInsightDrawer';
import API_URL from '../config/api';

// ── Types ─────────────────────────────────────────────────
type NodeType = 'initiative' | 'okr' | 'technology' | 'risk' | 'champion';

interface GraphNode {
    id: string;
    label: string;
    type: NodeType;
    x: number;
    y: number;
    meta?: Record<string, any>;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    edgeType: 'dependency' | 'okr_link' | 'tech_link' | 'risk_link' | 'champion_link';
}

interface GeminiGraphInsight {
    clusters_detectados: { nombre: string; tipo: string; iniciativas_afectadas: string[]; descripcion: string; accion_sugerida: string }[];
    nodos_criticos: string[];
    gaps_estrategicos: string[];
    salud_del_grafo: string;
    insight_principal: string;
}

// ── Constants ──────────────────────────────────────────────
const NODE_CONFIG: Record<NodeType, { color: string; glow: string; radius: number; shape: 'circle' | 'diamond' | 'square' }> = {
    initiative: { color: '#3B82F6', glow: '#3B82F655', radius: 22, shape: 'circle' },
    okr: { color: '#93C5FD', glow: '#93C5FD44', radius: 16, shape: 'diamond' },
    technology: { color: '#06B6D4', glow: '#06B6D433', radius: 11, shape: 'circle' },
    risk: { color: '#F97316', glow: '#F9731633', radius: 10, shape: 'circle' },
    champion: { color: '#A78BFA', glow: '#A78BFA33', radius: 13, shape: 'circle' },
};

const EDGE_CONFIG: Record<string, { stroke: string; opacity: number; dash: string }> = {
    dependency: { stroke: '#E2E8F0', opacity: 0.35, dash: 'none' },
    okr_link: { stroke: '#3B82F6', opacity: 0.3, dash: '4 3' },
    tech_link: { stroke: '#06B6D4', opacity: 0.22, dash: '2 4' },
    risk_link: { stroke: '#F97316', opacity: 0.4, dash: '3 3' },
    champion_link: { stroke: '#A78BFA', opacity: 0.25, dash: '4 3' },
};

const STATUS_COLORS: Record<string, string> = {
    'Entregado': '#22C55E',
    'En curso': '#3B82F6',
    'Avance conforme plan': '#3B82F6',
    'Retrasado': '#EF4444',
    'Atraso': '#EF4444',
    'En redefinición': '#F59E0B',
};

// ── Helpers ────────────────────────────────────────────────
function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function buildGraph(initiatives: any[], dependencies: any[], okrs: any[], risks: any[], technologies: any[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const W = 1000, H = 700;
    const cx = W / 2, cy = H / 2;

    // ── Initiative nodes (in a rough circle) ──
    initiatives.forEach((ini, i) => {
        const angle = (2 * Math.PI * i) / Math.max(initiatives.length, 1) - Math.PI / 2;
        const r = 180 + Math.random() * 80;
        nodes.push({
            id: `ini-${ini.id}`,
            label: ini.name,
            type: 'initiative',
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            meta: { ...ini, originalId: ini.id },
            edgeCount: 0
        });
    });

    // ── OKR nodes (inner ring) ──
    okrs.forEach((okr, i) => {
        const angle = (2 * Math.PI * i) / Math.max(okrs.length, 1);
        nodes.push({
            id: `okr-${okr.id}`,
            label: okr.title,
            type: 'okr',
            x: cx + Math.cos(angle) * 90,
            y: cy + Math.sin(angle) * 90,
            meta: okr,
            edgeCount: 0
        });
    });

    // ── Technology nodes (outer) ──
    const techMap = new Map<string, string>();
    technologies.forEach((t, i) => {
        const id = `tech-${t.technology_id || i}`;
        if (!techMap.has(t.name)) {
            techMap.set(t.name, id);
            nodes.push({
                id,
                label: t.name,
                type: 'technology',
                x: randomInRange(50, W - 50),
                y: randomInRange(50, H - 50),
                meta: t,
                edgeCount: 0
            });
        }
    });

    // ── Risk nodes (near their initiative) ──
    risks.forEach((risk, i) => {
        const iniNode = nodes.find(n => n.type === 'initiative' && n.meta?.originalId === risk.initiative_id);
        const baseX = iniNode ? iniNode.x + randomInRange(-60, 60) : randomInRange(100, W - 100);
        const baseY = iniNode ? iniNode.y + randomInRange(-60, 60) : randomInRange(100, H - 100);
        const nodeId = `risk-${risk.id || i}`;
        nodes.push({
            id: nodeId,
            label: risk.title || 'Riesgo',
            type: 'risk',
            x: baseX,
            y: baseY,
            meta: risk,
            edgeCount: 1
        });
        if (iniNode) {
            edges.push({ id: `e-risk-${i}`, source: nodeId, target: iniNode.id, edgeType: 'risk_link' });
            iniNode.edgeCount = (iniNode.edgeCount || 0) + 1;
        }
    });

    // ── Champion nodes ──
    const champMap = new Map<string, string>();
    initiatives.forEach((ini) => {
        if (!ini.champion) return;
        if (!champMap.has(ini.champion)) {
            const id = `champ-${ini.champion.replace(/\s+/g, '_')}`;
            champMap.set(ini.champion, id);
            nodes.push({
                id,
                label: ini.champion,
                type: 'champion',
                x: randomInRange(80, W - 80),
                y: randomInRange(80, H - 80),
                meta: { champion: ini.champion },
                edgeCount: 0
            });
        }
        const champId = champMap.get(ini.champion)!;
        const iniNode = nodes.find(n => n.id === `ini-${ini.id}`);
        if (iniNode) {
            edges.push({ id: `e-champ-${ini.id}`, source: champId, target: iniNode.id, edgeType: 'champion_link' });
            iniNode.edgeCount = (iniNode.edgeCount || 0) + 1;
            const champNode = nodes.find(n => n.id === champId);
            if (champNode) champNode.edgeCount = (champNode.edgeCount || 0) + 1;
        }
    });

    // ── Dependency edges ──
    dependencies.forEach((dep, i) => {
        edges.push({
            id: `e-dep-${i}`,
            source: `ini-${dep.source_id}`,
            target: `ini-${dep.target_id}`,
            edgeType: 'dependency',
        });
        const n1 = nodes.find(n => n.id === `ini-${dep.source_id}`);
        const n2 = nodes.find(n => n.id === `ini-${dep.target_id}`);
        if(n1) n1.edgeCount = (n1.edgeCount || 0) + 1;
        if(n2) n2.edgeCount = (n2.edgeCount || 0) + 1;
    });

    // ── OKR edges ──
    okrs.forEach((okr) => {
        (okr.initiatives || []).forEach((iniId: string) => {
            const iniNode = nodes.find(n => n.id === `ini-${iniId}`);
            if (iniNode) {
                edges.push({ id: `e-okr-${okr.id}-${iniId}`, source: `okr-${okr.id}`, target: iniNode.id, edgeType: 'okr_link' });
                iniNode.edgeCount = (iniNode.edgeCount || 0) + 1;
                const okrNode = nodes.find(n => n.id === `okr-${okr.id}`);
                if (okrNode) okrNode.edgeCount = (okrNode.edgeCount || 0) + 1;
            }
        });
    });

    // ── Tech edges ──
    technologies.forEach((t, i) => {
        const techId = techMap.get(t.name);
        const iniNode = nodes.find(n => n.id === `ini-${t.initiative_id}`);
        if (techId && iniNode) {
            edges.push({ id: `e-tech-${i}`, source: techId, target: iniNode.id, edgeType: 'tech_link' });
            iniNode.edgeCount = (iniNode.edgeCount || 0) + 1;
            const tNode = nodes.find(n => n.id === techId);
            if(tNode) tNode.edgeCount = (tNode.edgeCount || 0) + 1;
        }
    });

    return { nodes, edges };
}

// ── Main Component ─────────────────────────────────────────
export const KnowledgeGraphPage = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const svgRef = useRef<SVGSVGElement>(null);

    // Data
    const [initiatives, setInitiatives] = useState<any[]>([]);
    const [dependencies, setDependencies] = useState<any[]>([]);
    const [okrs, setOkrs] = useState<any[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [technologies, setTechnologies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Graph state
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Filters & Search
    const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(new Set(['initiative', 'okr', 'technology', 'risk', 'champion']));
    const [searchQuery, setSearchQuery] = useState('');

    // AI
    const [aiLoading, setAiLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<GeminiGraphInsight | null>(null);
    const [aiMode, setAiMode] = useState(false);
    const [selectedInitiativeForDrawer, setSelectedInitiativeForDrawer] = useState<any | null>(null);

    // Load data
    useEffect(() => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`${API_URL}/api/initiatives?year=${year}`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/api/dependencies?year=${year}`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/api/okrs?year=${year}`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/api/risks?year=${year}`, { headers }).then(r => r.json()),
        ]).then(([inits, deps, okrData, riskData]) => {
            const safeInits = Array.isArray(inits) ? inits : [];
            setInitiatives(safeInits);
            setDependencies(Array.isArray(deps) ? deps : []);
            // Attach initiative IDs to OKRs from initiatives' okrs field
            const okrList = Array.isArray(okrData) ? okrData : [];
            const enrichedOkrs = okrList.map((okr: any) => ({
                ...okr,
                initiatives: safeInits.filter((i: any) => i.okrs?.some((o: any) => o.id === okr.id)).map((i: any) => i.id),
            }));
            setOkrs(enrichedOkrs);
            setRisks(Array.isArray(riskData) ? riskData.slice(0, 15) : []);
            // Extract technologies from initiatives
            const techs: any[] = [];
            safeInits.forEach((ini: any) => {
                (ini.technologies || []).forEach((techName: string) => {
                    techs.push({ name: techName, initiative_id: ini.id });
                });
            });
            setTechnologies(techs);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [token, year]);

    // Build graph
    const { nodes: baseNodes, edges } = useMemo(
        () => buildGraph(initiatives, dependencies, okrs, risks, technologies),
        [initiatives, dependencies, okrs, risks, technologies]
    );

    // Apply saved positions
    const nodes = useMemo(() => baseNodes.map(n => ({
        ...n,
        x: nodePositions[n.id]?.x ?? n.x,
        y: nodePositions[n.id]?.y ?? n.y,
    })), [baseNodes, nodePositions]);

    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

    // Filter nodes/edges
    const visibleNodes = useMemo(() => nodes.filter(n => visibleTypes.has(n.type)), [nodes, visibleTypes]);
    const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
    const visibleEdges = useMemo(() => edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)), [edges, visibleNodeIds]);

    // Selected node connections & Search highlights
    const connectedIds = useMemo(() => {
        if (!selectedNodeId) return new Set<string>();
        const connected = new Set<string>([selectedNodeId]);
        visibleEdges.forEach(e => {
            if (e.source === selectedNodeId) connected.add(e.target);
            if (e.target === selectedNodeId) connected.add(e.source);
        });
        return connected;
    }, [selectedNodeId, visibleEdges]);

    const searchHighlightedIds = useMemo(() => {
        if (!searchQuery.trim()) return new Set<string>();
        const q = searchQuery.toLowerCase();
        return new Set(nodes.filter(n => n.label.toLowerCase().includes(q) || (n.meta?.champion && n.meta.champion.toLowerCase().includes(q))).map(n => n.id));
    }, [searchQuery, nodes]);

    // AI highlighted nodes
    const aiHighlightedIds = useMemo(() => {
        if (!aiInsights || !aiMode) return new Set<string>();
        const names = new Set([...aiInsights.nodos_criticos, ...(aiInsights.clusters_detectados?.[0]?.iniciativas_afectadas || [])]);
        const ids = new Set<string>();
        nodes.forEach(n => { if (names.has(n.label)) ids.add(n.id); });
        return ids;
    }, [aiInsights, aiMode, nodes]);

    // Drag
    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingId(nodeId);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (draggingId && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;
            setNodePositions(prev => ({ ...prev, [draggingId]: { x, y } }));
        } else if (isPanning) {
            setPan(prev => ({
                x: prev.x + (e.clientX - panStart.x),
                y: prev.y + (e.clientY - panStart.y),
            }));
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    }, [draggingId, isPanning, pan, panStart, zoom]);

    const handleMouseUp = useCallback(() => {
        setDraggingId(null);
        setIsPanning(false);
    }, []);

    const handleSvgMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect') {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            setSelectedNodeId(null);
        }
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(prev => Math.min(3, Math.max(0.3, prev - e.deltaY * 0.001)));
    }, []);

    // Fetch AI graph insights
    const fetchAiInsights = async () => {
        setAiLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ai/graph-insights?year=${year}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error');
            const data = await res.json();
            setAiInsights(data.insights);
            setAiMode(true);
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    const toggleAiMode = () => {
        if (!aiMode && !aiInsights) {
            fetchAiInsights();
        } else {
            setAiMode(!aiMode);
        }
    };

    const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

    const toggleType = (type: NodeType) => {
        setVisibleTypes(prev => {
            const next = new Set(prev);
            next.has(type) ? next.delete(type) : next.add(type);
            return next;
        });
    };

    const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <Loader2 size={28} className="animate-spin text-[#E10600]" />
                <p className="text-sm text-[var(--text-tertiary)]">Construyendo grafo de conocimiento...</p>
            </div>
        );
    }

    const LEGEND: { type: NodeType; label: string }[] = [
        { type: 'initiative', label: 'Iniciativa' },
        { type: 'okr', label: 'OKR' },
        { type: 'technology', label: 'Tecnología' },
        { type: 'risk', label: 'Riesgo' },
        { type: 'champion', label: 'Champion' },
    ];

    return (
        <div className="relative w-full" style={{ height: 'calc(100vh - 100px)' }}>

            {/* ── Top Controls ── */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 shadow-xl">
                <GitBranch size={14} className="text-[var(--text-tertiary)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)] mr-1">Grafo de Conocimiento</span>
                <div className="h-4 w-px bg-[var(--border-color)]" />
                
                {/* Search */}
                <div className="relative flex items-center">
                    <Search size={12} className="absolute left-2 text-[var(--text-tertiary)]" />
                    <input 
                        type="text" 
                        placeholder="Buscar nodo..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-white rounded-lg pl-6 pr-2 py-1 w-32 focus:w-48 transition-all outline-none"
                    />
                </div>
                <div className="h-4 w-px bg-[var(--border-color)]" />

                {LEGEND.map(({ type, label }) => (
                    <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={clsx(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                            visibleTypes.has(type)
                                ? 'text-white'
                                : 'bg-transparent text-gray-600 opacity-40'
                        )}
                        style={visibleTypes.has(type) ? { backgroundColor: NODE_CONFIG[type].color + '33', color: NODE_CONFIG[type].color } : {}}
                    >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: NODE_CONFIG[type].color }} />
                        {label}
                    </button>
                ))}
                <div className="h-4 w-px bg-[var(--border-color)]" />
                <button
                    onClick={toggleAiMode}
                    disabled={aiLoading}
                    className={clsx(
                        'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                        aiMode ? 'bg-[#E10600] text-white shadow-lg shadow-red-900/30' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                    )}
                >
                    {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
                    Modo IA
                </button>
            </div>

            {/* ── AI Insight Bubble (top right) ── */}
            {aiMode && aiInsights && (
                <div className="absolute top-3 right-3 z-20 w-64 bg-[var(--bg-secondary)] border border-[#E10600]/30 rounded-xl p-3 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-[#E10600]" />
                            <span className="text-[11px] text-gray-400 font-medium">Gemini detectó:</span>
                        </div>
                        <button onClick={() => setAiMode(false)} className="text-gray-600 hover:text-gray-300">
                            <X size={12} />
                        </button>
                    </div>
                    <p className="text-xs text-white font-medium leading-snug mb-2">{aiInsights.insight_principal}</p>
                    {aiInsights.clusters_detectados?.slice(0, 1).map((c, i) => (
                        <div key={i} className={clsx('text-[11px] px-2 py-1 rounded-lg mt-1', c.tipo === 'riesgo' ? 'bg-red-500/15 text-red-300' : 'bg-blue-500/15 text-blue-300')}>
                            🔍 {c.nombre}
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[11px] text-gray-500">Salud del grafo: </span>
                        <span className={clsx('text-[11px] font-semibold', aiInsights.salud_del_grafo === 'buena' ? 'text-green-400' : aiInsights.salud_del_grafo === 'moderada' ? 'text-amber-400' : 'text-red-400')}>
                            {aiInsights.salud_del_grafo}
                        </span>
                    </div>
                </div>
            )}

            {/* ── SVG Canvas ── */}
            <svg
                ref={svgRef}
                className="w-full h-full bg-[#080B0F] rounded-xl border border-[var(--border-color)] cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseDown={handleSvgMouseDown}
                onWheel={handleWheel}
                style={{ userSelect: 'none' }}
            >
                <style>
                    {`
                        @keyframes flowDash {
                            to { stroke-dashoffset: -20; }
                        }
                        .edge-flow {
                            animation: flowDash 1s linear infinite;
                        }
                        .edge-flow-slow {
                            animation: flowDash 2.5s linear infinite;
                        }
                    `}
                </style>
                <defs>
                    {Object.entries(NODE_CONFIG).map(([type, _cfg]) => (
                        <filter key={type} id={`glow-${type}`}>
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    ))}
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.2)" />
                    </marker>
                </defs>

                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                    {/* Edges */}
                    {visibleEdges.map(edge => {
                        const src = nodeMap.get(edge.source);
                        const tgt = nodeMap.get(edge.target);
                        if (!src || !tgt) return null;
                        const cfg = EDGE_CONFIG[edge.edgeType];
                        const isConnected = !selectedNodeId || connectedIds.has(edge.source) || connectedIds.has(edge.target);
                        return (
                            <line
                                key={edge.id}
                                x1={src.x} y1={src.y}
                                x2={tgt.x} y2={tgt.y}
                                stroke={cfg.stroke}
                                strokeOpacity={isConnected ? cfg.opacity : 0.04}
                                strokeWidth={edge.edgeType === 'dependency' ? 1.5 : 1}
                                strokeDasharray={cfg.dash === 'none' ? undefined : cfg.dash}
                                markerEnd={edge.edgeType === 'dependency' ? 'url(#arrow)' : undefined}
                                className={clsx("transition-all duration-300", isConnected && edge.edgeType !== 'dependency' ? "edge-flow-slow" : "")}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {visibleNodes.map(node => {
                        const cfg = NODE_CONFIG[node.type];
                        const isSelected = node.id === selectedNodeId;
                        const isConnected = (!selectedNodeId && !searchQuery) || connectedIds.has(node.id) || searchHighlightedIds.has(node.id);
                        const isAiHighlighted = aiMode && aiHighlightedIds.has(node.id);
                        const nodeColor = node.type === 'initiative' && node.meta?.status
                            ? (STATUS_COLORS[node.meta.status] || cfg.color)
                            : cfg.color;

                        const opacity = isConnected ? 1 : 0.15;
                        
                        // Dynamic sizing for champions based on edgeCount
                        let baseRadius = cfg.radius;
                        if (node.type === 'champion' && node.edgeCount) {
                            baseRadius = Math.min(cfg.radius * 2.5, cfg.radius + (node.edgeCount * 1.5));
                        }
                        
                        const r = isSelected || searchHighlightedIds.has(node.id) ? baseRadius * 1.4 : isAiHighlighted ? baseRadius * 1.2 : baseRadius;

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x},${node.y})`}
                                style={{ opacity, cursor: 'pointer', transition: 'opacity 0.3s' }}
                                onMouseDown={e => handleNodeMouseDown(e, node.id)}
                                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                            >
                                {/* Glow */}
                                <circle r={r + 6} fill={nodeColor} opacity={isSelected ? 0.3 : isAiHighlighted ? 0.2 : 0.08} filter={`url(#glow-${node.type})`} />

                                {/* AI pulse ring */}
                                {isAiHighlighted && (
                                    <circle r={r + 10} fill="none" stroke={nodeColor} strokeWidth={1.5} opacity={0.4} strokeDasharray="4 3" />
                                )}

                                {/* Selection ring */}
                                {isSelected && (
                                    <circle r={r + 8} fill="none" stroke={nodeColor} strokeWidth={2} opacity={0.8} />
                                )}

                                {/* Node body */}
                                {node.type === 'okr' ? (
                                    <polygon
                                        points={`0,${-r} ${r},0 0,${r} ${-r},0`}
                                        fill={nodeColor}
                                        fillOpacity={0.85}
                                        stroke={nodeColor}
                                        strokeWidth={1.5}
                                    />
                                ) : (
                                    <circle
                                        r={r}
                                        fill={nodeColor}
                                        fillOpacity={0.75}
                                        stroke={nodeColor}
                                        strokeWidth={isSelected ? 2 : 1}
                                    />
                                )}

                                {/* Risk icon */}
                                {node.type === 'risk' && (
                                    <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill="white">⚠</text>
                                )}

                                {/* Label */}
                                <text
                                    y={r + 12}
                                    textAnchor="middle"
                                    fontSize={node.type === 'initiative' ? 10 : 9}
                                    fontWeight={isSelected ? 700 : 400}
                                    fill={isSelected ? 'white' : 'rgba(255,255,255,0.65)'}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* ── Bottom Controls ── */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 shadow-xl">
                <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="p-1 hover:text-white text-[var(--text-tertiary)] transition-colors"><ZoomIn size={16} /></button>
                <span className="text-xs text-[var(--text-tertiary)] w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="p-1 hover:text-white text-[var(--text-tertiary)] transition-colors"><ZoomOut size={16} /></button>
                <div className="h-4 w-px bg-[var(--border-color)]" />
                <button onClick={resetView} className="p-1 hover:text-white text-[var(--text-tertiary)] transition-colors"><Maximize2 size={16} /></button>
                <div className="h-4 w-px bg-[var(--border-color)]" />
                <Filter size={13} className="text-[var(--text-tertiary)]" />
                <span className="text-[11px] text-[var(--text-tertiary)]">{visibleNodes.length} nodos · {visibleEdges.length} conexiones</span>
            </div>

            {/* ── Selected node floating card ── */}
            {selectedNode && (
                <div className="absolute bottom-4 right-4 z-20 w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 shadow-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: NODE_CONFIG[selectedNode.type].color }} />
                            <span className="text-[11px] text-[var(--text-tertiary)] capitalize">{selectedNode.type}</span>
                        </div>
                        <button onClick={() => setSelectedNodeId(null)} className="text-gray-600 hover:text-gray-300"><X size={13} /></button>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug mb-2">{selectedNode.label}</p>
                    {selectedNode.type === 'initiative' && selectedNode.meta && (
                        <div className="space-y-1 text-xs text-[var(--text-tertiary)]">
                            {selectedNode.meta.area && <p>Área: <span className="text-[var(--text-secondary)]">{selectedNode.meta.area}</span></p>}
                            {selectedNode.meta.champion && <p>Champion: <span className="text-[var(--text-secondary)]">{selectedNode.meta.champion}</span></p>}
                            {selectedNode.meta.complexity && <p>Complejidad: <span className="text-[var(--text-secondary)]">{selectedNode.meta.complexity}</span></p>}
                            <p>Conexiones: <span className="text-[var(--text-secondary)]">{connectedIds.size - 1}</span></p>
                        </div>
                    )}
                    {selectedNode.type === 'initiative' && (
                        <button
                            onClick={() => {
                                setSelectedInitiativeForDrawer({ id: selectedNode.meta?.originalId, name: selectedNode.label, area: selectedNode.meta?.area, champion: selectedNode.meta?.champion, complexity: selectedNode.meta?.complexity, is_top_priority: selectedNode.meta?.is_top_priority });
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E10600]/10 hover:bg-[#E10600]/20 text-[#E10600] rounded-lg text-xs font-medium transition-colors"
                        >
                            <Brain size={12} />
                            Ver análisis IA →
                        </button>
                    )}
                </div>
            )}

            {/* ── AI Insight Drawer ── */}
            {selectedInitiativeForDrawer && (
                <AiInsightDrawer
                    initiative={selectedInitiativeForDrawer}
                    onClose={() => setSelectedInitiativeForDrawer(null)}
                />
            )}
        </div>
    );
};
