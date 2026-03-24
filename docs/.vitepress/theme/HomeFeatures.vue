<script setup>
const features = [
  { icon: 'ph ph-magnifying-glass', title: 'MongoDB-Style API', details: 'Familiar query syntax with $gt, $in, $regex, $set, $inc, $push and more. If you know MongoDB, you know StateDB.' },
  { icon: 'ph ph-lightning', title: 'Reactive Watchers', details: 'Subscribe to insert, update, delete events per collection. Your UI re-renders automatically when data changes.' },
  { icon: 'ph ph-check-circle', title: 'Schema Validation', details: 'Type checking, required fields, min/max, enum, regex, defaults, and capped collections — validated on every write.' },
  { icon: 'ph ph-chart-bar', title: 'Indexes', details: 'Single and compound indexes with unique constraints. Queries use the best index automatically — up to 145x faster.' },
  { icon: 'ph ph-link', title: 'Hooks & Persistence', details: 'Pre/post middleware for insert, update, delete. Optional auto-save to localStorage or sessionStorage with debounce.' },
  { icon: 'ph ph-package', title: 'Zero Dependencies', details: '~20KB minified. Ships as ESM, CJS, and IIFE. Works in browsers, Node.js, and any JS runtime. Full TypeScript support.' },
]
</script>

<template>
  <div class="features-section">
    <div class="features-grid">
      <div v-for="f in features" :key="f.title" class="feature-card">
        <div class="feature-icon">
          <i :class="f.icon" aria-hidden="true"></i>
        </div>
        <h3>{{ f.title }}</h3>
        <p>{{ f.details }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.features-section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 64px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 960px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .features-grid { grid-template-columns: 1fr; }
}

.feature-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-top: 3px solid transparent;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  border-top-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

:root.dark .feature-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  margin-bottom: 16px;
}

.feature-icon i {
  font-size: 24px;
  color: var(--vp-c-brand-1);
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.feature-card p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
</style>
