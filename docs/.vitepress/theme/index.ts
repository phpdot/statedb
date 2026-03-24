import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import HomeFeatures from './HomeFeatures.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeFeatures', HomeFeatures);
  },
} satisfies Theme;
