
import React, { useState } from 'react';

const SketchGenerator = ({ usageLimit }) => {
    // State for structured inputs
    const [theme, setTheme] = useState('');
    const [details, setDetails] = useState('');
    const [avoid, setAvoid] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Создаем шедевр...");
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState(null);
    const [limitReached, setLimitReached] = useState(false);

    const checkLimit = () => {
        if (usageLimit === null) return true; // Unlimited

        const today = new Date().toISOString().split('T')[0];
        const storageKey = `sketch_limit_${today}`;
        const currentUsage = parseInt(localStorage.getItem(storageKey) || '0');

        if (currentUsage >= usageLimit) {
            setLimitReached(true);
            return false;
        }
        return true;
    };

    const incrementUsage = () => {
        if (usageLimit === null) return;

        const today = new Date().toISOString().split('T')[0];
        const storageKey = `sketch_limit_${today}`;
        const currentUsage = parseInt(localStorage.getItem(storageKey) || '0');
        localStorage.setItem(storageKey, (currentUsage + 1).toString());
    };

    const generateSketch = async () => {
        if (!checkLimit()) return;

        if (!theme) {
            alert('Пожалуйста, укажите хотя бы тему эскиза!');
            return;
        }

        setLoading(true);
        setLoadingMessage("Колдуем над эскизом...");
        setError(null);
        setResultImage(null);

        // Combine inputs for the prompt
        const fullPrompt = `Theme: ${theme}. Details: ${details}`;

        try {
            // 1. Готовим маску (Client-side fetch) - обязательно для Inpainting
            const maskResponse = await fetch('/mask.png');
            if (!maskResponse.ok) throw new Error("Не удалось загрузить маску (mask.png)");

            const maskBlob = await maskResponse.blob();
            const reader = new FileReader();
            const maskBase64 = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(maskBlob);
            });

            // 2. Отправляем запрос с маской и доп. полями
            const response = await fetch('/api/generate-sketch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    avoid: avoid, // Send negative prompt separately
                    maskImage: maskBase64
                }),
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            if (data.image) {
                setResultImage(data.image);
                incrementUsage();
            } else {
                throw new Error("Не удалось получить изображение");
            }

        } catch (err) {
            console.error("Ошибка во время генерации:", err);
            setError(err.message || "Ошибка генерации");
        } finally {
            setLoading(false);
        }
    };

    const orderSketch = () => {
        const emailTo = "ВАША_ПОЧТА@gmail.com";
        const subject = encodeURIComponent("Заказ топора с индивидуальным эскизом");
        const body = encodeURIComponent(`Привет! Хочу заказать топор.\n\nТема: ${theme}\nДетали: ${details}\n\n(ВАЖНО: Прикрепите к этому письму скачанный эскиз)`);

        window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    };

    return (
        <section className="sketch-generator-section w-full bg-secondary border-2 border-dashed border-bronze/40 p-8 text-center rounded-2xl relative overflow-hidden shadow-2xl">
            {/* Stitching Detail */}
            <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none"></div>
            {/* Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

            <h2 className="text-3xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold via-parchment to-gold mb-2 relative z-10 drop-shadow-sm">Мастерская Эскизов</h2>
            <p className="text-ash max-w-xl mx-auto mb-8 relative z-10 text-xs uppercase tracking-wider">Заполни поля ниже, чтобы мы создали идеальный эскиз для тебя.</p>

            <div className="input-group max-w-xl mx-auto space-y-6 text-left relative z-10">

                {/* 1. THEME */}
                <div>
                    <label className="block text-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                        1. Тема (Кто или что?)
                    </label>
                    <input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="Например: Медведь в лесу, Знак Велеса, Драккар викингов"
                        className="w-full p-4 bg-primary/50 border border-secondary text-parchment focus:border-amber outline-none transition-all rounded-lg placeholder:text-ash/30 shadow-inner"
                    />
                </div>

                {/* 2. DETAILS */}
                <div>
                    <label className="block text-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                        2. Детали (Что добавить?)
                    </label>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Например: кельтские узоры, руны, дубовые листья, агрессивный стиль..."
                        rows="2"
                        className="w-full p-4 bg-primary/50 border border-secondary text-parchment focus:border-amber outline-none transition-all rounded-lg placeholder:text-ash/30 shadow-inner"
                    ></textarea>
                </div>

                {/* 3. AVOID */}
                <div>
                    <label className="block text-bronze text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                        3. Чего избегать?
                    </label>
                    <input
                        type="text"
                        value={avoid}
                        onChange={(e) => setAvoid(e.target.value)}
                        placeholder="Например: черепа, цветы, слишком тонкие линии..."
                        className="w-full p-4 bg-primary/50 border border-secondary text-parchment focus:border-red-900/50 outline-none transition-all rounded-lg placeholder:text-ash/30 shadow-inner"
                    />
                </div>

                <button
                    onClick={generateSketch}
                    disabled={loading}
                    className="w-full py-4 mt-6 bg-gradient-to-r from-bronze to-amber hover:from-amber hover:to-bronze text-white font-bold uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_5px_20px_rgba(159,43,43,0.4)] hover:shadow-[0_10px_30px_rgba(220,38,38,0.5)] border-t border-white/20 tracking-widest relative overflow-hidden group"
                >
                    <span className="relative z-10">{loading ? loadingMessage : "Создать эскиз"}</span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12"></div>
                </button>
            </div>

            {loading && (
                <div id="sketch-loader" className="text-center mt-6 text-gold animate-pulse text-sm uppercase tracking-widest">{loadingMessage}</div>
            )}

            {error && (
                <div className="text-center mt-6 text-red-400 bg-red-900/20 p-4 rounded border border-red-900/50">Ошибка: {error}</div>
            )}

            {limitReached && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-secondary border border-dashed border-bronze p-8 rounded-xl max-w-md text-center shadow-2xl relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                        <h3 className="text-xl font-bold text-bronze uppercase tracking-widest mb-4 font-serif">
                            Лимит исчерпан
                        </h3>
                        <p className="text-ash mb-6 text-sm">
                            На сегодня ваши попытки генерации закончились (5 из 5).
                            <br />
                            Чтобы продолжить, обратитесь к Мастеру.
                        </p>
                        <a
                            href="https://t.me/Oleg_topordorf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#229ED9]/20 hover:bg-[#229ED9]/40 border border-[#229ED9]/50 text-[#229ED9] hover:text-white font-bold uppercase rounded-full transition-all text-xs tracking-wider"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.02-2.38-1.63-1.05-.69-.37-1.07.23-1.68.15-.15 2.81-2.57 2.86-2.79.01-.05.01-.1-.02-.14-.03-.04-.08-.06-.11-.04-.08.02-1.29.82-3.64 2.41-.34.23-.66.35-.97.35-.32-.01-.94-.18-1.4-.33-.56-.18-1.01-.28-1.04-.58.02-.16.24-.32.65-.49 2.54-1.1 4.23-1.84 5.08-2.19 2.42-.99 2.92-1.16 3.25-1.16.07 0 .23.01.33.09.09.07.12.17.12.27 0 .1 0 .2-.01.24z" /></svg>
                            Написать Мастеру
                        </a>
                        <button
                            onClick={() => setLimitReached(false)}
                            className="block w-full mt-6 text-ash hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}

            {resultImage && (
                <div id="sketch-result" className="mt-12 text-center animate-fade-in relative z-10">
                    <h3 className="text-xl text-gold font-serif mb-6 uppercase tracking-widest drop-shadow-sm">Твой эскиз</h3>
                    <div className="axe-preview-container relative inline-block max-w-full w-[500px] border-2 border-dashed border-bronze/40 rounded-xl overflow-hidden shadow-2xl bg-black">
                        <img
                            src={resultImage}
                            alt="Sketch"
                            className="w-full h-auto block"
                            style={{
                                maskImage: 'url(/mask.png)',
                                WebkitMaskImage: 'url(/mask.png)',
                                maskMode: 'alpha',
                                WebkitMaskMode: 'alpha',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                alert("Не удалось загрузить картинку: " + resultImage);
                            }}
                        />
                        {/* Vignette on image */}
                        <div className="absolute inset-0 bg-radial-gradient-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>


                    <div className="mt-8">
                        <button
                            onClick={orderSketch}
                            className="px-8 py-4 bg-secondary border border-gold/30 text-gold hover:bg-gold hover:text-black font-bold uppercase rounded-full transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] tracking-widest text-xs"
                        >
                            Заказать топор с этим эскизом
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SketchGenerator;
