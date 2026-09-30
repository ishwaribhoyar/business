import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const srcMigrations = path.join(backendRoot, 'src/db/migrations');
const distMigrations = path.join(backendRoot, 'dist/db/migrations');
const srcSchema = path.join(backendRoot, 'src/db/schema.sql');
const distSchema = path.join(backendRoot, 'dist/db/schema.sql');

if (fs.existsSync(srcMigrations)) {
  fs.cpSync(srcMigrations, distMigrations, { recursive: true, force: true });
  console.log(`[copyAssets] Copied migrations: ${srcMigrations} -> ${distMigrations}`);
}

if (fs.existsSync(srcSchema)) {
  fs.mkdirSync(path.dirname(distSchema), { recursive: true });
  fs.copyFileSync(srcSchema, distSchema);
  console.log(`[copyAssets] Copied schema.sql: ${srcSchema} -> ${distSchema}`);
}
