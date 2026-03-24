import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'StateDB',
  description: 'Lightweight reactive database with MongoDB-style API',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#d97706' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'StateDB' }],
    ['meta', { property: 'og:description', content: 'Lightweight reactive database with MongoDB-style API' }],
    ['meta', { property: 'og:url', content: 'https://statedb.phpdot.com' }],
  ],

  themeConfig: {
    siteTitle: 'StateDB',

    nav: [
      { text: 'Guide', link: '/getting-started/installation' },
      { text: 'API', link: '/api/statedb' },
      { text: 'Examples', link: '/examples/todo-app' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/phpdot/statedb/releases' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@phpdot/statedb' },
        ],
      },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Quick Start', link: '/getting-started/quick-start' },
            { text: 'Browser Usage', link: '/getting-started/browser-usage' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'Essentials',
          items: [
            { text: 'CRUD Operations', link: '/guide/crud-operations' },
            { text: 'Query Operators', link: '/guide/query-operators' },
            { text: 'Update Operators', link: '/guide/update-operators' },
            { text: 'Chainable Queries', link: '/guide/chainable-queries' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Watchers (Reactivity)', link: '/guide/watchers' },
            { text: 'Schema Validation', link: '/guide/schema-validation' },
            { text: 'Indexes', link: '/guide/indexes' },
            { text: 'Hooks (Middleware)', link: '/guide/hooks' },
            { text: 'Persistence', link: '/guide/persistence' },
            { text: 'Export / Import', link: '/guide/export-import' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'StateDB', link: '/api/statedb' },
            { text: 'Collection', link: '/api/collection' },
            { text: 'QueryResult', link: '/api/query-result' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Todo App', link: '/examples/todo-app' },
            { text: 'Reactive UI', link: '/examples/reactive-ui' },
            { text: 'With Livewire / HTMX', link: '/examples/with-livewire' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/phpdot/statedb' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@phpdot/statedb' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026 Omar Hamdan',
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
