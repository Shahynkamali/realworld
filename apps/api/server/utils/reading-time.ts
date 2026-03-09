export function calculateReadingTime(text: string, wpm = 235): number {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / wpm));
}
