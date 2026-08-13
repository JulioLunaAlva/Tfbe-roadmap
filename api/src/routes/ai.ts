import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware';
import { askGemini, extractJSON } from '../utils/gemini';

const router = Router();

// ─────────────────────────────────────────────
// POST /ai/insights/:initiativeId
// Deep analysis of a single initiative
// ─────────────────────────────────────────────
router.post('/insights/:initiativeId', authenticateToken, async (req: Request, res: Response) => {
    const { initiativeId } = req.params;

    try {
        // Gather all relevant data from DB in parallel
        const [initResult, risksResult, progressResult, tasksResult, depsResult] = await Promise.all([
            query(`
                SELECT i.*,
                  (SELECT json_agg(o.title) FROM initiative_okrs io JOIN okrs o ON io.okr_id = o.id WHERE io.initiative_id = i.id) as okrs,
                  (SELECT json_agg(t.name) FROM initiative_technologies it JOIN technologies t ON it.technology_id = t.id WHERE it.initiative_id = i.id) as technologies
                FROM initiatives i WHERE i.id = $1`, [initiativeId]),
            query(`SELECT title, severity, status FROM initiative_risks WHERE initiative_id = $1 AND status != 'closed'`, [initiativeId]),
            query(`SELECT week_number, year, progress_value, phase_id FROM weekly_progress WHERE initiative_id = $1 ORDER BY year DESC, week_number DESC LIMIT 10`, [initiativeId]),
            query(`SELECT title, status, due_date FROM planner_tasks WHERE initiative_id = $1 AND status != 'completed' LIMIT 10`, [initiativeId]),
            query(`SELECT d.dependency_type, i2.name as depends_on FROM initiative_dependencies d JOIN initiatives i2 ON d.target_id = i2.id WHERE d.source_id = $1`, [initiativeId]),
        ]);

        const ini = initResult.rows[0];
        if (!ini) return res.status(404).json({ error: 'Initiative not found' });

        const risks = risksResult.rows;
        const progress = progressResult.rows;
        const tasks = tasksResult.rows;
        const deps = depsResult.rows;

        // Calculate average progress of last 4 weeks
        const recentProgress = progress.slice(0, 4);
        const avgProgress = recentProgress.length > 0
            ? Math.round(recentProgress.reduce((s: number, p: any) => s + (p.progress_value || 0), 0) / recentProgress.length)
            : 0;

        const prompt = `
Eres el Cerebro Digital del portafolio de proyectos de TFBE (Transformación Finanzas / BE & D&A).
Analiza esta iniciativa con datos reales y genera un diagnóstico ejecutivo en español.
Sé directo, concreto y accionable. No uses frases genéricas.

═══════════════════════════════════════
INICIATIVA
═══════════════════════════════════════
Nombre: ${ini.name}
Área: ${ini.area}
Champion: ${ini.champion || 'No asignado'}
Complejidad: ${ini.complexity || 'No definida'}
Prioridad Alta: ${ini.is_top_priority ? 'SÍ' : 'NO'}
OKRs alineados: ${JSON.stringify(ini.okrs) || 'Ninguno'}
Tecnologías: ${JSON.stringify(ini.technologies) || 'No especificadas'}

═══════════════════════════════════════
PROGRESO (últimas 10 semanas)
═══════════════════════════════════════
${progress.map((p: any) => `  Semana ${p.week_number}/${p.year}: ${p.progress_value}%`).join('\n') || '  Sin registros de progreso'}
Promedio últimas 4 semanas: ${avgProgress}%

═══════════════════════════════════════
RIESGOS ABIERTOS (${risks.length})
═══════════════════════════════════════
${risks.map((r: any) => `  - ${r.title} | Severidad: ${r.severity}`).join('\n') || '  Sin riesgos abiertos'}

═══════════════════════════════════════
TAREAS PENDIENTES (${tasks.length})
═══════════════════════════════════════
${tasks.slice(0, 5).map((t: any) => `  - ${t.title} | Vence: ${t.due_date ? new Date(t.due_date).toLocaleDateString('es-MX') : 'Sin fecha'}`).join('\n') || '  Sin tareas pendientes'}

═══════════════════════════════════════
DEPENDENCIAS
═══════════════════════════════════════
${deps.map((d: any) => `  - Depende de: ${d.depends_on} (${d.dependency_type})`).join('\n') || '  Sin dependencias registradas'}

═══════════════════════════════════════
INSTRUCCIONES DE RESPUESTA
═══════════════════════════════════════
Responde ÚNICAMENTE con un objeto JSON válido. No agregues explicaciones fuera del JSON.
Usa el siguiente formato exacto:

{
  "estado": "saludable | en_curso | en_riesgo | bloqueado | critico",
  "semaforo": "verde | amarillo | rojo",
  "confianza": 87,
  "resumen": "Análisis ejecutivo de 2-3 oraciones. Menciona datos concretos como semanas, porcentajes, riesgos específicos.",
  "alertas": [
    {
      "nivel": "critica | alta | media",
      "titulo": "Título corto de la alerta",
      "detalle": "Explicación con datos concretos del problema"
    }
  ],
  "recomendaciones": [
    {
      "prioridad": 1,
      "accion": "Acción concreta a tomar",
      "responsable": "Rol o persona responsable",
      "plazo": "Inmediato | Esta semana | Próximas 2 semanas"
    }
  ],
  "prediccion": "Qué pasará si no se actúa en los próximos 14 días, con impacto en OKRs si aplica.",
  "patron_detectado": "Nombre del patrón si aplica: Bloqueo Sistémico | Deuda Técnica Acumulada | Subdimensionamiento | Champion Sobrecargado | Ninguno"
}
`;

        const raw = await askGemini(prompt);
        const insights = extractJSON<any>(raw);

        res.json({
            initiative_id: initiativeId,
            initiative_name: ini.name,
            insights,
            data_used: {
                weeks_analyzed: progress.length,
                open_risks: risks.length,
                pending_tasks: tasks.length,
                dependencies: deps.length,
                avg_progress_4wk: avgProgress,
            },
            generated_at: new Date().toISOString(),
        });

    } catch (err: any) {
        console.error('[AI] /insights error:', err.message);
        res.status(500).json({ error: 'AI analysis failed', detail: err.message });
    }
});


// ─────────────────────────────────────────────
// GET /ai/portfolio-summary
// Executive summary of the entire portfolio
// ─────────────────────────────────────────────
router.get('/portfolio-summary', authenticateToken, async (req: Request, res: Response) => {
    const year = req.query.year || new Date().getFullYear();

    try {
        const [initsResult, okrsResult, risksResult, progressResult] = await Promise.all([
            query(`SELECT name, area, complexity, is_top_priority, champion FROM initiatives WHERE year = $1 ORDER BY is_top_priority DESC`, [year]),
            query(`SELECT title FROM okrs WHERE year = $1`, [year]),
            query(`SELECT COUNT(*) as total FROM initiative_risks WHERE status = 'open'`),
            query(`
                SELECT AVG(wp.progress_value) as avg_progress
                FROM weekly_progress wp
                JOIN initiatives i ON wp.initiative_id = i.id
                WHERE i.year = $1
                AND wp.week_number = (SELECT MAX(week_number) FROM weekly_progress WHERE year = $1)
                AND wp.year = $1`, [year]),
        ]);

        const initiatives = initsResult.rows;
        const okrs = okrsResult.rows;
        const openRisks = parseInt(risksResult.rows[0]?.total || '0');
        const avgProgress = Math.round(progressResult.rows[0]?.avg_progress || 0);
        const topPriority = initiatives.filter((i: any) => i.is_top_priority);
        const areas = [...new Set(initiatives.map((i: any) => i.area))];

        const prompt = `
Eres el Cerebro Digital del portafolio TFBE.
Genera un resumen ejecutivo del portafolio ${year} para presentar a directivos.
Sé conciso, directo y ejecutivo. Usa datos concretos.

DATOS DEL PORTAFOLIO ${year}:
- Total iniciativas: ${initiatives.length}
- Áreas: ${areas.join(', ')}
- Iniciativas top priority: ${topPriority.map((i: any) => i.name).join(', ') || 'Ninguna'}
- OKRs del año: ${okrs.map((o: any) => o.title).join(' | ') || 'Sin OKRs definidos'}
- Riesgos abiertos: ${openRisks}
- Progreso promedio del portafolio: ${avgProgress}%

Responde con JSON:
{
  "titulo": "Título ejecutivo del reporte",
  "semaforo_portfolio": "verde | amarillo | rojo",
  "avance_general": ${avgProgress},
  "resumen_ejecutivo": "3-4 oraciones ejecutivas sobre el estado del portafolio",
  "puntos_criticos": ["punto 1", "punto 2", "punto 3"],
  "logros_destacados": ["logro 1", "logro 2"],
  "next_steps": ["acción 1", "acción 2", "acción 3"],
  "mensaje_al_equipo": "Mensaje motivacional corto y directo de 1 oración"
}
`;

        const raw = await askGemini(prompt);
        const summary = extractJSON<any>(raw);

        res.json({
            year,
            portfolio_stats: {
                total_initiatives: initiatives.length,
                top_priority_count: topPriority.length,
                open_risks: openRisks,
                avg_progress: avgProgress,
                areas_count: areas.length,
            },
            summary,
            generated_at: new Date().toISOString(),
        });

    } catch (err: any) {
        console.error('[AI] /portfolio-summary error:', err.message);
        res.status(500).json({ error: 'Portfolio summary failed', detail: err.message });
    }
});


// ─────────────────────────────────────────────
// GET /ai/graph-insights
// Analyze the full knowledge graph for clusters, gaps, and patterns
// ─────────────────────────────────────────────
router.get('/graph-insights', authenticateToken, async (req: Request, res: Response) => {
    const year = req.query.year || new Date().getFullYear();

    try {
        const [initsResult, okrLinksResult, risksResult, depsResult, techResult] = await Promise.all([
            query(`SELECT id, name, area, complexity, is_top_priority, champion FROM initiatives WHERE year = $1`, [year]),
            query(`
                SELECT i.id, i.name, COUNT(io.okr_id) as okr_count
                FROM initiatives i
                LEFT JOIN initiative_okrs io ON i.id = io.initiative_id
                WHERE i.year = $1
                GROUP BY i.id, i.name`, [year]),
            query(`
                SELECT initiative_id, COUNT(*) as risk_count
                FROM initiative_risks WHERE status = 'open'
                GROUP BY initiative_id`),
            query(`SELECT source_id, target_id FROM initiative_dependencies`),
            query(`
                SELECT it.initiative_id, t.name as tech
                FROM initiative_technologies it JOIN technologies t ON it.technology_id = t.id`),
        ]);

        const initiatives = initsResult.rows;
        const okrLinks = okrLinksResult.rows;
        const risks = risksResult.rows;
        const deps = depsResult.rows;
        const techs = techResult.rows;

        // Find initiatives with no OKR alignment
        const noOkr = okrLinks.filter((i: any) => parseInt(i.okr_count) === 0).map((i: any) => i.name);
        // Find initiatives with multiple risks
        const highRisk = risks.filter((r: any) => parseInt(r.risk_count) >= 2).map((r: any) => r.initiative_id);
        const highRiskNames = initiatives.filter((i: any) => highRisk.includes(i.id)).map((i: any) => i.name);
        // Find champions managing many initiatives
        const championLoad: Record<string, number> = {};
        initiatives.forEach((i: any) => {
            if (i.champion) championLoad[i.champion] = (championLoad[i.champion] || 0) + 1;
        });
        const overloadedChampions = Object.entries(championLoad).filter(([, count]) => count >= 3).map(([name]) => name);

        const prompt = `
Eres el Cerebro Digital TFBE analizando el grafo de conocimiento del portafolio ${year}.
Identifica patrones, riesgos estructurales y oportunidades.

DATOS DEL GRAFO:
- Total nodos (iniciativas): ${initiatives.length}
- Total conexiones (dependencias): ${deps.length}
- Iniciativas SIN alineación a OKRs: ${noOkr.join(', ') || 'Ninguna'}
- Iniciativas con múltiples riesgos abiertos: ${highRiskNames.join(', ') || 'Ninguna'}
- Champions con 3+ iniciativas: ${overloadedChampions.join(', ') || 'Ninguno'}
- Áreas representadas: ${[...new Set(initiatives.map((i: any) => i.area))].join(', ')}
- Tecnologías en el portafolio: ${[...new Set(techs.map((t: any) => t.tech))].join(', ')}

Responde con JSON:
{
  "clusters_detectados": [
    {
      "nombre": "Nombre del cluster o patrón",
      "tipo": "riesgo | oportunidad | gap",
      "iniciativas_afectadas": ["nombre1", "nombre2"],
      "descripcion": "Qué significa este cluster y por qué importa",
      "accion_sugerida": "Qué hacer al respecto"
    }
  ],
  "nodos_criticos": ["Iniciativa que si falla más impacta al resto"],
  "gaps_estrategicos": ["Gap 1 detectado", "Gap 2 detectado"],
  "salud_del_grafo": "buena | moderada | fragil | critica",
  "insight_principal": "El hallazgo más importante del análisis del grafo en 1-2 oraciones"
}
`;

        const raw = await askGemini(prompt);
        const graphInsights = extractJSON<any>(raw);

        res.json({
            year,
            graph_stats: {
                total_nodes: initiatives.length,
                total_edges: deps.length,
                no_okr_count: noOkr.length,
                high_risk_count: highRiskNames.length,
                overloaded_champions: overloadedChampions.length,
            },
            insights: graphInsights,
            generated_at: new Date().toISOString(),
        });

    } catch (err: any) {
        console.error('[AI] /graph-insights error:', err.message);
        res.status(500).json({ error: 'Graph insights failed', detail: err.message });
    }
});

export default router;
