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
