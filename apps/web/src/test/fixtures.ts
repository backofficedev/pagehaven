/**
 * Shared test fixtures for web app tests
 */

/**
 * Creates a mock session object for testing authenticated components
 */
export function createMockSession(overrides?: {
  user?: Partial<MockSession["user"]>;
  session?: Partial<MockSession["session"]>;
}): MockSession {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides?.user,
    },
    session: {
      id: "session-1",
      userId: "user-1",
      token: "test-token",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
      ...overrides?.session,
    },
  };
}

export type MockSession = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
};

/**
 * Common test credentials
 */
export const TEST_CREDENTIALS = {
  email: "test@example.com",
  password: "password123",
  name: "Test User",
} as const;

/**
 * Common error messages
 */
export const TEST_ERRORS = {
  invalidCredentials: "Invalid credentials",
  emailExists: "Email already exists",
  unauthorized: "Unauthorized",
} as const;

/**
 * Mock sites data for testing
 */
export const MOCK_SITES = [
  {
    id: "site-1",
    name: "My First Site",
    subdomain: "first-site",
    role: "owner",
    activeDeploymentId: "deploy-1",
  },
  {
    id: "site-2",
    name: "My Second Site",
    subdomain: "second-site",
    role: "admin",
    activeDeploymentId: null,
  },
] as const;
