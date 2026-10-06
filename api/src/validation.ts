import { Request, Response, NextFunction } from 'express';
import { z, ZodTypeAny } from 'zod';

// Fail-closed validation helpers. Unknown keys are stripped, wrong types are rejected with 400.

export const uuid = z.string().uuid();
export const isUuid = (value: unknown): value is string => uuid.safeParse(value).success;

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

// bcrypt only uses the first 72 bytes, so cap the length. 10+ chars, at least one letter and one digit.
export const passwordSchema = z
    .string()
    .min(10, 'La contraseña debe tener al menos 10 caracteres')
    .max(72)
    .regex(/[A-Za-z]/, 'La contraseña debe incluir letras')
    .regex(/[0-9]/, 'La contraseña debe incluir números');

export const roleSchema = z.enum(['admin', 'editor', 'viewer']);

type Source = 'body' | 'query' | 'params';

/** Express middleware: validates req[source] with the schema and replaces it with the parsed value. */
export const validate =
    (schema: ZodTypeAny, source: Source = 'body') =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            return res.status(400).json({
                error: 'Invalid request',
                issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            });
        }
        if (source === 'body') {
            req.body = result.data;
        } else {
            // Express 5 exposes req.query as a getter; keep the parsed copy separately.
            (req as any).validated = { ...((req as any).validated || {}), [source]: result.data };
        }
        next();
    };

/** Rejects non-UUID values for the given route params (prevents malformed ids from reaching the DB). */
export const requireUuidParams =
    (...names: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        for (const name of names) {
            if (!isUuid(req.params[name])) {
                return res.status(400).json({ error: `Invalid ${name}` });
            }
        }
        next();
    };
