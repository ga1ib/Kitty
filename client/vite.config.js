import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: { port: 5173 },
    resolve: { alias: { '@': '/src' } },
    build: { rollupOptions: { output: { manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    if (/node_modules\/(react|react-dom|scheduler)\//.test(id))
                        return 'react-vendor';
                    if (/node_modules\/(react-router|react-router-dom)\//.test(id))
                        return 'router-vendor';
                    if (id.includes('node_modules/@tanstack/'))
                        return 'query-vendor';
                    if (id.includes('node_modules/framer-motion/'))
                        return 'motion-vendor';
                    if (id.includes('node_modules/lucide-react/'))
                        return 'icons-vendor';
                    return 'vendor';
                } } } },
});
