import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, type } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Код не указан' });
    }

    try {
        // 1. Check if the code exists and is not used
        const { data, error } = await supabase
            .from('promocodes')
            .select('*')
            .eq('code', code.toLowerCase())
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Неверный код доступа' });
        }

        if (data.is_used) {
            return res.status(400).json({ error: 'Этот код уже был использован' });
        }

        // 2. Validate type if provided
        if (type && data.type !== type) {
            return res.status(400).json({ error: 'Этот код предназначен для другой услуги' });
        }

        // 3. Mark as used
        const { error: updateError } = await supabase
            .from('promocodes')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', data.id);

        if (updateError) {
            throw updateError;
        }

        // 4. Success
        return res.status(200).json({
            success: true,
            message: 'Доступ разрешен',
            data: {
                type: data.type,
                limit: data.use_limit
            }
        });

    } catch (err) {
        console.error('Validation error:', err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
