/**
 * E2E test selectors and scenarios for Bookmarks feature.
 *
 * Endpoints:
 *   POST   /api/bookmarks           - Create bookmark (requires auth)
 *   DELETE /api/bookmarks/:articleId - Remove bookmark (requires auth)
 *   GET    /api/bookmarks           - List user bookmarks (requires auth, paginated)
 *
 * Test scenarios:
 *   1. Authenticated user can bookmark an article (201)
 *   2. Duplicate bookmark returns unique constraint error (422)
 *   3. Bookmark non-existent article returns 404
 *   4. Unauthenticated request returns 401
 *   5. User can list their bookmarks with pagination
 *   6. User can remove a bookmark (200)
 *   7. Removing non-existent bookmark returns 404
 *   8. Bookmark list returns articles without body field
 */

export const selectors = {
    bookmarkButton: '[data-testid="bookmark-button"]',
    bookmarkCount: '[data-testid="bookmark-count"]',
    bookmarkList: '[data-testid="bookmark-list"]',
    bookmarkItem: '[data-testid="bookmark-item"]',
};
