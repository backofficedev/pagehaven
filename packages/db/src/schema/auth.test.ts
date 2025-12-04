/**
 * Schema tests for authentication-related database tables
 * Tests table structure and exported schema objects
 */
import { describe, expect, it } from "vitest";
import { account, session, user, verification } from "./auth";

describe("Auth Schema", () => {
  describe("smoke tests", () => {
    it("exports user table", () => {
      expect(user).toBeDefined();
    });

    it("exports session table", () => {
      expect(session).toBeDefined();
    });

    it("exports account table", () => {
      expect(account).toBeDefined();
    });

    it("exports verification table", () => {
      expect(verification).toBeDefined();
    });
  });

  describe("user table structure", () => {
    it("has id column", () => {
      expect(user.id).toBeDefined();
    });

    it("has name column", () => {
      expect(user.name).toBeDefined();
    });

    it("has email column", () => {
      expect(user.email).toBeDefined();
    });

    it("has emailVerified column", () => {
      expect(user.emailVerified).toBeDefined();
    });

    it("has image column", () => {
      expect(user.image).toBeDefined();
    });

    it("has createdAt column", () => {
      expect(user.createdAt).toBeDefined();
    });

    it("has updatedAt column", () => {
      expect(user.updatedAt).toBeDefined();
    });
  });

  describe("session table structure", () => {
    it("has id column", () => {
      expect(session.id).toBeDefined();
    });

    it("has expiresAt column", () => {
      expect(session.expiresAt).toBeDefined();
    });

    it("has token column", () => {
      expect(session.token).toBeDefined();
    });

    it("has userId column", () => {
      expect(session.userId).toBeDefined();
    });

    it("has ipAddress column", () => {
      expect(session.ipAddress).toBeDefined();
    });

    it("has userAgent column", () => {
      expect(session.userAgent).toBeDefined();
    });

    it("has createdAt column", () => {
      expect(session.createdAt).toBeDefined();
    });

    it("has updatedAt column", () => {
      expect(session.updatedAt).toBeDefined();
    });
  });

  describe("account table structure", () => {
    it("has id column", () => {
      expect(account.id).toBeDefined();
    });

    it("has accountId column", () => {
      expect(account.accountId).toBeDefined();
    });

    it("has providerId column", () => {
      expect(account.providerId).toBeDefined();
    });

    it("has userId column", () => {
      expect(account.userId).toBeDefined();
    });

    it("has accessToken column", () => {
      expect(account.accessToken).toBeDefined();
    });

    it("has refreshToken column", () => {
      expect(account.refreshToken).toBeDefined();
    });

    it("has idToken column", () => {
      expect(account.idToken).toBeDefined();
    });

    it("has accessTokenExpiresAt column", () => {
      expect(account.accessTokenExpiresAt).toBeDefined();
    });

    it("has refreshTokenExpiresAt column", () => {
      expect(account.refreshTokenExpiresAt).toBeDefined();
    });

    it("has scope column", () => {
      expect(account.scope).toBeDefined();
    });

    it("has password column", () => {
      expect(account.password).toBeDefined();
    });

    it("has createdAt column", () => {
      expect(account.createdAt).toBeDefined();
    });

    it("has updatedAt column", () => {
      expect(account.updatedAt).toBeDefined();
    });
  });

  describe("verification table structure", () => {
    it("has id column", () => {
      expect(verification.id).toBeDefined();
    });

    it("has identifier column", () => {
      expect(verification.identifier).toBeDefined();
    });

    it("has value column", () => {
      expect(verification.value).toBeDefined();
    });

    it("has expiresAt column", () => {
      expect(verification.expiresAt).toBeDefined();
    });

    it("has createdAt column", () => {
      expect(verification.createdAt).toBeDefined();
    });

    it("has updatedAt column", () => {
      expect(verification.updatedAt).toBeDefined();
    });
  });

  describe("table exports", () => {
    it("user table is a valid drizzle table", () => {
      expect(typeof user).toBe("object");
      expect(user.id).toBeDefined();
    });

    it("session table is a valid drizzle table", () => {
      expect(typeof session).toBe("object");
      expect(session.id).toBeDefined();
    });

    it("account table is a valid drizzle table", () => {
      expect(typeof account).toBe("object");
      expect(account.id).toBeDefined();
    });

    it("verification table is a valid drizzle table", () => {
      expect(typeof verification).toBe("object");
      expect(verification.id).toBeDefined();
    });
  });
});
