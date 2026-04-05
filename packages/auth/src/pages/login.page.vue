<!--
  ──────────────────────────────────────────────────────────────────
  🏢 Company Name: Bonifade Technologies
  👨‍💻 Developer: Bowofade Oyerinde
  🐙 GitHub: oyenet1
  📅 Created Date: 2026-04-05
  🔄 Updated Date: 2026-04-05
  ──────────────────────────────────────────────────────────────────
-->
<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { login, isLoading, error } = useAuth()

const form = reactive({ email: '', password: '' })

async function handleSubmit() {
  await login(form.email, form.password)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Sign in</h1>
      </template>

      <UForm :state="form" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Email" name="email">
          <UInput v-model="form.email" type="email" placeholder="you@example.com" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="form.password" type="password" placeholder="••••••••" />
        </UFormField>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <UButton type="submit" :loading="isLoading" block>Sign in</UButton>
      </UForm>

      <template #footer>
        <p class="text-sm text-center">
          Don't have an account?
          <RouterLink to="/register" class="text-primary-500 hover:underline">Register</RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
