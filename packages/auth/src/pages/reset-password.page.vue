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
import { useRouter } from 'vue-router'

const router = useRouter()
const form = reactive({ email: '', otp: '', password: '' })
const isLoading = ref(false)
const error = ref('')

async function handleSubmit() {
  isLoading.value = true
  error.value = ''
  try {
    await $fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { email: form.email, otp: form.otp, password: form.password },
    })
    router.push('/login')
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
        <h1 class="text-xl font-semibold">Reset password</h1>
      </template>

      <UForm :state="form" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Email" name="email">
          <UInput v-model="form.email" type="email" placeholder="you@example.com" />
        </UFormField>

        <UFormField label="Reset code" name="otp">
          <UInput v-model="form.otp" placeholder="123456" maxlength="6" />
        </UFormField>

        <UFormField label="New password" name="password">
          <UInput v-model="form.password" type="password" placeholder="••••••••" />
        </UFormField>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <UButton type="submit" :loading="isLoading" block>Reset password</UButton>
      </UForm>
    </UCard>
  </div>
</template>
