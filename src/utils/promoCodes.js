// Utility for handling promo codes

const PROMO_CODES = {
    'RUNA-TEST': { type: 'one_time', reward: 'unlock_3_card_spread' },
    'RUNA-TEST-2': { type: 'one_time', reward: 'unlock_3_card_spread' },
    'RUNA-TEST-3': { type: 'one_time', reward: 'unlock_3_card_spread' },
    'TEST': { type: 'eternal', reward: 'unlock_3_card_spread' },
    // In a real app, this would be validated against a backend database
};

export const validatePromoCode = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    const promo = PROMO_CODES[normalizedCode];

    if (!promo) {
        return { success: false, message: 'Неверный промокод' };
    }

    // Check if code was already used by this user (stored in localStorage for now)
    // Skip this check for 'eternal' codes
    if (promo.type !== 'eternal') {
        const usedCodes = JSON.parse(localStorage.getItem('obereje_used_promo_codes') || '[]');
        if (usedCodes.includes(normalizedCode)) {
            return { success: false, message: 'Этот промокод уже использован' };
        }
    }

    return { success: true, message: 'Промокод принят!', reward: promo.reward };
};

export const markPromoCodeAsUsed = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    const promo = PROMO_CODES[normalizedCode];

    // Don't mark 'eternal' codes as used
    if (promo && promo.type === 'eternal') {
        return;
    }

    const usedCodes = JSON.parse(localStorage.getItem('obereje_used_promo_codes') || '[]');

    if (!usedCodes.includes(normalizedCode)) {
        usedCodes.push(normalizedCode);
        localStorage.setItem('obereje_used_promo_codes', JSON.stringify(usedCodes));
    }
};
