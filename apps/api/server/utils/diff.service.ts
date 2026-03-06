interface DiffSegment {
    type: 'added' | 'removed' | 'unchanged';
    value: string;
}

// Simple line-based diff using longest common subsequence
export function diffText(oldText: string, newText: string): DiffSegment[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const lcs = computeLCS(oldLines, newLines);
    const segments: DiffSegment[] = [];

    let oldIdx = 0;
    let newIdx = 0;

    for (const line of lcs) {
        while (oldIdx < oldLines.length && oldLines[oldIdx] !== line) {
            segments.push({ type: 'removed', value: oldLines[oldIdx] });
            oldIdx++;
        }
        while (newIdx < newLines.length && newLines[newIdx] !== line) {
            segments.push({ type: 'added', value: newLines[newIdx] });
            newIdx++;
        }
        segments.push({ type: 'unchanged', value: line });
        oldIdx++;
        newIdx++;
    }

    while (oldIdx < oldLines.length) {
        segments.push({ type: 'removed', value: oldLines[oldIdx] });
        oldIdx++;
    }
    while (newIdx < newLines.length) {
        segments.push({ type: 'added', value: newLines[newIdx] });
        newIdx++;
    }

    return segments;
}

function computeLCS(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }

    const result: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            result.push(a[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return result.reverse();
}

export interface VersionDiff {
    title: DiffSegment[];
    description: DiffSegment[];
    body: DiffSegment[];
    tagsAdded: string[];
    tagsRemoved: string[];
}

export function diffVersions(
    older: { title: string; description: string; body: string; tags: string[] },
    newer: { title: string; description: string; body: string; tags: string[] },
): VersionDiff {
    const olderTags = new Set(older.tags);
    const newerTags = new Set(newer.tags);

    return {
        title: diffText(older.title, newer.title),
        description: diffText(older.description, newer.description),
        body: diffText(older.body, newer.body),
        tagsAdded: newer.tags.filter(t => !olderTags.has(t)),
        tagsRemoved: older.tags.filter(t => !newerTags.has(t)),
    };
}
