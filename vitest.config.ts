import { defineConfig } from 'vitest/config';
import viteConfigFn from './vite.config';

const viteConfig = viteConfigFn({ mode: 'test', command: 'serve' });

export default defineConfig({
    ...viteConfig,
    test: {
        globals: true,
        environment: 'jsdom',
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        exclude: ['tests/**/*', 'node_modules/**/*', 'dist/**/*'],
    },
});
