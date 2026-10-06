import { Router, Response, Request } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import path from 'path';
import { withTransaction, query } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = Router();

// Multer configured with strict memory storage and 10MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.xlsx', '.xls', '.csv'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Formato no permitido. Solo se aceptan archivos .xlsx, .xls o .csv'));
        }
    }
});

// POST /api/import
router.post('/', authenticateToken, requireRole('editor'), upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName || !workbook.Sheets[sheetName]) {
            res.status(400).json({ error: 'El archivo Excel no contiene hojas de cálculo legibles' });
            return;
        }

        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet) as any[];

        if (!Array.isArray(data) || data.length === 0) {
            res.status(400).json({ error: 'La hoja de cálculo está vacía' });
            return;
        }

        if (data.length > 2000) {
            res.status(400).json({ error: 'El archivo supera el límite máximo permitido de 2000 filas por carga' });
            return;
        }

        const allowedValues = ['Estrategico Alto Valor', 'Operational Value', 'Mandatorio/Compliance', 'Deferred/Not prioritized'];
        const phasesRes = await query('SELECT id, default_order FROM phases');
        const defaultPhases = phasesRes.rows;

        const count = await withTransaction(async (txQuery) => {
            let processed = 0;

            for (const row of data) {
                const rawName = row['Nombre'] || row['Iniciativa'] || row['Title'];
                if (!rawName || typeof rawName !== 'string') continue;
                const name = rawName.trim().slice(0, 255);

                const area = String(row['Area'] || row['Área'] || 'General').trim().slice(0, 100);
                const champion = String(row['Champion'] || row['Responsable'] || '').trim().slice(0, 150);
                const complexity = String(row['Complejidad'] || 'Media').trim().slice(0, 50);
                const is_top_priority = !!(row['Top'] || row['Prioridad']);
                const rawYear = parseInt(String(row['Año'] || row['Year'] || new Date().getFullYear()), 10);
                const year = isNaN(rawYear) ? new Date().getFullYear() : rawYear;
                const notes = String(row['Notas'] || '').trim().slice(0, 5000);

                const transformation_lead = String(row['Transformation Lead'] || row['Responsable Transformación'] || row['Transf. Lead'] || '').trim().slice(0, 150);
                const techString = String(row['Technologies'] || row['Tecnologías'] || row['Tecnologia'] || '').trim();
                const devOwnerString = String(row['Dev/Owner'] || row['Developer/Owner'] || row['Developer'] || row['Owner'] || '').trim();

                const value = String(row['Valor'] || row['Value'] || '').trim();
                const status = String(row['Estatus'] || row['Status'] || 'En espera').trim().slice(0, 50);
                const start_date = row['Fecha Inicio'] || row['Start Date'] || null;
                const end_date = row['Fecha Fin'] || row['End Date'] || null;
                const rawProgress = parseInt(String(row['Progreso'] || row['Progress'] || '0'), 10);
                const progress = isNaN(rawProgress) ? 0 : Math.min(100, Math.max(0, rawProgress));

                const validValue = value && allowedValues.includes(value) ? value : null;

                const resInit = await txQuery(
                    `INSERT INTO initiatives (name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, value, status, start_date, end_date, progress) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                     ON CONFLICT DO NOTHING RETURNING id`,
                    [name, area, champion, transformation_lead, complexity, is_top_priority, year, notes, validValue, status, start_date, end_date, progress]
                );

                if (resInit.rows.length > 0) {
                    const initId = resInit.rows[0].id;

                    for (const phase of defaultPhases) {
                        await txQuery(
                            `INSERT INTO initiative_phases (initiative_id, phase_id, is_active, custom_order)
                             VALUES ($1, $2, true, $3)
                             ON CONFLICT DO NOTHING`,
                            [initId, phase.id, phase.default_order]
                        );
                    }

                    if (techString) {
                        const techNames = techString.split(';').map((t: string) => t.trim().slice(0, 100)).filter(Boolean);
                        for (const tName of techNames) {
                            let tId;
                            const techRes = await txQuery('SELECT id FROM technologies WHERE name = $1', [tName]);
                            if (techRes.rows.length > 0) {
                                tId = techRes.rows[0].id;
                            } else {
                                const newTech = await txQuery('INSERT INTO technologies (name) VALUES ($1) RETURNING id', [tName]);
                                tId = newTech.rows[0].id;
                            }

                            await txQuery(
                                'INSERT INTO initiative_technologies (initiative_id, technology_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                                [initId, tId]
                            );
                        }
                    }

                    if (devOwnerString) {
                        const devNames = devOwnerString.split(';').map((d: string) => d.trim().slice(0, 100)).filter(Boolean);
                        for (const dName of devNames) {
                            let dId;
                            const devRes = await txQuery('SELECT id FROM developer_owners WHERE name = $1', [dName]);
                            if (devRes.rows.length > 0) {
                                dId = devRes.rows[0].id;
                            } else {
                                const newDev = await txQuery('INSERT INTO developer_owners (name) VALUES ($1) RETURNING id', [dName]);
                                dId = newDev.rows[0].id;
                            }

                            await txQuery(
                                'INSERT INTO initiative_developer_owners (initiative_id, developer_owner_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                                [initId, dId]
                            );
                        }
                    }
                }
                processed++;
            }
            return processed;
        });

        res.json({ message: 'Import processed', count });
    } catch (e) {
        console.error('[import] Error processing file:', (e as Error).message);
        res.status(500).json({ error: 'Import failed' });
    }
});

export default router;
