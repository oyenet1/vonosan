/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface OpenApiSpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers: Array<{ url: string; description?: string }>
  tags: Array<{ name: string; description?: string }>
  components: {
    securitySchemes: Record<string, unknown>
    schemas: Record<string, unknown>
  }
  paths: Record<string, unknown>
}

// ─── generateOpenApiSpec ─────────────────────────────────────────────

/**
 * generateOpenApiSpec — returns a complete OpenAPI 3.1 spec object.
 *
 * Includes:
 *   - info, servers
 *   - tags: Health, Auth
 *   - components.securitySchemes: bearerAuth
 *   - components.schemas: SuccessResponse, ErrorResponse, PaginationMeta
 *
 * @example
 *   // src/openapi.ts
 *   export default generateOpenApiSpec('MyApp', '1.0.0', 'https://api.example.com')
 */
export function generateOpenApiSpec(
  appName: string,
  appVersion: string,
  serverUrl: string,
): OpenApiSpec {
  return {
    openapi: '3.1.0',

    info: {
      title: appName,
      version: appVersion,
      description: `${appName} REST API — powered by Vono`,
    },

    servers: [
      {
        url: serverUrl,
        description: 'Primary server',
      },
    ],

    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints',
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token. Obtain via POST /api/v1/auth/login',
        },
      },

      schemas: {
        SuccessResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              description: 'Response payload — shape varies by endpoint',
            },
          },
        },

        ErrorResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Something went wrong',
            },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              description: 'Field-level validation errors (422 responses)',
              example: { email: 'Invalid email address' },
            },
          },
        },

        PaginationMeta: {
          type: 'object',
          required: ['total', 'currentPage', 'totalPages', 'limit'],
          properties: {
            total: {
              type: 'integer',
              example: 100,
            },
            currentPage: {
              type: 'integer',
              example: 1,
            },
            totalPages: {
              type: 'integer',
              example: 10,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            nextPage: {
              type: ['integer', 'null'],
              example: 2,
            },
            prevPage: {
              type: ['integer', 'null'],
              example: null,
            },
          },
        },
      },
    },

    paths: {},
  }
}
