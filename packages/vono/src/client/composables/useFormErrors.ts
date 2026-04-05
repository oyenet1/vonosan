/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { ref, computed } from 'vue'

/**
 * Manage form validation errors from API responses.
 *
 * Maps the standard { errors: { field: message } } API error shape
 * directly to form field error display.
 *
 * Usage:
 * ```ts
 * const { errors, setErrors, clearErrors, getError } = useFormErrors()
 *
 * try {
 *   await submitForm()
 * } catch (err) {
 *   if (err.status === 422) setErrors(err.data.errors)
 * }
 * ```
 */
export function useFormErrors() {
  const errors = ref<Record<string, string>>({})
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  function setErrors(newErrors: Record<string, string> | string[] | undefined): void {
    if (!newErrors) return
    if (Array.isArray(newErrors)) {
      // Array of error strings — map to a generic key
      errors.value = newErrors.reduce<Record<string, string>>((acc, msg, i) => {
        acc[`error_${i}`] = msg
        return acc
      }, {})
    } else {
      errors.value = { ...newErrors }
    }
  }

  function clearErrors(field?: string): void {
    if (field) {
      const { [field]: _, ...rest } = errors.value
      errors.value = rest
    } else {
      errors.value = {}
    }
  }

  function getError(field: string): string | undefined {
    return errors.value[field]
  }

  return { errors, hasErrors, setErrors, clearErrors, getError }
}
