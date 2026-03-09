import { describe, test, expect } from 'bun:test';
import HttpException from '~/models/http-exception.model';
import { requireModerator, requireAdmin, requireNotBanned } from './moderation.service';

describe('moderation.service', () => {
    describe('requireModerator', () => {
        test('allows moderator role', () => {
            expect(() => requireModerator({ moderatorRole: 'moderator' })).not.toThrow();
        });

        test('allows admin role', () => {
            expect(() => requireModerator({ moderatorRole: 'admin' })).not.toThrow();
        });

        test('rejects user role', () => {
            expect(() => requireModerator({ moderatorRole: 'user' })).toThrow(HttpException);
        });
    });

    describe('requireAdmin', () => {
        test('allows admin role', () => {
            expect(() => requireAdmin({ moderatorRole: 'admin' })).not.toThrow();
        });

        test('rejects moderator role', () => {
            expect(() => requireAdmin({ moderatorRole: 'moderator' })).toThrow(HttpException);
        });

        test('rejects user role', () => {
            expect(() => requireAdmin({ moderatorRole: 'user' })).toThrow(HttpException);
        });
    });

    describe('requireNotBanned', () => {
        test('allows non-banned user', () => {
            expect(() => requireNotBanned({ isBanned: false })).not.toThrow();
        });

        test('rejects banned user', () => {
            expect(() => requireNotBanned({ isBanned: true })).toThrow(HttpException);
        });
    });
});
