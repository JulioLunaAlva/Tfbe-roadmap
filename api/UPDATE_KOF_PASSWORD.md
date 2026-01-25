# Update KOF User Password

Para cambiar la contraseña del usuario `kof` a `kof`, ejecuta este comando en el **Shell de Render**:

## Opción 1: Desde Render Dashboard

1. Ve a https://dashboard.render.com
2. Selecciona el servicio **Tfbe-roadmap**
3. Click en **Shell** (en el menú lateral)
4. Ejecuta este comando:

```bash
node -e "const bcrypt = require('bcryptjs'); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); (async () => { const hash = await bcrypt.hash('kof', 10); const result = await pool.query('UPDATE users SET password_hash = \$1 WHERE email = \$2 RETURNING email, role', [hash, 'kof']); console.log('Updated:', result.rows[0]); await pool.end(); })();"
```

## Opción 2: Usando SQL directo

Si prefieres usar SQL directo, primero genera el hash:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('kof', 10).then(hash => console.log(hash));"
```

Copia el hash generado y luego ejecuta (reemplaza `HASH_AQUI` con el hash copiado):

```sql
UPDATE users SET password_hash = 'HASH_AQUI' WHERE email = 'kof';
```

## Opción 3: Script en el repositorio

He creado el archivo `api/update_kof_password.js`. Para ejecutarlo:

1. Haz SSH a Render o usa el Shell
2. Ejecuta:
```bash
cd /opt/render/project/src/api
node update_kof_password.js
```

## Verificación

Después de actualizar, prueba el login en:
- **Email**: `kof`
- **Password**: `kof`
