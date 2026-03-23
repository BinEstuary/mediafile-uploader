import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryPathParts = process.env.GITHUB_REPOSITORY?.split('/');
const repositoryName =
  repositoryPathParts?.length === 2 ? repositoryPathParts[1] : undefined;
const base =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName
    ? `/${repositoryName}/`
    : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/files': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
