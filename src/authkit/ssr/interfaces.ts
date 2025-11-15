import type { User } from '@workos-inc/node'

export interface AuthkitSession {
  accessToken: string
  refreshToken: string
  user: User
  impersonator?: {
    email: string
    reason: string | null
  }
}

export interface EncryptedAuthkitSession {
  data: string
}
