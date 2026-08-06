import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
);
const softwareVersion = String(packageJson.version ?? '');

export default defineConfig({
  define: {
    __LINKETRY_SOFTWARE_VERSION__: JSON.stringify(softwareVersion),
  },
  plugins: [
    {
      name: 'linketry-software-version',
      transformIndexHtml(html) {
        return html.replace(
          /"softwareVersion"\s*:\s*"[^"]*"/g,
          `"softwareVersion": "${softwareVersion}"`
        );
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        home: new URL('./index.html', import.meta.url).pathname,
        deploy: new URL('./deploy/index.html', import.meta.url).pathname,
      },
    },
  },
});
