import { describe, test, expect } from 'bun:test';

// Test the rule matching logic directly (without DB)
describe('rule matching logic', () => {
    function matchBannedWords(content: string, pattern: string): boolean {
        const words = pattern.split(',').map(w => w.trim().toLowerCase());
        return words.some(word => content.toLowerCase().includes(word));
    }

    function matchSpamPattern(content: string, pattern: string): boolean {
        try {
            const regex = new RegExp(pattern, 'i');
            return regex.test(content);
        } catch {
            return false;
        }
    }

    function matchContentLength(content: string, pattern: string): boolean {
        const maxLength = parseInt(pattern, 10);
        return !isNaN(maxLength) && content.length > maxLength;
    }

    test('banned_words matches case-insensitively', () => {
        expect(matchBannedWords('This is SPAM content', 'spam,scam')).toBe(true);
        expect(matchBannedWords('This is normal content', 'spam,scam')).toBe(false);
    });

    test('banned_words matches multiple words', () => {
        expect(matchBannedWords('Buy cheap stuff', 'cheap,free,discount')).toBe(true);
        expect(matchBannedWords('Get it free now', 'cheap,free,discount')).toBe(true);
    });

    test('spam_pattern matches regex patterns', () => {
        expect(matchSpamPattern('Buy now!!! Click here!!!', '!{3,}')).toBe(true);
        expect(matchSpamPattern('Normal sentence.', '!{3,}')).toBe(false);
    });

    test('spam_pattern handles invalid regex gracefully', () => {
        expect(matchSpamPattern('anything', '[')).toBe(false);
    });

    test('content_length flags content exceeding max length', () => {
        expect(matchContentLength('short', '100')).toBe(false);
        expect(matchContentLength('a'.repeat(101), '100')).toBe(true);
    });

    test('content_length handles non-numeric pattern', () => {
        expect(matchContentLength('test', 'abc')).toBe(false);
    });
});
