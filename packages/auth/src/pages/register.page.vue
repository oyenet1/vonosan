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

const { register, isLoading, error } = useAuth()

const form = reactive({ email: '', password: '', username: '' })

async function handleSubmit() {
  await register(form.email, form.password, form.username || undefined)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Create account</h1>
      </template>

      <UForm :state="form" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Username" name="username">
          <UInput v-model="form.username" placeholder="johndoe" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="form.email" type="email" placeholder="you@example.com" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="form.password" type="password" placeholder="••••••••" />
        </UFormField>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <UButton type="submit" :loading="isLoading" block>Create account</UButton>
      </UForm>

      <template #footer>
        <p class="text-sm text-center">
          Already have an account?
          <RouterLink to="/login" class="text-primary-500 hover:underline">Sign in</RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
