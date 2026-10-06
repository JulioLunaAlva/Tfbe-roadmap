import { Pool, PoolConfig, QueryResult } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('DATABASE_URL is not set. Database features will not work.');
}

// TLS to the database. In production the server certificate is VERIFIED by default.
//  - DB_SSL_CA: PEM text (use \n for newlines) of the CA that signed the DB certificate.
//  - DB_SSL_REJECT_UNAUTHORIZED=false: explicit, logged opt-out (not recommended).
//  - DB_SSL=disable: for Render internal URLs / local Postgres without TLS.
const buildSsl = (): PoolConfig['ssl'] => {
    if (process.env.NODE_ENV !== 'production' || process.env.DB_SSL === 'disable') return undefined;
    if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
        console.warn('[db] TLS certificate verification is DISABLED (DB_SSL_REJECT_UNAUTHORIZED=false).');
        return { rejectUnauthorized: false };
    }
    const ca = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');
    return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
};

export const pool = new Pool({
    connectionString,
    ssl: buildSsl(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 30_000,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Runs `fn` inside a real transaction on ONE dedicated connection.
 * (The previous `query('BEGIN')` / `query('COMMIT')` pattern ran on different pooled connections,
 *  so it never provided atomicity and could leave connections "idle in transaction".)
 */
export const withTransaction = async <T>(
    fn: (q: (text: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
): Promise<T> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn((text, params) => client.query(text, params));
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch {
            /* connection already broken: nothing else to do */
        }
        throw err;
    } finally {
        client.release();
    }
};
