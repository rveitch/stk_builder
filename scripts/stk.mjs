import { build } from 'esbuild';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { fileURLToPath } from 'node:url';

try {
  const result = await build({
    entryPoints: [fileURLToPath(import.meta.resolve('../src/cli/main.ts'))],
    bundle: true, platform: 'node', format: 'esm', write: false,
  });
  const { main } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
