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

            await query(
                `INSERT INTO initiatives (name, area, champion, complexity, is_top_priority, year, notes) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT DO NOTHING`,
                [name, area, champion, complexity, is_top_priority, year, notes]
            );
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
