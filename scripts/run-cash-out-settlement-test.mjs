import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const currentFile = fileURLToPath(import.meta.url);

const scriptsDirectory = path.dirname(currentFile);

const projectRoot = path.resolve(scriptsDirectory, '..');

const sourceDirectory = path.resolve(projectRoot, 'src');

const requestedModule =
  process.argv[2] ?? 'src/services/cash-out-settlement-destinations.test.ts';

const normalizedModule = requestedModule.replace(/\\/g, '/');

if (
  !normalizedModule.startsWith('src/') ||
  !normalizedModule.endsWith('.test.ts')
) {
  throw new Error(
    'Cash-out settlement test runner only accepts src/.../*.test.ts modules.'
  );
}

const server = await createServer({
  root: projectRoot,

  configFile: false,

  appType: 'custom',

  logLevel: 'error',

  server: {
    middlewareMode: true,
  },

  resolve: {
    alias: [
      {
        find: /^src\//,

        replacement: `${sourceDirectory}/`,
      },
      {
        find: 'src',

        replacement: sourceDirectory,
      },
    ],
  },
});

try {
  await server.ssrLoadModule(`/${normalizedModule}`);
} finally {
  await server.close();
}
