import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from '../utils/supabase';

const DonationInquiry = ({ isOpen, onClose }) => {
    const [isChecking, setIsChecking] = React.useState(false);
    const [generatedCode, setGeneratedCode] = React.useState(null);

    const checkPayment = async () => {
        console.log('Check Payment clicked');
        if (!supabase) {
            alert('Ошибка: База данных не инициализирована. Проверьте переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройках Vercel.');
            return;
        }

        setIsChecking(true);
        const urlParams = new URLSearchParams(window.location.search);
        const tgId = urlParams.get('tg_id') || 'manual_user';

        try {
            // Ищем последний код в Supabase, созданный для этого пользователя
            const { data, error } = await supabase
                .from('promocodes')
                .select('*')
                .eq('metadata->>invoiceId', tgId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                setGeneratedCode(data[0].code.toUpperCase());
            } else {
                alert('Платеж еще обрабатывается. Подождите 10-20 секунд и нажмите снова.');
            }
        } catch (err) {
            console.error('Check error:', err);
            alert('Произошла ошибка при проверке платежа. Попробуйте позже.');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-secondary border border-gold/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_100px_rgba(212,175,55,0.15)] relative overflow-hidden flex flex-col max-h-[85vh] z-[151]"
                    >
                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-10"></div>

                        {/* Mystical Gradient Blobs */}
                        <motion.div
                            animate={{
                                x: [-20, 20, -20],
                                y: [-20, 30, -20],
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.4, 0.3]
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-bronze/10 rounded-full blur-[100px] pointer-events-none z-0"
                        />

                        {/* Header */}
                        <div className="relative z-10 text-center mb-6">
                            <h2 className="text-2xl md:text-3xl font-serif text-gold uppercase tracking-[0.2em] mb-2 drop-shadow-sm font-bold">
                                Дар за Дар
                            </h2>
                            <p className="text-gold/40 text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-serif">
                                как мы питаем корни, так древо дает нам плоды
                            </p>
                            <div className="h-[1px] w-full bg-gold/10 mt-8 mb-10"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar space-y-8 px-2">
                            {!generatedCode ? (
                                <>
                                    <p className="text-parchment italic text-base md:text-lg leading-relaxed text-center font-serif first-letter:text-3xl first-letter:font-bold first-letter:text-gold first-letter:mr-1 first-letter:float-left">
                                        В «Обережье» знание оживает только через обмен. Ваш вклад — это подтверждение серьезности намерений перед Родом.
                                    </p>

                                    <div className="h-[1px] w-24 mx-auto bg-gold/10"></div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 text-center flex flex-col items-center w-full space-y-4">
                                        {/* YooMoney Quickpay Form */}
                                        <a
                                            href={`https://yoomoney.ru/quickpay/confirm.xml?receiver=4100118949508098&quickpay-form=button&sum=500&label=${new URLSearchParams(window.location.search).get('tg_id') || 'manual_user'}&successURL=${encodeURIComponent(window.location.origin)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-4 bg-[#8024BE] text-white font-bold uppercase text-center rounded-xl shadow-[0_4px_20px_rgba(128,36,190,0.3)] hover:shadow-[0_6px_25px_rgba(128,36,190,0.5)] transition-all border border-white/10"
                                        >
                                            <span className="block text-lg tracking-widest mb-0.5">Восстановить равновесие</span>
                                            <span className="block text-xs opacity-70 normal-case font-normal">оплата через ЮMoney / Картой</span>
                                        </a>

                                        <div className="flex items-center space-x-4 w-full opacity-30">
                                            <div className="h-px flex-1 bg-gold"></div>
                                            <span className="text-[10px] text-gold uppercase tracking-tighter">затем нажмите</span>
                                            <div className="h-px flex-1 bg-gold"></div>
                                        </div>

                                        {/* Кнопка проверки */}
                                        <button
                                            onClick={checkPayment}
                                            disabled={isChecking}
                                            className={`block w-full py-4 font-bold uppercase text-center rounded-xl transition-all border border-white/10 ${isChecking
                                                ? 'bg-gold/20 text-gold/40 cursor-not-allowed'
                                                : 'bg-gold text-secondary shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:bg-gold/90'
                                                }`}
                                        >
                                            <span className="block text-lg tracking-widest">
                                                {isChecking ? 'Минутку...' : 'Я оплатил, получить код'}
                                            </span>
                                        </button>

                                        <p className="text-gold/60 text-[10px] mt-2 uppercase tracking-[0.25em] font-serif font-bold">
                                            код придет также в Telegram и на Email
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gold uppercase tracking-widest mb-4">Ваш личный код:</p>
                                    <div className="bg-black/40 border border-gold/30 p-4 rounded-lg font-mono text-2xl text-white tracking-widest mb-6">
                                        {generatedCode}
                                    </div>
                                    <p className="text-parchment text-sm">
                                        Скопируйте этот код и введите его в поле активации.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="mt-8 px-8 py-2 border border-gold/30 text-gold uppercase text-xs tracking-widest hover:bg-gold/10 transition-colors"
                                    >
                                        Понятно
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-ash/60 hover:text-gold transition-colors z-20 p-1 rounded-full bg-black/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DonationInquiry;
