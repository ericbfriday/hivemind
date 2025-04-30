import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    typescript: './tsconfig.json',
    entry: ['./src/main.ts'],
    // format: ['cjs'/*, 'esm'*/],
    format: ['cjs', 'esm', 'iife'],
    splitting: false,
    sourceMap: true,
    // clean: !options.watch,
    // minify: !options.watch,
    // legacyOutput: true,
    cjsInterop: true,
    treeshake: false,
    shims: true,
    dts: true,
    target: 'node14',
    noExternal: ['lodash', 'lodash/*', 'source-map'],
    skipNodeModulesBundle: false,
    bundle: true,
    platform: 'node'
  }
})
