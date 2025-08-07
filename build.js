#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { existsSync, mkdirSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true });
}

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['./src/js/main.js'],
  bundle: true,
  outfile: './dist/app.js',
  format: 'iife',
  globalName: 'BrimstoneApp',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  target: ['es2020'],
  loader: {
    '.js': 'js',
  },
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
  banner: {
    js: '/* BrimstoneLabs Website - Built with esbuild */',
  },
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('⚡ Build complete. Watching for changes...');
    } else {
      const result = await esbuild.build(buildOptions);
      console.log('✅ Production build complete');
      
      // Log build size
      if (result.metafile) {
        const outputs = Object.keys(result.metafile.outputs);
        outputs.forEach((output) => {
          const size = result.metafile.outputs[output].bytes;
          console.log(`📦 ${output}: ${(size / 1024).toFixed(2)}KB`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();