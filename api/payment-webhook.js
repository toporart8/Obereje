import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ГЕНЕРАЦИЯ КОДА
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
    } catch (e) { console.error('TG Error:', e); }
}

// ОТПРАВКА НА EMAIL (Placeholder - требует Resend API Key)
async function sendEmail(email, code, type) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[EMAIL MOCK] To: ${email}, Code: ${code} for ${type}`);
        return;
    }
    // Пример интеграции с Resend:
    /*
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Obereje <no-reply@yourdomain.com>',
            to: [email],
            subject: 'Ваш код доступа к Обережью',
            html: `<strong>Здравия!</strong> Ваш персональный код: <code>${code}</code>`
        }),
    });
    */
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // 1. ПРОВЕРКА ПОДПИСИ CLOUDTIPS
    // CloudTips присылает HMAC-SHA256 в заголовке X-Content-HMAC
    const signature = req.headers['x-content-hmac'];
    const secret = process.env.CLOUDTIPS_SECRET;

    if (secret) {
        const hash = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('base64');

        if (hash !== signature) {
            console.error('Invalid signature');
            return res.status(403).json({ error: 'Invalid signature' });
        }
    }

    const { status, amount, payerEmail, invoiceId, transactionId } = req.body;

    // 2. ПРОВЕРЯЕМ СТАТУС (У CloudTips статус успешной оплаты - "Success")
    if (status !== 'Success') {
        return res.status(200).json({ status: 'ignored' });
    }

    try {
        // invoiceId мы будем использовать для передачи Telegram Chat ID
        const tgChatId = invoiceId;

        // Тип услуги: 100р - расклад, 500р+ - эскиз (настройте под свои цены)
        const type = amount >= 500 ? 'sketch' : 'master_spread';
        const newCode = generateRandomCode();

        // 3. СОХРАНЯЕМ В SUPABASE
        const { error } = await supabase
            .from('promocodes')
            .insert([
                {
                    code: newCode.toLowerCase(),
                    type: type,
                    use_limit: type === 'sketch' ? 5 : null,
                    metadata: { transactionId, payerEmail, invoiceId }
                }
            ]);

        if (error) throw error;

        // 4. УВЕДОМЛЕНИЯ
        const serviceName = type === 'sketch' ? 'Генератор Эскизов (5 шт)' : 'Мастерский Расклад (4 карты)';
        const msg = `🔥 ОПЛАТА ПОДТВЕРЖДЕНА!\n\nУслуга: ${serviceName}\nВаш персональный код доступа:\n\n${newCode}\n\nВведите его в приложении «Обережье», чтобы активировать доступ.`;

        // В Telegram
        if (tgChatId) await sendToTelegram(msg, tgChatId);

        // На Email
        if (payerEmail) await sendEmail(payerEmail, newCode, type);

        // 5. ОТВЕТ
        return res.status(200).json({ status: 'Success' });

    } catch (err) {
        console.error('Webhook processing error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
