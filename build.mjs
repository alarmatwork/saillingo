// Builds the game into dist/ as plain static files (index.html + app.js + app.css).
//   node build.mjs         production build
//   node build.mjs --dev   rebuild on change and serve on http://localhost:5173
import * as esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import { cp, readFile, rm, writeFile } from 'node:fs/promises';

const dev = process.argv.includes('--dev');

/**
 * Version and "What's new" come straight from the git history:
 * the version is the number of commits, and every commit subject is one entry.
 * A commit is left out when it is not something a player would notice:
 * put "[skip changelog]" anywhere in its message, or start the subject with
 * "Internal:". So: write commit subjects as plain sentences for players.
 *
 * The history was restarted on 2026-11-27 after version 53. Versions keep
 * counting from there (installed apps only update to a higher number), and the
 * earlier entries are kept in changelog-history.json.
 */
const EARLIER_VERSIONS = 53;
async function history() {
  const earlier = JSON.parse(await readFile('changelog-history.json', 'utf8'));
  try {
    const raw = execFileSync('git', ['log', '--date=short', '--format=%ad%x1f%s%x1f%b%x1e'], { encoding: 'utf8' });
    const commits = raw.split('\x1e').map((c) => c.trim()).filter(Boolean).map((c) => c.split('\x1f'));
    const hidden = /^(Initial commit|Internal:|Update GitHub Actions)/i;
    const changelog = commits
      .map(([date, subject, body = ''], i) => ({ v: EARLIER_VERSIONS + commits.length - i, date, text: subject, body }))
      .filter((e) => !hidden.test(e.text) && !/\[skip changelog\]/i.test(e.text + e.body))
      .map(({ v, date, text }) => ({ v, date, text }));
    return { version: String(EARLIER_VERSIONS + commits.length), changelog: [...changelog, ...earlier] };
  } catch {
    return { version: 'dev', changelog: earlier }; // no git available (e.g. a source download)
  }
}
const { version, changelog } = await history();

const options = {
  // sync.js holds the Firebase SDK and is only downloaded when a player signs in
  entryPoints: { app: 'src/main.ts', sync: 'src/cloud/sync-entry.ts' },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: !dev,
  sourcemap: dev,
  logLevel: 'info',
  define: { __VERSION__: JSON.stringify(version), __CHANGELOG__: JSON.stringify(changelog) },
};

await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });
// a new cache name per build makes installed copies pick up the update
const sw = await readFile('public/sw.js', 'utf8');
await writeFile('dist/sw.js', sw.replace('__BUILD__', Date.now().toString(36)));
// the running app compares this with its own version to notice a new release
await writeFile('dist/version.json', JSON.stringify({ version }));

if (dev) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: 'dist', port: 5173 });
  console.log(`Serving on http://localhost:${port}`);
} else {
  await esbuild.build(options);
  console.log(`Version ${version}, ${changelog.length} changelog entries`);
}
