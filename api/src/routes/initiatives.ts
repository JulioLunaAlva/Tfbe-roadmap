import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = Router();

// GET /api/initiatives - List all (with filters)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const { year, area, complexity, is_top_priority } = req.query;

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
    const { name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, technologies, status, start_date, end_date, progress, value } = req.body;

    // Validate value field (required)
    const allowedValues = ['Estrategico Alto Valor', 'Operational Value', 'Mandatorio/Compliance', 'Deferred/Not prioritized'];
    if (!value || !allowedValues.includes(value)) {
        return res.status(400).json({ error: 'Value is required and must be one of: ' + allowedValues.join(', ') });
    }

    try {
        await query('BEGIN');

        // Insert Initiative
        const resInit = await query(
            `INSERT INTO initiatives (name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, status, start_date, end_date, progress, value) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [name, area, champion, transformation_lead, complexity, is_top_priority || false, year, notes, status, start_date, end_date, progress || 0, value]
        );
        const initiative = resInit.rows[0];

        // Insert Default Phases
        const phasesRes = await query('SELECT id, default_order FROM phases');
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
    const { name, area, champion, transformation_lead, complexity, status, start_date, end_date, progress, notes, technologies, is_top_priority, year, value } = req.body;

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

        const result = await query(
            'UPDATE initiatives SET name = $1, area = $2, champion = $3, transformation_lead = $4, complexity = $5, status = $6, start_date = $7, end_date = $8, progress = $9, notes = $10, is_top_priority = $11, year = $12, value = $13 WHERE id = $14 RETURNING *',
            [name, area, champion, transformation_lead, complexity, status, start_date, end_date, progress, notes, is_top_priority, year, normalizedValue, id]
        );

        if (technologies && Array.isArray(technologies)) {
            // Delete existing
            await query('DELETE FROM initiative_technologies WHERE initiative_id = $1', [id]);
            // Insert new
            for (const techId of technologies) {
                // Ensure techId exists or insert if treating as name... 
                // Wait, frontend sends Names? CreateInitiativeModal sends Names but backend INSERT assumes Technology ID if strictly FK?
                // Let's check INSERT logic:
                // INSERT INTO initiative_technologies (initiative_id, technology_id) VALUES ($1, $2)

                // If the frontend sends NAMES we need to map them or ensure they exist.
                // The current Create logic does: loop techId of technologies -> INSERT. 
                // This implies 'technologies' array contains IDs?
                // But CreateModal sends strings (names). 
                // If technologies table exists, we should probably look them up or insert them locally.

                // Let's assume we maintain a technologies table but allow free text if we UPSERT them.
                // Or simply simple for now: if user sends "Python", we look for ID or insert.

                // REVISION: The original Create logic was assuming IDs?? 
                // Line 74 in original file: for (const techId of technologies) ... INSERT
                // But in CreateModal lines 38, 83... it's string[]

                // If I am sending Names, I need to resolve them to IDs first or (if strict) insert them.
                // I'll add a helper logic here: Check if tech exists, get ID, else insert.

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
        res.json({ message: 'Initiative deleted' });
    } catch (err) {
        await query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete initiative' });
    }
});

export default router;
