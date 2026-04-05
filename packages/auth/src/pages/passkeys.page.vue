<!--
  ──────────────────────────────────────────────────────────────────
  🏢 Company Name: Bonifade Technologies
  👨‍💻 Developer: Bowofade Oyerinde
  🐙 GitHub: oyenet1
  📅 Created Date: 2026-04-05
  🔄 Updated Date: 2026-04-05
  ──────────────────────────────────────────────────────────────────

  Passkeys management page — /auth/passkeys
  Allows authenticated users to register, rename, and delete passkeys.
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import { usePasskey } from '../composables/usePasskey.js'

const {
  loading,
  error,
  credentials,
  registerPasskey,
  fetchCredentials,
  renameCredential,
  deleteCredential,
  isSupported,
} = usePasskey()

onMounted(() => fetchCredentials())

async function handleRegister() {
  const name = prompt('Name this passkey (e.g. "iPhone 15"):') ?? undefined
  const result = await registerPasskey(name)
  if (result) {
    alert('Passkey registered successfully!')
  }
}

async function handleRename(credentialId: string, currentName: string | null) {
  const name = prompt('New name:', currentName ?? '')
  if (name) await renameCredential(credentialId, name)
}

async function handleDelete(credentialId: string) {
  if (confirm('Delete this passkey? You will not be able to use it to sign in.')) {
    await deleteCredential(credentialId)
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold mb-2">Passkeys</h1>
    <p class="text-gray-500 mb-6">
      Passkeys let you sign in with your device's biometrics — no password needed.
    </p>

    <!-- Not supported -->
    <UAlert
      v-if="!isSupported()"
      color="warning"
      icon="i-lucide-alert-triangle"
      title="Passkeys not supported"
      description="Your browser does not support passkeys. Try Chrome, Safari, or Edge."
      class="mb-6"
    />

    <!-- Error -->
    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-x-circle"
      :title="error"
      class="mb-6"
    />

    <!-- Register button -->
    <UButton
      v-if="isSupported()"
      icon="i-lucide-fingerprint"
      :loading="loading"
      class="mb-8"
      @click="handleRegister"
    >
      Add a passkey
    </UButton>

    <!-- Credentials list -->
    <div v-if="credentials.length > 0" class="space-y-3">
      <h2 class="text-lg font-semibold">Your passkeys</h2>

      <UCard
        v-for="cred in credentials"
        :key="cred.id"
        class="flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <UIcon
            :name="cred.device_type === 'platform' ? 'i-lucide-smartphone' : 'i-lucide-key'"
            class="text-xl text-gray-500"
          />
          <div>
            <p class="font-medium">{{ cred.name ?? 'Unnamed passkey' }}</p>
            <p class="text-sm text-gray-400">
              {{ cred.device_type === 'platform' ? 'Device passkey' : 'Security key' }}
              <span v-if="cred.backed_up"> · Synced</span>
              <span v-if="cred.last_used_at">
                · Last used {{ new Date(cred.last_used_at).toLocaleDateString() }}
              </span>
            </p>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            variant="ghost"
            icon="i-lucide-pencil"
            size="sm"
            @click="handleRename(cred.credential_id, cred.name)"
          />
          <UButton
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            size="sm"
            @click="handleDelete(cred.credential_id)"
          />
        </div>
      </UCard>
    </div>

    <p v-else-if="!loading" class="text-gray-400 text-sm">
      No passkeys registered yet. Add one above.
    </p>
  </div>
</template>
