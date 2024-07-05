import { defineConfig } from "tsup"

export default defineConfig({
    format:['cjs', 'esm'],
    entry:["./src/index.ts"],
    outDir: 'dist',
    dts:true,
    shims:true,
    skipNodeModulesBundle:true,
    clean:true,
    sourcemap: true,
})