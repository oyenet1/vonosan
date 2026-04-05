<!--
  ──────────────────────────────────────────────────────────────────
  🏢 Company Name: Bonifade Technologies
  👨‍💻 Developer: Bowofade Oyerinde
  🐙 GitHub: oyenet1
  📅 Created Date: 2026-04-05
  🔄 Updated Date: 2026-04-05
  ──────────────────────────────────────────────────────────────────
-->

<!--
  DashboardLayout — sidebar + main content area.
  Replace the sidebar placeholder with your navigation component.
-->
<template>
  <div class="min-h-screen flex">
    <!-- Sidebar placeholder — replace with your nav component -->
    <aside class="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <slot name="sidebar" />
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>
