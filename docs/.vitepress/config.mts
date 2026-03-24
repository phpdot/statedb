import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'StateDB',
  description: 'Lightweight reactive database with MongoDB-style API',
  base: '/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#d97706' }],
    ['link', { rel: 'preconnect', href: 'https://api.fontshare.com' }],
    ['link', { rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap' }],
    ['link', { rel: 'stylesheet', href: 'https://unpkg.com/@phosphor-icons/web@2/src/regular/style.css' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'StateDB' }],
    ['meta', { property: 'og:description', content: 'Lightweight reactive database with MongoDB-style API' }],
    ['meta', { property: 'og:url', content: 'https://statedb.phpdot.com' }],
  ],

  sitemap: {
    hostname: 'https://statedb.phpdot.com',
  },

  themeConfig: {
    siteTitle: 'StateDB',
    logo: '/logo.svg',

    nav: [
      { text: 'Docs', link: '/docs/getting-started' },
      { text: 'API', link: '/docs/api' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/phpdot/statedb/releases' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@phpdot/statedb' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/docs/getting-started' },
          { text: 'Installation', link: '/docs/installation' },
          { text: 'Browser Usage', link: '/docs/browser-usage' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'CRUD Operations', link: '/docs/crud' },
          { text: 'Query Operators', link: '/docs/query-operators' },
          { text: 'Update Operators', link: '/docs/update-operators' },
          { text: 'Watchers', link: '/docs/watchers' },
          { text: 'Schema Validation', link: '/docs/schema' },
          { text: 'Indexes', link: '/docs/indexes' },
          { text: 'Hooks', link: '/docs/hooks' },
          { text: 'Persistence', link: '/docs/persistence' },
          { text: 'Export / Import', link: '/docs/export-import' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'API', link: '/docs/api' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Examples', link: '/docs/examples' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/phpdot/statedb' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@phpdot/statedb' },
    ],

    footer: {
      message: 'MIT Licensed',
      copyright: 'Built with <span style="color:#ef4444">&#10084;</span> by phpdot team',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/phpdot/statedb/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
