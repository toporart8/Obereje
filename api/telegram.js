
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { body } = req;

    // Логирование для отладки
    console.log('Incoming Telegram Update:', JSON.stringify(body, null, 2));

    // Проверка структуры сообщения
    if (!body.message || !body.message.text) {
        return res.status(200).json({ status: 'ok', message: 'No text message found' });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text;

    // Если пришла команда /start
    if (text === '/start') {
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!telegramToken) {
            console.error('TELEGRAM_BOT_TOKEN is missing');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: "Здравия! Духи Кузницы ждут тебя. Нажми кнопку ниже, чтобы войти 👇",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔥 ОТКРЫТЬ КОД СУДЬБЫ",
                                    web_app: { url: "https://topordorf-totem.vercel.app" }
                                }
                            ]
                        ]
                    }
                }),
            });

            const data = await response.json();
            console.log('Telegram API response:', data);

            if (!data.ok) {
                throw new Error(data.description || 'Telegram API Error');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            return res.status(500).json({ error: 'Failed to send message to Telegram' });
        }
    }

    return res.status(200).json({ status: 'ok' });
}
