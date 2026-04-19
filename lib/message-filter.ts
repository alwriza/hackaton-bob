const badWords = ['бля', 'нах', 'сука', 'ебать', 'пиздец'];

export function calculateRiskScore(rawText: string): { score: number, flags: string[], isSafe: boolean } {
    let risk = 0;
    const flags: string[] = [];

    // 1. Basic space removal for pattern matching (keeps special chars like @, +, .)
    const noSpaces = rawText.toLowerCase().replace(/\s/g, '');

    const contactPatterns = [
        /@[a-z0-9_]{3,}/, // telegram username like @user
        /\+?\d{10,}/, // phone numbers like +77771234567
        /t\.me\//,
        /wa\.me\//,
        /instagram|inst|telegram|whatsapp/
    ];

    let hasContact = false;
    for (const pattern of contactPatterns) {
        if (pattern.test(noSpaces)) {
            hasContact = true;
            break;
        }
    }

    // 2. Heavy normalization for finding obfuscated words
    const cleanText = rawText
        .toLowerCase()
        .replace(/\s/g, '')
        .replace(/1/g, 'i')
        .replace(/@/g, 'a')
        .replace(/0/g, 'o');

    if (!hasContact) {
        // try finding them in clean text as well
        if (/instagram|telegram|whatsapp|inst|tg|инст|телеграм|тг|телега/.test(cleanText)) {
            hasContact = true;
        }
    }

    if (hasContact) {
        risk += 50;
        flags.push('contact_info');
    }

    let hasBadWords = false;
    for (const word of badWords) {
        if (cleanText.includes(word) || noSpaces.includes(word)) {
            hasBadWords = true;
            break;
        }
    }

    if (hasBadWords) {
        risk += 20;
        flags.push('profanity');
    }

    return {
        score: risk,
        flags,
        isSafe: risk < 50
    };
}

export function isMessageSafe(text: string): boolean {
    return calculateRiskScore(text).isSafe;
}
