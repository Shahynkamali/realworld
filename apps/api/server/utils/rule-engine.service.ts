export interface RuleMatch {
    ruleId: number;
    ruleName: string;
    severity: string;
    autoAction: string;
}

export async function checkContentAgainstRules(content: string): Promise<RuleMatch[]> {
    const rules = await usePrisma().moderationRule.findMany({
        where: { isActive: true },
    });

    const matches: RuleMatch[] = [];

    for (const rule of rules) {
        let matched = false;

        switch (rule.ruleType) {
            case 'banned_words': {
                const words = rule.pattern.split(',').map(w => w.trim().toLowerCase());
                const lowerContent = content.toLowerCase();
                matched = words.some(word => lowerContent.includes(word));
                break;
            }
            case 'spam_pattern': {
                try {
                    const regex = new RegExp(rule.pattern, 'i');
                    matched = regex.test(content);
                } catch {
                    // Invalid regex pattern, skip
                }
                break;
            }
            case 'content_length': {
                const maxLength = parseInt(rule.pattern, 10);
                if (!isNaN(maxLength)) {
                    matched = content.length > maxLength;
                }
                break;
            }
        }

        if (matched) {
            matches.push({
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                autoAction: rule.autoAction,
            });
        }
    }

    return matches;
}

export async function autoModerateContent(
    contentType: 'article' | 'comment',
    contentId: number,
    content: string,
    authorId: number,
): Promise<void> {
    const matches = await checkContentAgainstRules(content);

    for (const match of matches) {
        // Auto-flag: create a report
        if (match.autoAction === 'flag') {
            await usePrisma().report.create({
                data: {
                    reportedContentType: contentType,
                    reportedContentId: contentId,
                    reporterId: authorId, // system-flagged, attributed to author
                    reason: 'spam',
                    description: `Auto-flagged by rule: ${match.ruleName}`,
                    status: 'pending',
                },
            });
        }

        // Auto-warn
        if (match.autoAction === 'warn') {
            await usePrisma().userModerationAction.create({
                data: {
                    userId: authorId,
                    actionType: 'warning',
                    reason: `Auto-warning by rule: ${match.ruleName}`,
                    issuedById: authorId, // system-issued
                },
            });
        }

        // Auto-ban
        if (match.autoAction === 'ban') {
            await usePrisma().$transaction([
                usePrisma().userModerationAction.create({
                    data: {
                        userId: authorId,
                        actionType: 'temp_ban',
                        reason: `Auto-ban by rule: ${match.ruleName}`,
                        issuedById: authorId,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h temp ban
                    },
                }),
                usePrisma().user.update({
                    where: { id: authorId },
                    data: { isBanned: true },
                }),
            ]);
        }
    }
}
