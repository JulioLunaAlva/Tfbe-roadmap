// Centralised, fail-closed configuration.
// Every secret MUST come from environment variables (Render "Environment" tab locally: api/.env).

const requireEnv = (name: string, minLength = 1): string => {
    const value = process.env[name];
    if (!value || value.length < minLength) {
        throw new Error(
            `[config] Missing or too short environment variable ${name} (min ${minLength} chars). Refusing to start.`
        );
    }
    return value;
};

// Minimum 32 chars. Generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
export const JWT_SECRET: string = requireEnv('JWT_SECRET', 32);

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const toOrigin = (value: string): string | null => {
    try {
        return new URL(value.trim()).origin;
    } catch {
        return null;
    }
};

// Comma separated list of exact browser origins (scheme + host, NO path), e.g.
// ALLOWED_ORIGINS=https://myuser.github.io
// APP_URL is accepted as a fallback for backwards compatibility.
export const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || '')
    .split(',')
    .map(toOrigin)
    .filter((o): o is string => o !== null);

if (!IS_PRODUCTION) {
    ['http://localhost:5173', 'http://127.0.0.1:5173'].forEach((o) => {
        if (!ALLOWED_ORIGINS.includes(o)) ALLOWED_ORIGINS.push(o);
    });
}

if (IS_PRODUCTION && ALLOWED_ORIGINS.length === 0) {
    console.warn('[config] ALLOWED_ORIGINS/APP_URL is empty: all cross-origin browser requests will be rejected.');
}

// Comma separated list of e-mails with credential/area management rights (exact, case-insensitive match).
// If empty, only users whose role is "admin" are allowed.
export const SUPERADMIN_EMAILS: string[] = (process.env.SUPERADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const BCRYPT_ROUNDS = 12;
