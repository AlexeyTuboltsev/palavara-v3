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
});
