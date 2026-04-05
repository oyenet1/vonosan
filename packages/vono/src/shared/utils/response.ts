/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface ApiResponseBody<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string> | string[]
}

// ─── Class — primary pattern ────────────────────────────────────────

export class ApiResponse {
  /**
   * Return a successful response body.
   * @example return c.json(ApiResponse.success(plans, 'Plans loaded'))
   */
  static success<T>(data: T, message = 'Success'): ApiResponseBody<T> {
    return { success: true, message, data }
  }

  /**
   * Return a failure response body.
   * @example return c.json(ApiResponse.failure('Not found'), 404)
   */
  static failure(
    message = 'Something went wrong',
    errors?: Record<string, string> | string[],
  ): ApiResponseBody<null> {
    return {
      success: false,
      message,
      ...(errors !== undefined ? { errors } : {}),
    }
  }
}

// ─── Convenience aliases ────────────────────────────────────────────

/**
 * Shorthand for ApiResponse.success(data, message)
 * @example return c.json(success('Plans loaded', plans))
 */
export function success<T>(message: string, data: T): ApiResponseBody<T> {
  return ApiResponse.success(data, message)
}

/**
 * Shorthand for ApiResponse.failure(message, errors)
 * @example return c.json(error('Not found'), 404)
 */
export function error(
  message: string,
  errors?: Record<string, string> | string[],
): ApiResponseBody<null> {
  return ApiResponse.failure(message, errors)
}
