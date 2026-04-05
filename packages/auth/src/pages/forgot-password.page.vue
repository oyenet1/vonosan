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
import { ref } from 'vue'

const email = ref('')
const isLoading = ref(false)
const sent = ref(false)
const error = ref('')

async function handleSubmit() {
  isLoading.value = true
  error.value = ''
  try {
    await $fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
    sent.value = true
  } catch (err: unknown) {
    error.value = (err as { data?: { message?: string } })?.data?.message ?? 'Something went wrong'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Forgot password</h1>
      </template>

      <div v-if="sent" class="text-center py-4">
        <p class="text-green-600">Check your email for a reset code.</p>
        <RouterLink to="/reset-password" class="text-primary-500 hover:underline mt-2 block">
          Enter reset code
        </RouterLink>
      </div>

      <UForm v-else :state="{ email }" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Email" name="email">
          <UInput v-model="email" type="email" placeholder="you@example.com" />
        </UFormField>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <UButton type="submit" :loading="isLoading" block>Send reset code</UButton>
      </UForm>
    </UCard>
  </div>
</template>
