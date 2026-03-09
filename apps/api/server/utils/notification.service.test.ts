import { describe, test, expect } from 'bun:test';
import { getDefaultPreferences } from './notification.service';
import { updatePreferencesSchema } from '~/schemas/notification.schema';

describe('notification service', () => {
    describe('getDefaultPreferences', () => {
        test('returns all four notification types enabled by default', async () => {
            const prefs = await getDefaultPreferences();
            expect(prefs).toHaveLength(4);
            expect(prefs.map(p => p.notificationType)).toEqual(['follow', 'favorite', 'comment', 'reply']);
            expect(prefs.every(p => p.isEnabled)).toBe(true);
        });
    });
});

describe('notification schema validation', () => {
    test('accepts valid preferences update', () => {
        const result = updatePreferencesSchema.parse({
            preferences: [
                { type: 'follow', isEnabled: false },
                { type: 'comment', isEnabled: true },
            ],
        });
        expect(result.preferences).toHaveLength(2);
        expect(result.preferences[0].type).toBe('follow');
        expect(result.preferences[0].isEnabled).toBe(false);
    });

    test('accepts single preference', () => {
        const result = updatePreferencesSchema.parse({
            preferences: [{ type: 'favorite', isEnabled: false }],
        });
        expect(result.preferences).toHaveLength(1);
    });

    test('rejects empty preferences array', () => {
        expect(() => updatePreferencesSchema.parse({ preferences: [] })).toThrow();
    });

    test('rejects invalid notification type', () => {
        expect(() => updatePreferencesSchema.parse({
            preferences: [{ type: 'invalid', isEnabled: true }],
        })).toThrow();
    });

    test('rejects missing isEnabled', () => {
        expect(() => updatePreferencesSchema.parse({
            preferences: [{ type: 'follow' }],
        })).toThrow();
    });

    test('rejects non-boolean isEnabled', () => {
        expect(() => updatePreferencesSchema.parse({
            preferences: [{ type: 'follow', isEnabled: 'yes' }],
        })).toThrow();
    });

    test('rejects missing type', () => {
        expect(() => updatePreferencesSchema.parse({
            preferences: [{ isEnabled: true }],
        })).toThrow();
    });
});
