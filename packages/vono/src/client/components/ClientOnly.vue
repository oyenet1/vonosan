<!--
  ──────────────────────────────────────────────────────────────────
  🏢 Company Name: Bonifade Technologies
  👨‍💻 Developer: Bowofade Oyerinde
  🐙 GitHub: oyenet1
  📅 Created Date: 2026-04-05
  🔄 Updated Date: 2026-04-05
  ──────────────────────────────────────────────────────────────────

  ClientOnly — renders its slot only after client-side mount.

  Use this to wrap components that use browser-only APIs
  (window, document, localStorage, etc.) that would crash SSR.

  Usage:
  <ClientOnly>
    <HeavyChart :data="chartData" />
    <template #fallback>
      <div class="skeleton">Loading chart...</div>
    </template>
  </ClientOnly>
-->
<template>
  <slot v-if="mounted" />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
</script>
