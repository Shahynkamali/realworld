import {describe, test, expect} from 'bun:test';
import {diffRevisions} from './diff.service';

describe('diffRevisions', () => {
    test('detects no changes when revisions are identical', () => {
        const revision = {title: 'Hello', description: 'Desc', body: 'Body'};
        const result = diffRevisions(revision, revision);

        expect(result.title.changed).toBe(false);
        expect(result.description.changed).toBe(false);
        expect(result.body.changed).toBe(false);
    });

    test('detects title change', () => {
        const from = {title: 'Old Title', description: 'Desc', body: 'Body'};
        const to = {title: 'New Title', description: 'Desc', body: 'Body'};
        const result = diffRevisions(from, to);

        expect(result.title.changed).toBe(true);
        expect(result.title.from).toBe('Old Title');
        expect(result.title.to).toBe('New Title');
        expect(result.description.changed).toBe(false);
        expect(result.body.changed).toBe(false);
    });

    test('detects all fields changed', () => {
        const from = {title: 'A', description: 'B', body: 'C'};
        const to = {title: 'X', description: 'Y', body: 'Z'};
        const result = diffRevisions(from, to);

        expect(result.title.changed).toBe(true);
        expect(result.description.changed).toBe(true);
        expect(result.body.changed).toBe(true);
    });
});
