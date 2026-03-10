const SPAM_KEYWORDS = [
    'buy now', 'click here', 'free money', 'act now', 'limited time',
    'make money fast', 'no obligation', 'risk free', 'winner', 'congratulations',
    'earn extra cash', 'double your', 'million dollars', 'cash bonus',
];

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export function analyzeContent(text: string): { flagged: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const lower = text.toLowerCase();

    for (const keyword of SPAM_KEYWORDS) {
        if (lower.includes(keyword)) {
            reasons.push(`Contains spam keyword: "${keyword}"`);
        }
    }

    if (text.length > 20) {
        const alphaChars = text.replace(/[^a-zA-Z]/g, '');
        if (alphaChars.length > 0) {
            const upperCount = alphaChars.replace(/[^A-Z]/g, '').length;
            if (upperCount / alphaChars.length > 0.7) {
                reasons.push('Excessive capitalization');
            }
        }
    }

    const urls = text.match(URL_REGEX);
    if (urls && urls.length > 5) {
        reasons.push(`Link spam: ${urls.length} URLs detected`);
    }

    return { flagged: reasons.length > 0, reasons };
}
