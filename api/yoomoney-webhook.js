import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ГЕНЕРАЦИЯ КОДА (Такая же как в CloudTips для совместимости)
function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `RUNE-${segment()}-${segment()}`;
}

// ОТПРАВКА В TELEGRAM
async function sendToTelegram(message, chatId) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return;
    try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message })
        });
    } catch (e) {
        console.error('TG Error:', e);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // У ЮMoney данные приходят в application/x-www-form-urlencoded
    const {
        notification_type,
        operation_id,
        amount,
        withdraw_amount,
        currency,
        datetime,
        sender,
        codepro,
        label,
        sha1_hash,
        unbilled
    } = req.body;

    // 1. ПРОВЕРКА ПОДПИСИ SHA-1
    // Формула: notification_type&operation_id&amount&currency&datetime&sender&codepro&notification_secret&label
    const secret = process.env.YOOMONEY_SECRET;

    if (!secret) {
        console.error('YOOMONEY_SECRET is not defined!');
        return res.status(500).json({ error: 'Configuration error' });
    }

    const signatureSource = [
        notification_type,
        operation_id,
        amount,
        currency,
        datetime,
        sender,
        codepro,
        secret,
        label
    ].join('&');

    const calculatedHash = crypto
        .createHash('sha1')
        .update(signatureSource)
        .digest('hex');

    if (calculatedHash !== sha1_hash) {
        console.error('Signature mismatch!', { expected: calculatedHash, got: sha1_hash });
        return res.status(403).json({ error: 'Invalid signature' });
    }

    // 2. ПРОВЕРКА СТАТУСА (codepro - если true, значит платеж защищен кодом протекции, нам такие не нужны для авто-выдачи)
    if (codepro === 'true' || unbilled === 'true') {
        console.log('Payment requires protection code or unbilled, ignoring.');
        return res.status(200).json({ status: 'ignored' });
    }

    try {
        const tgChatId = label; // Мы передаем tg_id в поле label
        if (!tgChatId) {
            console.error('No label (tgChatId) provided in payment');
            return res.status(200).json({ status: 'no_label_ignored' });
        }

        // Определяем тип услуги по сумме (как в CloudTips)
        // CloudTips использует withdraw_amount (то что пришло на счет) или amount (то что списано)?
        // У ЮMoney 'amount' - это сколько списано у пользователя, 'withdraw_amount' - сколько пришло к нам.
        const checkAmount = parseFloat(withdraw_amount || amount);
        const type = checkAmount >= 450 ? 'sketch' : 'master_spread'; // 450 с запасом на комиссию если 500

        const newCode = generateRandomCode();

        console.log(`Generating ${type} code for YooMoney payment. Label: ${tgChatId}, Amount: ${checkAmount}`);

        // 3. СОХРАНЯЕМ В SUPABASE
        const { error } = await supabase
            .from('promocodes')
            .insert([
                {
                    code: newCode.toLowerCase(),
                    type: type,
                    use_limit: type === 'sketch' ? 5 : null,
                    metadata: {
                        source: 'yoomoney',
                        operation_id,
                        amount: checkAmount,
                        invoiceId: tgChatId,
                        processed_at: new Date().toISOString()
                    }
                }
            ]);

        if (error) {
            console.error('Database insertion error:', error);
            throw error;
        }

        // 4. УВЕДОМЛЕНИЕ В TELEGRAM
        const serviceName = type === 'sketch' ? 'Генератор Эскизов (5 шт)' : 'Мастерский Расклад (4 карты)';
        const msg = `🔥 ОПЛАТА ЧЕРЕЗ ЮMONEY ПОДТВЕРЖДЕНА!\n\nУслуга: ${serviceName}\nВаш персональный код доступа:\n\n${newCode}\n\nВведите его в приложении «Обережье», чтобы активировать доступ.`;

        if (tgChatId && tgChatId !== 'manual_user') {
            await sendToTelegram(msg, tgChatId);
        }

        return res.status(200).send('OK');

    } catch (err) {
        console.error('YooMoney Webhook ERROR:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
