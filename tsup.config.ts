import { defineConfig } from 'tsup';

const banner = {
  js: `/**
 * StateDB - Reactive Database with MongoDB-style API
 * https://github.com/phpdot/statedb
 * @author Omar Hamdan <omar@phpdot.com>
 * @license MIT
 */`,
};

export default defineConfig([
  // ESM + CJS (non-minified, for bundlers) + declarations
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    outDir: 'dist',
    banner,
    outExtension({ format }) {
      if (format === 'esm') return { js: '.mjs' };
      if (format === 'cjs') return { js: '.cjs' };
      return {};
    },
  },
  // IIFE non-minified (.js) — uses browser.ts so `new StateDB(...)` works directly
  {
    entry: { index: 'src/browser.ts' },
    format: ['iife'],
    globalName: 'StateDB',
    sourcemap: true,
    clean: false,
    minify: false,
    outDir: 'dist',
    banner,
    footer: {
      js: 'StateDB = StateDB.default;',
    },
    outExtension() {
      return { js: '.js' };
    },
  },
  // IIFE minified (.min.js)
  {
    entry: { index: 'src/browser.ts' },
    format: ['iife'],
    globalName: 'StateDB',
    sourcemap: true,
    clean: false,
    minify: true,
    outDir: 'dist',
    banner,
    footer: {
      js: 'StateDB = StateDB.default;',
    },
    outExtension() {
      return { js: '.min.js' };
    },
  },
]);
