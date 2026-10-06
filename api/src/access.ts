import { Request, Response, NextFunction } from 'express';
import { query } from './db';
import { isSuperAdmin } from './middleware';
import { isUuid } from './validation';

type U = { id: string; email: string; role?: string } | undefined;

/**
 * Object-level authorization (BOLA/IDOR protection) for business areas.
 *
 *  - admins / super admins: every area
 *  - everyone else: only areas listed in user_area_access
 *
 * Returns null when the user can see ALL areas, or the list of allowed area ids.
 */
export const getAccessibleAreaIds = async (user: U): Promise<string[] | null> => {
    if (!user) return [];
    if (user.role === 'admin' || isSuperAdmin(user)) return null;
    const r = await query('SELECT area_id FROM user_area_access WHERE user_id = $1', [user.id]);
    return r.rows.map((row) => row.area_id);
};

export const canAccessArea = async (user: U, areaId: string | null | undefined): Promise<boolean> => {
    if (!areaId) return false;
    const ids = await getAccessibleAreaIds(user);
    return ids === null || ids.includes(areaId);
};

/**
 * 'allowed' | 'denied' | 'not_found' for a given initiative.
 * Legacy initiatives without business_area_id are not area-scoped and stay visible to authenticated users.
 */
export const checkInitiativeAccess = async (
    user: U,
    initiativeId: unknown
): Promise<'allowed' | 'denied' | 'not_found'> => {
    if (!isUuid(initiativeId)) return 'not_found';
    const r = await query('SELECT business_area_id FROM initiatives WHERE id = $1', [initiativeId]);
    if (r.rows.length === 0) return 'not_found';
    const areaId: string | null = r.rows[0].business_area_id;
    if (!areaId) return 'allowed';
    return (await canAccessArea(user, areaId)) ? 'allowed' : 'denied';
};

/**
 * Express middleware factory: guards routes that carry an initiative id in req.params[param].
 * Denied and unknown ids both answer 404 so ids cannot be enumerated.
 */
export const requireInitiativeAccess =
    (param: string) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await checkInitiativeAccess((req as any).user, req.params[param]);
            if (result !== 'allowed') return res.status(404).json({ error: 'Not found' });
            next();
        } catch (err) {
            console.error('[access] initiative check failed:', (err as Error).message);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

/** SQL condition limiting `column` (a business_area_id) to the areas the user may see. '' => no restriction. */
export const areaScope = async (user: U, column: 'i.business_area_id' | 'business_area_id', params: any[]): Promise<string> => {
    const ids = await getAccessibleAreaIds(user);
    if (ids === null) return '';
    params.push(ids);
    return `(${column} IS NULL OR ${column} = ANY($${params.length}::uuid[]))`;
};

// Literal queries only (no identifier interpolation): resolves the initiative that owns a child record.
const OWNER_SQL = {
    risk: 'SELECT initiative_id FROM initiative_risks WHERE id = $1',
    milestone: 'SELECT initiative_id FROM initiative_milestones WHERE id = $1',
    comment: 'SELECT initiative_id FROM initiative_comments WHERE id = $1',
    dependency: 'SELECT source_id AS initiative_id FROM initiative_dependencies WHERE id = $1',
} as const;

/** BOLA check for child records (risk / milestone / comment / dependency) addressed by their own id. */
export const checkChildAccess = async (
    user: U,
    kind: keyof typeof OWNER_SQL,
    id: unknown
): Promise<'allowed' | 'denied' | 'not_found'> => {
    if (!isUuid(id)) return 'not_found';
    const r = await query(OWNER_SQL[kind], [id]);
    if (r.rows.length === 0) return 'not_found';
    return checkInitiativeAccess(user, r.rows[0].initiative_id);
};
