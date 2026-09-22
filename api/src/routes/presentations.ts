import { Router, Request, Response } from 'express';
import multer from 'multer';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Multer: store in memory, max 50MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

// ─── FOLDERS ─────────────────────────────────────────────────────────────────

// GET /api/presentations/folders?business_area_id=UUID
router.get('/folders', async (req: any, res: Response) => {
    const { business_area_id } = req.query;
    try {
        const params: any[] = [];
        let whereClause = '';
        if (business_area_id) {
            params.push(business_area_id);
            whereClause = `WHERE f.business_area_id = $${params.length}`;
        }

        // Use a correlated subquery for file_count — avoids GROUP BY pitfalls
        const result = await query(
            `SELECT
                f.id,
                f.name,
                f.description,
                f.business_area_id,
                f.created_at,
                COALESCE(u.email, '') AS created_by_name,
                (SELECT COUNT(*)::int FROM presentation_files pf WHERE pf.folder_id = f.id) AS file_count
             FROM presentation_folders f
             LEFT JOIN users u ON u.id = f.created_by
             ${whereClause}
             ORDER BY f.created_at ASC`,
            params
        );
        console.log(`GET /folders — area=${business_area_id ?? 'ALL'} — returned ${result.rows.length} rows`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching folders:', err);
        res.status(500).json({ error: 'Failed to fetch folders', detail: String(err) });
    }
});

// POST /api/presentations/folders  (admin / editor only)
router.post('/folders', requireRole('editor'), async (req: any, res: Response) => {
    const { name, description, business_area_id } = req.body;
    if (!name?.trim()) {
        res.status(400).json({ error: 'El nombre es requerido' });
        return;
    }
    try {
        const result = await query(
            `INSERT INTO presentation_folders (name, description, business_area_id, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name.trim(), description?.trim() || '', business_area_id || null, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating folder:', err);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// PUT /api/presentations/folders/:id  (rename)
router.put('/folders/:id', requireRole('editor'), async (req: any, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name?.trim()) {
        res.status(400).json({ error: 'El nombre es requerido' });
        return;
    }
    try {
        const result = await query(
            `UPDATE presentation_folders SET name=$1, description=$2 WHERE id=$3 RETURNING *`,
            [name.trim(), description?.trim() || '', id]
        );
        if (result.rowCount === 0) { res.status(404).json({ error: 'Folder not found' }); return; }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating folder:', err);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// DELETE /api/presentations/folders/:id
router.delete('/folders/:id', requireRole('editor'), async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        // Files will cascade due to ON DELETE CASCADE
        await query('DELETE FROM presentation_folders WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting folder:', err);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// ─── FILES ───────────────────────────────────────────────────────────────────

// GET /api/presentations/folders/:id/files
router.get('/folders/:id/files', async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        const result = await query(
            `SELECT f.id, f.folder_id, f.original_name, f.mime_type, f.size_bytes, f.created_at,
                    u.email as uploaded_by_name
             FROM presentation_files f
             LEFT JOIN users u ON u.id = f.uploaded_by
             WHERE f.folder_id = $1
             ORDER BY f.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching files:', err);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// POST /api/presentations/folders/:id/files  (upload)
router.post('/folders/:id/files', requireRole('editor'), upload.single('file'), async (req: any, res: Response) => {
    const { id } = req.params;
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    try {
        const result = await query(
            `INSERT INTO presentation_files (folder_id, original_name, mime_type, size_bytes, data, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, folder_id, original_name, mime_type, size_bytes, created_at`,
            [
                id,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                req.file.buffer,
                req.user.id
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// GET /api/presentations/files/:id/download
router.get('/files/:id/download', async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        const result = await query(
            `SELECT original_name, mime_type, data FROM presentation_files WHERE id=$1`,
            [id]
        );
        if (result.rowCount === 0) { res.status(404).json({ error: 'File not found' }); return; }
        const file = result.rows[0];
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
        res.send(file.data);
    } catch (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// DELETE /api/presentations/files/:id
router.delete('/files/:id', requireRole('editor'), async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM presentation_files WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
