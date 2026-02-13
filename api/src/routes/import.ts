import { Router, Response, Request } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/import
router.post('/', authenticateToken, requireRole('editor'), upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet) as any[];

        let processed = 0;

        // Cache phases for lookup if needed later, but for basic import we might just ignore phases for now 
        // OR implement the full logic. Let's do a robust basic import first to unblock the build.
        // We will assume standard columns: Initiative, Area, Champion, Complexity, Top, Year, Notes

        await query('BEGIN');

        for (const row of data) {
            const name = row['Nombre'] || row['Iniciativa'] || row['Title'];
            if (!name) continue;

            const area = row['Area'] || row['Área'] || 'General';
            const champion = row['Champion'] || row['Responsable'] || '';
            const complexity = row['Complejidad'] || 'Media';
            const is_top_priority = !!(row['Top'] || row['Prioridad']);
            const year = row['Año'] || row['Year'] || new Date().getFullYear();
            const notes = row['Notas'] || '';

            const transformation_lead = row['Transformation Lead'] || row['Responsable Transformación'] || row['Transf. Lead'] || '';
            const techString = row['Technologies'] || row['Tecnologías'] || row['Tecnologia'] || '';

            // NEW FIELDS
            const value = row['Valor'] || row['Value'] || '';
            const status = row['Estatus'] || row['Status'] || 'En espera';
            const start_date = row['Fecha Inicio'] || row['Start Date'] || null;
            const end_date = row['Fecha Fin'] || row['End Date'] || null;
            const progress = parseInt(row['Progreso'] || row['Progress'] || '0', 10);

            // Validate value if provided
            const allowedValues = ['Estrategico Alto Valor', 'Operational Value', 'Mandatorio/Compliance', 'Deferred/Not prioritized'];
            const validValue = value && allowedValues.includes(value) ? value : null;

            // Insert Initiative with all fields
            const resInit = await query(
                `INSERT INTO initiatives (name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, value, status, start_date, end_date, progress) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT DO NOTHING RETURNING id`,
                [name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, validValue, status, start_date, end_date, progress]
            );

            // If inserted successfully (and returned an ID), process technologies
            if (resInit.rows.length > 0) {
                const initId = resInit.rows[0].id;

                if (techString) {
                    const techNames = techString.split(';').map((t: string) => t.trim()).filter((t: string) => t);

                    for (const tName of techNames) {
                        // Find or Insert Technology
                        let tId;
                        const techRes = await query('SELECT id FROM technologies WHERE name = $1', [tName]);
                        if (techRes.rows.length > 0) {
                            tId = techRes.rows[0].id;
                        } else {
                            const newTech = await query('INSERT INTO technologies (name) VALUES ($1) RETURNING id', [tName]);
                            tId = newTech.rows[0].id;
                        }

                        await query(
                            'INSERT INTO initiative_technologies (initiative_id, technology_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [initId, tId]
                        );
                    }
                }
            }
            processed++;
        }

        await query('COMMIT');
        res.json({ message: 'Import processed', count: processed });
    } catch (e) {
        await query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: 'Import failed' });
    }
});

export default router;
