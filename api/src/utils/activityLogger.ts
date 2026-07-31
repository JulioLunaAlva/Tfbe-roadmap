import { query } from '../db';

export const logActivity = async (
    userId: string | null,
    action: string,
    entityId: string | null = null,
    details: any = {}
) => {
    try {
        await query(
            `INSERT INTO audit_logs (user_id, action, entity_id, details)
             VALUES ($1, $2, $3, $4)`,
            [userId, action, entityId, JSON.stringify(details)]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
        // We do not throw the error because logging should not break the main transaction/operation
    }
};
