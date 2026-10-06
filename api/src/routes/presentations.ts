import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware';
import { canAccessArea, getAccessibleAreaIds } from '../access';
import { isUuid, uuid } from '../validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ─── Upload policy ───────────────────────────────────────────────────────────
// Allow-list of extensions -> server-controlled MIME type + expected file signature.
// The client supplied mimetype / filename are never trusted.
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const OLE = [0xd0, 0xcf, 0x11, 0xe0];
const ALLOWED: Record<string, { mime: string; sig?: number[] }> = {
    '.pdf': { mime: 'application/pdf', sig: [0x25, 0x50, 0x44, 0x46] },
    '.pptx': { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', sig: ZIP },
    '.docx': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sig: ZIP },
    '.xlsx': { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sig: ZIP },
    '.ppt': { mime: 'application/vnd.ms-powerpoint', sig: OLE },
    '.doc': { mime: 'application/msword', sig: OLE },
    '.xls': { mime: 'application/vnd.ms-excel', sig: OLE },
    '.csv': { mime: 'text/csv' },
    '.txt': { mime: 'text/plain' },
    '.png': { mime: 'image/png', sig: [0x89, 0x50, 0x4e, 0x47] },
    '.jpg': { mime: 'image/jpeg', sig: [0xff, 0xd8, 0xff] },
    '.jpeg': { mime: 'image/jpeg', sig: [0xff, 0xd8, 0xff] },
    '.gif': { mime: 'image/gif', sig: [0x47, 0x49, 0x46, 0x38] },
};
const SAFE_DOWNLOAD_MIMES = new Set(Object.values(ALLOWED).map((a) => a.mime));

const hasSignature = (buf: Buffer, sig?: number[]) => !sig || sig.every((b, i) => buf[i] === b);

/** Strips any directory component and control / reserved characters from a client supplied name. */
const safeFileName = (name: string): string => {
    const base = path.basename(String(name).replace(/\\/g, '/'));
    // eslint-disable-next-line no-control-regex
    const cleaned = base.replace(/[\u0000-\u001f<>:"|?*]/g, '_').trim().slice(0, 200);
    return cleaned || 'file';
};

// Multer: memory storage, 50MB, one file per request
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 5 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

type FolderAccess = 'allowed' | 'denied' | 'not_found';

/** Object-level authorization: can this user touch this folder? (folders without area are legacy/global) */
const checkFolderAccess = async (user: any, folderId: unknown): Promise<FolderAccess> => {
    if (!isUuid(folderId)) return 'not_found';
    const r = await query('SELECT business_area_id FROM presentation_folders WHERE id = $1', [folderId]);
    if (r.rows.length === 0) return 'not_found';
    const areaId: string | null = r.rows[0].business_area_id;
    if (!areaId) return 'allowed';
    return (await canAccessArea(user, areaId)) ? 'allowed' : 'denied';
};

const folderSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es requerido').max(255),
    description: z.string().trim().max(2000).optional().default(''),
    business_area_id: z.preprocess((v) => (v === '' ? null : v), uuid.nullish()),
});

// ─── FOLDERS ─────────────────────────────────────────────────────────────────

// GET /api/presentations/folders?business_area_id=UUID
router.get('/folders', async (req: any, res: Response) => {
    const areaParam = req.query.business_area_id;
    if (areaParam !== undefined && !isUuid(areaParam)) {
        res.status(400).json({ error: 'Invalid business_area_id' });
        return;
    }
    try {
        const allowedAreas = await getAccessibleAreaIds(req.user); // null => every area
        const params: any[] = [];
        const conditions: string[] = [];

        if (allowedAreas !== null) {
            params.push(allowedAreas);
            conditions.push(`(f.business_area_id = ANY($${params.length}::uuid[]) OR f.business_area_id IS NULL)`);
        }
        if (areaParam) {
            params.push(areaParam);
            conditions.push(`f.business_area_id = $${params.length}`);
        }
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Use a correlated subquery for file_count — avoids GROUP BY pitfalls
        const result = await query(
            `SELECT
                f.id,
                f.name,
                f.description,
                f.business_area_id,
                f.created_at,
                COALESCE(u.email, '') AS created_by_name,
                COALESCE(u.avatar_url, '') AS created_by_avatar,
                (SELECT COUNT(*)::int FROM presentation_files pf WHERE pf.folder_id = f.id) AS file_count
             FROM presentation_folders f
             LEFT JOIN users u ON u.id = f.created_by
             ${whereClause}
             ORDER BY f.created_at ASC`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching folders:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
});

// POST /api/presentations/folders  (admin / editor only)
router.post('/folders', requireRole('editor'), async (req: any, res: Response) => {
    const parsed = folderSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
        return;
    }
    const { name, description, business_area_id } = parsed.data;
    try {
        if (business_area_id && !(await canAccessArea(req.user, business_area_id))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const result = await query(
            `INSERT INTO presentation_folders (name, description, business_area_id, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, description, business_area_id || null, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating folder:', (err as Error).message);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// PUT /api/presentations/folders/:id  (rename)
router.put('/folders/:id', requireRole('editor'), async (req: any, res: Response) => {
    const parsed = folderSchema.pick({ name: true, description: true }).safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
        return;
    }
    try {
        if ((await checkFolderAccess(req.user, req.params.id)) !== 'allowed') {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }
        const result = await query(
            `UPDATE presentation_folders SET name=$1, description=$2 WHERE id=$3 RETURNING *`,
            [parsed.data.name, parsed.data.description, req.params.id]
        );
        if (result.rowCount === 0) { res.status(404).json({ error: 'Folder not found' }); return; }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating folder:', (err as Error).message);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// DELETE /api/presentations/folders/:id
router.delete('/folders/:id', requireRole('editor'), async (req: any, res: Response) => {
    try {
        if ((await checkFolderAccess(req.user, req.params.id)) !== 'allowed') {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }
        // Files will cascade due to ON DELETE CASCADE
        await query('DELETE FROM presentation_folders WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting folder:', (err as Error).message);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// ─── FILES ───────────────────────────────────────────────────────────────────

// GET /api/presentations/folders/:id/files
router.get('/folders/:id/files', async (req: any, res: Response) => {
    try {
        if ((await checkFolderAccess(req.user, req.params.id)) !== 'allowed') {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }
        const result = await query(
            `SELECT f.id, f.folder_id, f.original_name, f.mime_type, f.size_bytes, f.created_at,
                    u.email as uploaded_by_name,
                    COALESCE(u.avatar_url, '') as uploaded_by_avatar
             FROM presentation_files f
             LEFT JOIN users u ON u.id = f.uploaded_by
             WHERE f.folder_id = $1
             ORDER BY f.created_at DESC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching files:', (err as Error).message);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// POST /api/presentations/folders/:id/files  (upload)
router.post('/folders/:id/files', requireRole('editor'), upload.single('file'), async (req: any, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const originalName = safeFileName(req.file.originalname);
    const ext = path.extname(originalName).toLowerCase();
    const policy = ALLOWED[ext];
    if (!policy || !hasSignature(req.file.buffer, policy.sig)) {
        res.status(415).json({ error: 'Unsupported or corrupted file type' });
        return;
    }
    try {
        if ((await checkFolderAccess(req.user, req.params.id)) !== 'allowed') {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }
        const result = await query(
            `INSERT INTO presentation_files (folder_id, original_name, mime_type, size_bytes, data, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, folder_id, original_name, mime_type, size_bytes, created_at`,
            [req.params.id, originalName, policy.mime, req.file.size, req.file.buffer, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error uploading file:', (err as Error).message);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// GET /api/presentations/files/:id/download
router.get('/files/:id/download', async (req: any, res: Response) => {
    if (!isUuid(req.params.id)) { res.status(404).json({ error: 'File not found' }); return; }
    try {
        const result = await query(
            `SELECT f.original_name, f.mime_type, f.data, p.business_area_id
               FROM presentation_files f
               JOIN presentation_folders p ON p.id = f.folder_id
              WHERE f.id = $1`,
            [req.params.id]
        );
        if (result.rowCount === 0) { res.status(404).json({ error: 'File not found' }); return; }
        const file = result.rows[0];
        if (file.business_area_id && !(await canAccessArea(req.user, file.business_area_id))) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        const mime = SAFE_DOWNLOAD_MIMES.has(file.mime_type) ? file.mime_type : 'application/octet-stream';
        const name = safeFileName(file.original_name);
        res.setHeader('Content-Type', mime);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(name)}`
        );
        res.send(file.data);
    } catch (err) {
        console.error('Error downloading file:', (err as Error).message);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// DELETE /api/presentations/files/:id
router.delete('/files/:id', requireRole('editor'), async (req: any, res: Response) => {
    if (!isUuid(req.params.id)) { res.status(404).json({ error: 'File not found' }); return; }
    try {
        const r = await query(
            `SELECT p.business_area_id FROM presentation_files f
               JOIN presentation_folders p ON p.id = f.folder_id WHERE f.id = $1`,
            [req.params.id]
        );
        if (r.rowCount === 0) { res.status(404).json({ error: 'File not found' }); return; }
        const areaId = r.rows[0].business_area_id;
        if (areaId && !(await canAccessArea(req.user, areaId))) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        await query('DELETE FROM presentation_files WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting file:', (err as Error).message);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
