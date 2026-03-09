/**
 * E2E test selectors and scenarios for Reading Lists feature.
 *
 * Endpoints:
 *   POST   /api/reading-lists                        - Create reading list
 *   GET    /api/reading-lists                        - List user's reading lists
 *   PUT    /api/reading-lists/:id                    - Update reading list
 *   DELETE /api/reading-lists/:id                    - Delete reading list
 *   POST   /api/reading-lists/:id/articles           - Add article to list
 *   DELETE /api/reading-lists/:id/articles/:articleId - Remove article from list
 *   GET    /api/reading-lists/:id/articles           - Get articles in list
 *   GET    /api/profiles/:username/reading-lists     - Get user's public lists
 *
 * Test scenarios:
 *   1. Create reading list with name (201)
 *   2. Create reading list with all fields including isPublic (201)
 *   3. List reading lists includes article counts
 *   4. Update reading list name/description/visibility (owner only)
 *   5. Delete reading list removes all items (owner only)
 *   6. Non-owner gets 403 on update/delete
 *   7. Add article to reading list (201)
 *   8. Duplicate article in list returns 422
 *   9. Remove article from list (200)
 *   10. Get articles in public list (no auth required)
 *   11. Get articles in private list (owner only, 403 for others)
 *   12. Profile endpoint shows only public lists for non-owner
 *   13. Profile endpoint shows all lists for owner
 */

export const selectors = {
    readingListCard: '[data-testid="reading-list-card"]',
    readingListName: '[data-testid="reading-list-name"]',
    readingListDescription: '[data-testid="reading-list-description"]',
    readingListCount: '[data-testid="reading-list-article-count"]',
    addToListButton: '[data-testid="add-to-list-button"]',
    removeFromListButton: '[data-testid="remove-from-list-button"]',
    publicBadge: '[data-testid="public-badge"]',
    privateBadge: '[data-testid="private-badge"]',
};
