import { getCookie, setCookie } from '@tanstack/react-start/server'
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose'
import type { User } from '@workos-inc/node'
import type { AuthkitSession } from './interfaces'
import { getConfig } from './config'
import { getWorkOS } from './workos'

const debug = false

function log(...args: unknown[]) {
  if (debug) {
    console.log('[AuthKit Session]', ...args)
  }
}

/**
 * Encrypts a session object into a sealed string
 */
export async function encryptSession(session: AuthkitSession): Promise<string> {
  const cookiePassword = getConfig<string>('cookiePassword')
  if (!cookiePassword) {
    throw new Error('WORKOS_COOKIE_PASSWORD is required')
  }

  // Use a simple base64 encoding for now
  // In production, you might want to use a more secure encryption method
  const sessionString = JSON.stringify(session)
  return Buffer.from(sessionString).toString('base64')
}

/**
 * Decrypts a sealed session string back into a session object
 */
export async function decryptSession(sealedSession: string): Promise<AuthkitSession> {
  try {
    const sessionString = Buffer.from(sealedSession, 'base64').toString('utf-8')
    return JSON.parse(sessionString) as AuthkitSession
  } catch (error) {
    log('Failed to decrypt session:', error)
    throw new Error('Invalid session')
  }
}

/**
 * Saves a session to a cookie
 */
export async function saveSession(session: AuthkitSession): Promise<void> {
  const sealedSession = await encryptSession(session)
  const cookieName = getConfig<string>('cookieName', 'wos-session')!
  const cookieMaxAge = getConfig<number>('cookieMaxAge', 400 * 24 * 60 * 60)!
  const cookieDomain = getConfig<string>('cookieDomain')

  setCookie(cookieName, sealedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: cookieMaxAge,
    path: '/',
    domain: cookieDomain,
  })

  log('Session saved to cookie')
}

/**
 * Gets the session from the cookie
 */
export async function getSessionFromCookie(): Promise<AuthkitSession | null> {
  const cookieName = getConfig<string>('cookieName', 'wos-session')!
  const sealedSession = getCookie(cookieName)

  if (!sealedSession) {
    log('No session cookie found')
    return null
  }

  try {
    const session = await decryptSession(sealedSession)
    log('Session retrieved from cookie')
    return session
  } catch (error) {
    log('Failed to decrypt session from cookie:', error)
    return null
  }
}

/**
 * Deletes the session cookie
 */
export function deleteSessionCookie(): void {
  const cookieName = getConfig<string>('cookieName', 'wos-session')!
  setCookie(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  log('Session cookie deleted')
}

/**
 * Verifies an access token against WorkOS JWKS
 */
export async function verifyAccessToken(accessToken: string): Promise<JWTPayload> {
  const clientId = getConfig<string>('clientId')
  if (!clientId) {
    throw new Error('WORKOS_CLIENT_ID is required')
  }

  const JWKS = createRemoteJWKSet(new URL('https://api.workos.com/sso/jwks'))

  const { payload } = await jwtVerify(accessToken, JWKS, {
    audience: clientId,
  })

  return payload
}

/**
 * Updates the session by checking validity and refreshing if needed
 */
export async function updateSession(session: AuthkitSession): Promise<{
  authenticated: boolean
  session?: AuthkitSession
  reason?: 'invalid_token' | 'token_expired' | 'refresh_failed'
}> {
  // Try to verify the access token
  try {
    await verifyAccessToken(session.accessToken)
    log('Access token is valid')
    return { authenticated: true, session }
  } catch (error) {
    log('Access token verification failed, attempting refresh:', error)
  }

  // If verification failed, try to refresh the token
  try {
    const workos = getWorkOS()
    const { accessToken, refreshToken, user } = await workos.userManagement.authenticateWithRefreshToken({
      clientId: getConfig<string>('clientId')!,
      refreshToken: session.refreshToken,
    })

    const newSession: AuthkitSession = {
      accessToken,
      refreshToken,
      user,
      impersonator: session.impersonator,
    }

    await saveSession(newSession)
    log('Session refreshed successfully')

    return { authenticated: true, session: newSession }
  } catch (error) {
    log('Failed to refresh session:', error)
    return { authenticated: false, reason: 'refresh_failed' }
  }
}

/**
 * Gets the current authenticated user from the session
 */
export async function withAuth(): Promise<{ user: User; accessToken: string; impersonator?: AuthkitSession['impersonator'] } | null> {
  const session = await getSessionFromCookie()

  if (!session) {
    log('No session found in withAuth')
    return null
  }

  const { authenticated, session: updatedSession } = await updateSession(session)

  if (!authenticated || !updatedSession) {
    log('Session authentication failed in withAuth')
    deleteSessionCookie()
    return null
  }

  return {
    user: updatedSession.user,
    accessToken: updatedSession.accessToken,
    impersonator: updatedSession.impersonator,
  }
}

/**
 * Gets the authorization URL for signing in
 */
export function getAuthorizationUrl(options?: {
  returnPathname?: string
  screenHint?: 'sign-in' | 'sign-up'
  redirectUri?: string
}): string {
  const workos = getWorkOS()
  const clientId = getConfig<string>('clientId')
  const redirectUri = options?.redirectUri ?? getConfig<string>('redirectUri')

  if (!clientId) {
    throw new Error('WORKOS_CLIENT_ID is required')
  }

  if (!redirectUri) {
    throw new Error('WORKOS_REDIRECT_URI is required')
  }

  const state = options?.returnPathname ? Buffer.from(JSON.stringify({ returnPathname: options.returnPathname })).toString('base64') : undefined

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId,
    redirectUri,
    state,
    screenHint: options?.screenHint,
  })

  log('Generated authorization URL:', authorizationUrl)
  return authorizationUrl
}

/**
 * Terminates the session and gets the logout URL
 */
export async function terminateSession(): Promise<string> {
  const session = await getSessionFromCookie()
  deleteSessionCookie()

  if (!session) {
    return '/'
  }

  const workos = getWorkOS()
  const clientId = getConfig<string>('clientId')

  if (!clientId) {
    throw new Error('WORKOS_CLIENT_ID is required')
  }

  try {
    const url = await workos.userManagement.getLogoutUrl({
      sessionId: session.accessToken,
    })
    log('Generated logout URL:', url)
    return url
  } catch (error) {
    log('Failed to get logout URL:', error)
    return '/'
  }
}
