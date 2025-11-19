# TODO

## File Upload and Serving Model Rework

- When a zip file is uploaded, unzip it **once and only once** during the upload process
- Store the extracted HTML/CSS files directly (no need to keep the zip or re-extract)
- When files are served, the server should never need to unzip - the raw HTML/CSS files should be ready to go
- These extracted files can be served via a CDN or similar static file serving mechanism

## JWT-Based Auth Token System for Client Sites (HIGH PRIORITY)

**Problem**: Currently every file request in a client site (HTML, CSS, JS, images) triggers a database query to check authentication. For a site with 50 files, that's 50 database queries per page load.

**Solution**: Implement JWT-based session tokens for site access

### Implementation Steps:
1. **Add JWT library**: Install `jose` package for JWT signing/verification
2. **Token issuance endpoint**: Create HTTP endpoint to issue tokens on first site access
   - Check user authentication and site access (one-time DB query)
   - Generate JWT with: `{ userId, siteId, accessLevel, exp }`
   - Sign with secret key
   - Set httpOnly cookie: `pagehaven_site_auth_{siteId}`
   - Token expiry: 1 hour (configurable)

3. **Token validation in router**: Modify `convex/router.ts` `serveSiteFile` function
   - Check for existing valid token in cookie
   - If valid token exists, skip DB auth check
   - If no token or expired, issue new token (with DB check)
   - Validate token signature cryptographically (no DB query)

4. **Token refresh mechanism**: Auto-refresh tokens before expiry
   - When token has <10 min remaining, issue new token
   - Seamless user experience

5. **Security considerations**:
   - httpOnly cookies prevent XSS attacks
   - Short expiry (1 hour) limits exposure
   - Cryptographic signing prevents forgery
   - Revocation: tokens auto-expire, or clear cookie on logout

### Expected Impact:
- **90% reduction** in auth overhead for client site navigation
- Database queries only on first access and hourly refresh
- Faster page loads, especially for asset-heavy sites

### Files to modify:
- `convex/router.ts` - Add JWT validation logic
- `convex/http.ts` - Token issuance endpoint
- `package.json` - Add `jose` dependency

### Testing:
- Verify token issuance on first site access
- Verify subsequent requests use token (no DB query)
- Verify token expiry and refresh
- Test with both public and authenticated sites
- Security audit: token signing, cookie security

