import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  dts: true,
  tsconfig: './tsconfig.json',
  format: ['cjs'],
  shims: true,
});
