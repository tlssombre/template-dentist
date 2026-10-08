import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const configPath = 'dist/server/wrangler.json';
const config = JSON.parse(readFileSync(configPath, 'utf8'));
config.d1_databases = config.d1_databases.map((database) => ({
  ...database,
  migrations_dir: '../../drizzle',
}));
writeFileSync(configPath, JSON.stringify(config));

const wrangler = './node_modules/wrangler/bin/wrangler.js';
const state = '.wrangler/state';
const common = ['--config', configPath, '--persist-to', state];
const environment = {
  ...process.env,
  WRANGLER_SEND_METRICS: 'false',
  WRANGLER_LOG_PATH: '.wrangler/logs',
  WRANGLER_REGISTRY_PATH: '.wrangler/dev-registry',
  MINIFLARE_REGISTRY_PATH: '.wrangler/registry',
};
const migration = spawnSync(process.execPath, [wrangler, 'd1', 'migrations', 'apply', 'site-creator-d1', '--local', ...common], { stdio: 'inherit', env: environment });
if (migration.error || migration.status !== 0) {
  console.error('Unable to initialize the local D1 database.', migration.error || '');
  process.exit(migration.status || 1);
}

const port = process.env.PORT || '10000';
const server = spawn(process.execPath, [wrangler, 'dev', '--local', '--ip', '0.0.0.0', '--port', port, '--inspector-port', '0', ...common], { stdio: 'inherit', env: environment });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code || 0));
