import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// GET /api/initiatives - List all (with filters)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year, area, complexity, is_top_priority, business_area_id } = req.query;

    let sql = `
    SELECT i.*, 
      (SELECT json_agg(t.name) FROM initiative_technologies it JOIN technologies t ON it.technology_id = t.id WHERE it.initiative_id = i.id) as technologies,
      (
        SELECT json_agg(json_build_object(
            'id', ip.id, 
            'phase_id', ip.phase_id, 
            'name', p.name,
            'custom_order', ip.custom_order,
            'is_active', ip.is_active,
            'progress', ip.progress,
            'notes', ip.notes
        ) ORDER BY ip.custom_order) 
        FROM initiative_phases ip 
        JOIN phases p ON ip.phase_id = p.id
        WHERE ip.initiative_id = i.id
    ) as phases
    FROM initiatives i
    WHERE 1=1
  `;
    const params: any[] = [];
    let pIdx = 1;

    if (year) { sql += ` AND i.year = $${pIdx++}`; params.push(year); }
    if (area) { sql += ` AND i.area = $${pIdx++}`; params.push(area); }
    if (business_area_id) { sql += ` AND i.business_area_id = $${pIdx++}`; params.push(business_area_id); }
    // Add other filters as needed

    sql += ` ORDER BY i.custom_order ASC, i.is_top_priority DESC, i.created_at DESC`;

    try {
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch initiatives' });
    }
});

// POST /api/initiatives - Create
router.post('/', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    console.log('POST /initiatives body:', req.body);
    const { name, area, champion, transformation_lead, complexity, is_top_priority, is_key_initiative, year, notes, technologies, status, start_date, end_date, progress, value, methodology_type, tags, business_area_id } = req.body;

    const methodology = methodology_type || 'Hibrida';

    // Validate value field (required)
    const allowedValues = ['Estrategico Alto Valor', 'Operational Value', 'Mandatorio/Compliance', 'Deferred/Not prioritized'];
    if (!value || !allowedValues.includes(value)) {
        return res.status(400).json({ error: 'Value is required and must be one of: ' + allowedValues.join(', ') });
    }

    try {
        await query('BEGIN');

        // Insert Initiative
        const resInit = await query(
            `INSERT INTO initiatives (name, area, champion, transformation_lead, developer_owner, complexity, is_top_priority, is_key_initiative, year, notes, status, start_date, end_date, progress, value, methodology_type, tags, business_area_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
            [name, area, champion, transformation_lead, req.body.developer_owner, complexity, is_top_priority || false, is_key_initiative || false, year, notes, status, start_date, end_date, progress || 0, value, methodology, tags || [], business_area_id || null]
        );
        const initiative = resInit.rows[0];

        // Insert Default Phases based on Methodology
        const phasesRes = await query('SELECT id, default_order FROM phases WHERE methodology = $1 ORDER BY default_order', [methodology]);

        // Fallback if no phases found for methodology (should not happen with correct migration)
        if (phasesRes.rows.length === 0) {
            console.warn(`No phases found for methodology: ${methodology}`);
        }

        for (const phase of phasesRes.rows) {
            await query(
                `INSERT INTO initiative_phases (initiative_id, phase_id, is_active, custom_order)
                 VALUES ($1, $2, true, $3)`,
                [initiative.id, phase.id, phase.default_order]
            );
        }

        // Insert Technologies if provided
        if (technologies && Array.isArray(technologies)) {
            for (const techName of technologies) {
                let tId;
                const techRes = await query('SELECT id FROM technologies WHERE name = $1', [techName]);
                if (techRes.rows.length > 0) {
                    tId = techRes.rows[0].id;
                } else {
                    const newTech = await query('INSERT INTO technologies (name) VALUES ($1) RETURNING id', [techName]);
                    tId = newTech.rows[0].id;
                }

                await query(
                    'INSERT INTO initiative_technologies (initiative_id, technology_id) VALUES ($1, $2)',
                    [initiative.id, tId]
                );
            }
        }

        await query('COMMIT');
        
        // Log Activity
        await logActivity((req as any).user?.id, 'Creó Iniciativa', initiative.id, {
            name: initiative.name,
            entity_type: 'Iniciativa'
        });

        res.status(201).json(initiative);
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create initiative' });
    }
});

// PUT /api/initiatives/:id - Update
router.put('/:id', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`PUT /initiatives/${id} body:`, req.body);
    const { name, area, champion, transformation_lead, complexity, status, start_date, end_date, progress, notes, technologies, is_top_priority, is_key_initiative, year, value, methodology_type, tags, business_area_id } = req.body;

    // Validate and normalize value field
    let normalizedValue = value || null;
    if (value && value.trim() !== '') {
        const allowedValues = ['Estrategico Alto Valor', 'Operational Value', 'Mandatorio/Compliance', 'Deferred/Not prioritized'];
        if (!allowedValues.includes(value)) {
            return res.status(400).json({ error: 'Value must be one of: ' + allowedValues.join(', ') });
        }
        normalizedValue = value;
    }

    try {
        await query('BEGIN');

        // Check current methodology to detect change
        const currentInitRes = await query('SELECT methodology_type FROM initiatives WHERE id = $1', [id]);
        const currentMethodology = currentInitRes.rows[0]?.methodology_type || 'Hibrida';
        const newMethodology = methodology_type || currentMethodology;

        const result = await query(
            'UPDATE initiatives SET name = $1, area = $2, champion = $3, transformation_lead = $4, developer_owner = $5, complexity = $6, status = $7, start_date = $8, end_date = $9, progress = $10, notes = $11, is_top_priority = $12, is_key_initiative = $13, year = $14, value = $15, methodology_type = $16, tags = $17, business_area_id = COALESCE($18, business_area_id) WHERE id = $19 RETURNING *',
            [name, area, champion, transformation_lead, req.body.developer_owner, complexity, status, start_date, end_date, progress, notes, is_top_priority, is_key_initiative, year, normalizedValue, newMethodology, tags || [], business_area_id || null, id]
        );

        // If methodology changed, replace phases
        if (newMethodology !== currentMethodology) {
            console.log(`Methodology changed from ${currentMethodology} to ${newMethodology}. Resetting phases.`);

            // Delete existing phases
            await query('DELETE FROM initiative_phases WHERE initiative_id = $1', [id]);

            // Insert new phases
            const phasesRes = await query('SELECT id, default_order FROM phases WHERE methodology = $1 ORDER BY default_order', [newMethodology]);
            for (const phase of phasesRes.rows) {
                await query(
                    `INSERT INTO initiative_phases (initiative_id, phase_id, is_active, custom_order)
                     VALUES ($1, $2, true, $3)`,
                    [id, phase.id, phase.default_order]
                );
            }
        }

        if (technologies && Array.isArray(technologies)) {
            // Delete existing
            await query('DELETE FROM initiative_technologies WHERE initiative_id = $1', [id]);
            // Insert new
            for (const techId of technologies) {
                let tId;
                const techRes = await query('SELECT id FROM technologies WHERE name = $1', [techId]);
                if (techRes.rows.length > 0) {
                    tId = techRes.rows[0].id;
                } else {
                    const newTech = await query('INSERT INTO technologies (name) VALUES ($1) RETURNING id', [techId]);
                    tId = newTech.rows[0].id;
                }

                await query(
                    'INSERT INTO initiative_technologies (initiative_id, technology_id) VALUES ($1, $2)',
                    [id, tId]
                );
            }
        }

        await query('COMMIT');
        
        // Log Activity
        await logActivity((req as any).user?.id, 'Actualizó Iniciativa', id as string, {
            name: name,
            entity_type: 'Iniciativa'
        });

        res.json(result.rows[0]);
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// PATCH /api/initiatives/:id/phases/:phaseId/progress
router.patch('/:id/phases/:phaseId/progress', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { id, phaseId } = req.params;
    const { progress, notes } = req.body; // Accept notes

    try {
        await query('BEGIN');

        if (progress !== undefined) {
            // Update Phase Progress
            await query(
                'UPDATE initiative_phases SET progress = $1 WHERE initiative_id = $2 AND phase_id = $3',
                [progress, id, phaseId]
            );

            // Recalculate Total Progress (Average of active phases)
            await query(`
                UPDATE initiatives 
                SET progress = (
                    SELECT ROUND(AVG(progress)) 
                    FROM initiative_phases 
                    WHERE initiative_id = $1 AND is_active = true
                )
                WHERE id = $1
            `, [id]);
        }

        if (notes !== undefined) {
            await query(
                'UPDATE initiative_phases SET notes = $1 WHERE initiative_id = $2 AND phase_id = $3',
                [notes, id, phaseId]
            );
        }

        await query('COMMIT');
        
        await logActivity((req as any).user?.id, 'Actualizó Fase de Iniciativa', id as string, {
            entity_type: 'Iniciativa',
            phase_id: phaseId
        });

        res.json({ message: 'Phase updated' });
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to update phase' });
    }
});

// PATCH /api/initiatives/:id/reorder
router.patch('/:id/reorder', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    try {
        await query('BEGIN');

        // Get current initiative
        const currentRes = await query('SELECT id, custom_order, year FROM initiatives WHERE id = $1', [id]);
        if (currentRes.rows.length === 0) throw new Error('Initiative not found');
        const current = currentRes.rows[0];

        // Find neighbor
        let neighborRes;
        if (direction === 'up') {
            neighborRes = await query(
                'SELECT id, custom_order FROM initiatives WHERE year = $1 AND custom_order < $2 ORDER BY custom_order DESC LIMIT 1',
                [current.year, current.custom_order]
            );
        } else {
            neighborRes = await query(
                'SELECT id, custom_order FROM initiatives WHERE year = $1 AND custom_order > $2 ORDER BY custom_order ASC LIMIT 1',
                [current.year, current.custom_order]
            );
        }

        if (neighborRes.rows.length > 0) {
            const neighbor = neighborRes.rows[0];
            // Swap orders
            await query('UPDATE initiatives SET custom_order = $1 WHERE id = $2', [neighbor.custom_order, current.id]);
            await query('UPDATE initiatives SET custom_order = $1 WHERE id = $2', [current.custom_order, neighbor.id]);
        }

        await query('COMMIT');
        res.json({ message: 'Order updated' });
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to reorder' });
    }
});

// PATCH /api/initiatives/reorder-all
router.patch('/reorder-all', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { initiativeIds } = req.body; // Array of IDs in the new order

    if (!Array.isArray(initiativeIds)) {
        return res.status(400).json({ error: 'initiativeIds must be an array' });
    }

    try {
        await query('BEGIN');

        // Update each initiative's custom_order based on its position in the array
        for (let i = 0; i < initiativeIds.length; i++) {
            await query(
                'UPDATE initiatives SET custom_order = $1 WHERE id = $2',
                [i + 1, initiativeIds[i]]
            );
        }

        await query('COMMIT');
        res.json({ message: 'All initiatives reordered' });
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to reorder all initiatives' });
    }
});

// DELETE /api/initiatives/:id
router.delete('/:id', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('BEGIN');

        // Manual Cascade Delete (just in case FKs are not set with CASCADE)
        await query('DELETE FROM weekly_progress WHERE initiative_id = $1', [id]);
        await query('DELETE FROM initiative_technologies WHERE initiative_id = $1', [id]);
        await query('DELETE FROM initiative_phases WHERE initiative_id = $1', [id]); // If this table exists and is used
        await query('DELETE FROM initiative_milestones WHERE initiative_id = $1', [id]);

        await query('DELETE FROM initiatives WHERE id = $1', [id]);

        await query('COMMIT');
        
        await logActivity((req as any).user?.id, 'Eliminó Iniciativa', id as string, {
            entity_type: 'Iniciativa'
        });

        res.json({ message: 'Initiative deleted' });
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete initiative' });
    }
});

// PATCH /api/initiatives/:id/tags - Update tags only
router.patch('/:id/tags', authenticateToken, requireRole('editor'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
        return res.status(400).json({ error: 'tags must be an array of strings' });
    }

    try {
        const result = await query(
            'UPDATE initiatives SET tags = $1 WHERE id = $2 RETURNING id, tags',
            [tags, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Initiative not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update tags' });
    }
});

export default router;
