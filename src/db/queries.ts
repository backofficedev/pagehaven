import { eq, and } from 'drizzle-orm'
import { db } from './index'
import { users, tenants, tenantDomains, tenantMemberships } from './schema'

// ============================================================================
// User Queries
// ============================================================================

export async function getUser(id: string) {
  return db.select().from(users).where(eq(users.id, id)).get()
}

export async function getUserByWorkOsId(workosUserId: string) {
  return db.select().from(users).where(eq(users.workosUserId, workosUserId)).get()
}

export async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).get()
}

export async function createUser(data: {
  id: string
  workosUserId: string | null
  email: string
  name?: string | null
}) {
  return db.insert(users).values({
    id: data.id,
    workosUserId: data.workosUserId,
    email: data.email,
    name: data.name,
  }).returning().get()
}

export async function upsertUserByWorkOsId(data: {
  workosUserId: string
  email: string
  name?: string | null
}) {
  const existing = await getUserByWorkOsId(data.workosUserId)
  if (existing) {
    return existing
  }

  // Generate a simple ID (in production, use a proper UUID library)
  const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return createUser({
    id,
    workosUserId: data.workosUserId,
    email: data.email,
    name: data.name,
  })
}

// ============================================================================
// Tenant Queries
// ============================================================================

export async function getTenant(id: string) {
  return db.select().from(tenants).where(eq(tenants.id, id)).get()
}

export async function getTenantBySlug(slug: string) {
  return db.select().from(tenants).where(eq(tenants.slug, slug)).get()
}

export async function getTenantByDomain(domain: string) {
  const tenantDomain = await db
    .select()
    .from(tenantDomains)
    .where(eq(tenantDomains.domain, domain))
    .get()

  if (!tenantDomain) return null

  return getTenant(tenantDomain.tenantId)
}

export async function createTenant(data: {
  id: string
  slug: string
  name: string
  authMode?: 'public' | 'workos'
  workosOrgId?: string | null
}) {
  const r2Prefix = `tenants/${data.id}/`

  return db.insert(tenants).values({
    id: data.id,
    slug: data.slug,
    name: data.name,
    r2Prefix,
    authMode: data.authMode || 'public',
    workosOrgId: data.workosOrgId,
  }).returning().get()
}

export async function updateTenant(id: string, data: {
  name?: string
  slug?: string
  authMode?: 'public' | 'workos'
  workosOrgId?: string | null
}) {
  return db.update(tenants)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tenants.id, id))
    .returning()
    .get()
}

export async function incrementTenantVersion(id: string) {
  const tenant = await getTenant(id)
  if (!tenant) throw new Error('Tenant not found')

  return db.update(tenants)
    .set({
      version: tenant.version + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tenants.id, id))
    .returning()
    .get()
}

// ============================================================================
// Tenant Domain Queries
// ============================================================================

export async function getTenantDomains(tenantId: string) {
  return db.select().from(tenantDomains).where(eq(tenantDomains.tenantId, tenantId)).all()
}

export async function addTenantDomain(tenantId: string, domain: string) {
  const id = `dom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return db.insert(tenantDomains).values({
    id,
    tenantId,
    domain,
  }).returning().get()
}

export async function removeTenantDomain(id: string) {
  return db.delete(tenantDomains).where(eq(tenantDomains.id, id))
}

// ============================================================================
// Tenant Membership Queries
// ============================================================================

export async function getTenantMemberships(userId: string) {
  return db
    .select({
      membership: tenantMemberships,
      tenant: tenants,
    })
    .from(tenantMemberships)
    .leftJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
    .where(
      and(
        eq(tenantMemberships.userId, userId),
        eq(tenantMemberships.status, 'active')
      )
    )
    .all()
}

export async function getTenantMembers(tenantId: string) {
  return db
    .select({
      membership: tenantMemberships,
      user: users,
    })
    .from(tenantMemberships)
    .leftJoin(users, eq(tenantMemberships.userId, users.id))
    .where(
      and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.status, 'active')
      )
    )
    .all()
}

export async function getUserRoleInTenant(userId: string, tenantId: string) {
  const membership = await db
    .select()
    .from(tenantMemberships)
    .where(
      and(
        eq(tenantMemberships.userId, userId),
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.status, 'active')
      )
    )
    .get()

  return membership?.role || null
}

export async function addTenantMembership(data: {
  tenantId: string
  userId: string
  role: 'admin' | 'viewer'
}) {
  const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return db.insert(tenantMemberships).values({
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    role: data.role,
    status: 'active',
  }).returning().get()
}

export async function updateTenantMembership(id: string, data: {
  role?: 'admin' | 'viewer'
  status?: string
}) {
  return db.update(tenantMemberships)
    .set(data)
    .where(eq(tenantMemberships.id, id))
    .returning()
    .get()
}

export async function removeTenantMembership(id: string) {
  return db.update(tenantMemberships)
    .set({ status: 'removed' })
    .where(eq(tenantMemberships.id, id))
}

// ============================================================================
// Authorization Helpers
// ============================================================================

export async function userCanAccessTenant(userId: string, tenantId: string): Promise<boolean> {
  const role = await getUserRoleInTenant(userId, tenantId)
  return role !== null
}

export async function userIsAdminOfTenant(userId: string, tenantId: string): Promise<boolean> {
  const role = await getUserRoleInTenant(userId, tenantId)
  return role === 'admin'
}
