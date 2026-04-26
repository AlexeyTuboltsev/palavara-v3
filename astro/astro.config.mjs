import { defineConfig } from 'astro/config';

// Spike build — renders fully static HTML for each page.
// Images are loaded from be.palavara.com (same as the current site),
// so this config has no image integration deps.
export default defineConfig({
  site: 'https://studio.palavara.com',
  output: 'static',
  build: {
    format: 'directory', // /about-me/index.html instead of /about-me.html
  },
  vite: {
    css: {
      modules: {
        // Ported SCSS modules use kebab-case (`.menu-item`, `.logo-blue`)
        // but the components reference them via camelCase (`styles.menuItem`).
        // Expose both keys so the lookups resolve.
        localsConvention: 'camelCase',
      },
    },
  },
});
