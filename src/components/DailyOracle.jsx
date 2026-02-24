import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dailySigns } from '../utils/predictions';
import { validatePromoCode, markPromoCodeAsUsed } from '../utils/promoCodes';
import DonationInquiry from './DonationInquiry';

const DailyOracle = ({ isOpen, onClose, telegramLink }) => {
    const [hasPredictedToday, setHasPredictedToday] = useState(false);
    const [selectedSign, setSelectedSign] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [shuffledCards, setShuffledCards] = useState([]);
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [isDonationInquiryOpen, setIsDonationInquiryOpen] = useState(false);
    const [showPromoInput, setShowPromoInput] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoMessage, setPromoMessage] = useState('');

    // Premium Mode State
    const [isPremiumMode, setIsPremiumMode] = useState(false);
    const [premiumCards, setPremiumCards] = useState([]); // Array of 4 card objects
    const [revealedPremiumCards, setRevealedPremiumCards] = useState([]); // Array of indices (0, 1, 2) for premium mode
    const [selectedEnlargedCard, setSelectedEnlargedCard] = useState(null);
    const premiumRef = useRef(null);

    useEffect(() => {
        if (isPremiumMode && premiumRef.current) {
            setTimeout(() => {
                premiumRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [isPremiumMode]);

    useEffect(() => {
        if (isOpen) {
            checkPredictionStatus();
        }
    }, [isOpen]);

    // Initialize cards for the fan layout (always 11 cards as requested)
    useEffect(() => {
        const cardsCount = 11;
        setShuffledCards(Array.from({ length: cardsCount }, (_, i) => i));
    }, []); // Run once on mount

    const checkPredictionStatus = () => {
        const lastDate = localStorage.getItem('topordorf_last_prediction_date');
        const today = new Date().toDateString();

        if (lastDate === today) {
            const savedSignId = localStorage.getItem('topordorf_prediction_id');
            const savedIsPremium = localStorage.getItem('topordorf_is_premium') === 'true';

            if (savedIsPremium) {
                const savedPremiumCardIds = JSON.parse(localStorage.getItem('topordorf_premium_cards') || '[]');
                const savedRevealedPremiumCardIndices = JSON.parse(localStorage.getItem('topordorf_revealed_premium_cards') || '[]');
                const premiumSigns = savedPremiumCardIds.map(id => dailySigns.find(s => s.id === id)).filter(Boolean);

                if (premiumSigns.length > 0) {
                    setHasPredictedToday(true);
                    setIsPremiumMode(true);
                    setPremiumCards(premiumSigns);
                    setRevealedPremiumCards(savedRevealedPremiumCardIndices);
                    setIsFlipped(true); // Show result immediately
                } else {
                    resetForNewDay();
                }
            } else {
                const sign = dailySigns.find(s => s.id === parseInt(savedSignId));
                if (sign) {
                    setHasPredictedToday(true);
                    setSelectedSign(sign);
                    setIsFlipped(true); // Show result immediately
                } else {
                    resetForNewDay();
                }
            }
        } else {
            resetForNewDay();
        }
    };

    const resetForNewDay = () => {
        setHasPredictedToday(false);
        setSelectedSign(null);
        setIsFlipped(false);
        setSelectedCardIndex(null);
        setShuffledCards(Array.from({ length: 11 }, (_, i) => i)); // Reset to 11 cards

        // Reset premium state
        setIsPremiumMode(false);
        setPremiumCards([]);
        setRevealedPremiumCards([]);
    };

    const handleCardClick = (cardIndex) => {
        if (hasPredictedToday) return;

        setSelectedCardIndex(cardIndex);

        // Standard Logic: 1 card
        const randomIndex = Math.floor(Math.random() * dailySigns.length);
        const result = dailySigns[randomIndex];

        const today = new Date().toDateString();
        localStorage.setItem('topordorf_last_prediction_date', today);
        localStorage.setItem('topordorf_prediction_id', result.id);
        localStorage.setItem('topordorf_is_premium', 'false');

        setSelectedSign(result);

        setTimeout(() => {
            setHasPredictedToday(true);
            setIsFlipped(true);
        }, 600);
    };

    const handlePremiumCardClick = (index) => {
        if (!revealedPremiumCards.includes(index)) {
            const newRevealed = [...revealedPremiumCards, index];
            setRevealedPremiumCards(newRevealed);
            localStorage.setItem('topordorf_revealed_premium_cards', JSON.stringify(newRevealed));
        } else {
            // If already revealed, show enlarged view
            setSelectedEnlargedCard(premiumCards[index]);
        }
    };

    const handleReset = () => {
        localStorage.removeItem('topordorf_last_prediction_date');
        localStorage.removeItem('topordorf_prediction_id');
        localStorage.removeItem('topordorf_is_premium');
        localStorage.removeItem('topordorf_premium_cards');
        localStorage.removeItem('topordorf_revealed_premium_cards');
        resetForNewDay();
    };

    const handlePromoSubmit = async () => {
        try {
            const response = await fetch('/api/validate-promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode, type: 'master_spread' })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setPromoMessage('Доступ разрешен!');
                setTimeout(() => {
                    // Unlock Premium 4-card spread immediately
                    const today = new Date().toDateString();

                    // 1. Keep the CURRENTLY selected card as the first card
                    const initialCard = selectedSign;

                    // 2. Select 3 more random unique cards (excluding the initial one)
                    const otherCards = dailySigns.filter(s => s.id !== initialCard.id);
                    const shuffled = otherCards.sort(() => 0.5 - Math.random());
                    const additional = shuffled.slice(0, 3);

                    // 3. Create the full set of 4 cards
                    const fullSet = [initialCard, ...additional];

                    localStorage.setItem('topordorf_last_prediction_date', today);
                    localStorage.setItem('topordorf_is_premium', 'true');
                    localStorage.setItem('topordorf_premium_cards', JSON.stringify(fullSet.map(s => s.id)));
                    localStorage.setItem('topordorf_revealed_premium_cards', JSON.stringify([0])); // First card already open

                    setPremiumCards(fullSet);
                    setRevealedPremiumCards([0]);
                    setIsPremiumMode(true);
                    setHasPredictedToday(true);
                    setIsFlipped(true);

                    setShowPromoInput(false);
                    setPromoCode('');
                    setPromoMessage('');
                }, 1000);
            } else {
                setPromoMessage(result.error || 'Неверный промокод');
            }
        } catch (err) {
            console.error('Validation error:', err);
            setPromoMessage('Ошибка сети. Попробуйте позже.');
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
                    // onClick={onClose} 
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-secondary border-2 border-dashed border-bronze/40 p-6 rounded-xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Stitching Detail */}
                            <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none"></div>

                            {/* Background Decoration */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-ash hover:text-gold transition-colors z-20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-parchment to-gold uppercase tracking-widest font-serif text-center mb-4 mt-4 relative z-10 drop-shadow-sm">
                                {isPremiumMode && hasPredictedToday ? 'Расклад Мастера' : 'Карта Дня'}
                            </h2>
                            {!hasPredictedToday && (
                                <p className="text-bronze/60 text-sm italic uppercase tracking-[0.2em] font-serif text-center -mt-2 mb-8 relative z-10">
                                    выбирай сердцем
                                </p>
                            )}

                            <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative z-10 px-2">
                                {!hasPredictedToday ? (
                                    // CARD SELECTION VIEW
                                    <div className="flex flex-col items-center">
                                        {/* CARD STACK LAYOUT */}
                                        <div className="relative w-full flex justify-center mb-2 mt-4">
                                            <div className="relative w-[240px] h-[650px]">
                                                {shuffledCards.map((card, index) => {
                                                    const totalCards = shuffledCards.length;
                                                    const offsetPerCard = 50;
                                                    const reverseIndex = totalCards - 1 - index;
                                                    const yOffset = reverseIndex * offsetPerCard;
                                                    const xRandom = (index % 2 === 0 ? 1 : -1) * 5;
                                                    const isSelected = selectedCardIndex === index;
                                                    const isOtherSelected = selectedCardIndex !== null && !isSelected;

                                                    return (
                                                        <motion.div
                                                            key={index}
                                                            onClick={() => handleCardClick(index)}
                                                            initial={{ opacity: 0, y: 1000 }}
                                                            animate={{
                                                                scale: isSelected ? 1.1 : 1,
                                                                y: isSelected ? 200 : yOffset,
                                                                x: isSelected ? 0 : xRandom,
                                                                rotate: isSelected ? 0 : (index % 3 - 1) * 4,
                                                                zIndex: isSelected ? 100 : index,
                                                                opacity: isOtherSelected ? 0.3 : 1
                                                            }}
                                                            whileHover={{
                                                                y: yOffset + 50,
                                                                x: xRandom - 15,
                                                                transition: { duration: 0.2, ease: "easeOut" }
                                                            }}
                                                            transition={{
                                                                delay: index * 0.015,
                                                                type: "spring",
                                                                stiffness: 120,
                                                                damping: 15
                                                            }}
                                                            className={`absolute top-0 left-0 aspect-[2/3] w-full bg-primary/80 rounded-lg cursor-pointer border ${isSelected ? 'border-amber shadow-[0_0_20px_rgba(220,38,38,0.8)]' : 'border-bronze/40 shadow-md'} overflow-hidden group hover:border-gold hover:shadow-[0_0_15px_rgba(255,215,0,0.5)]`}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent pointer-events-none"></div>
                                                            <img src="/images/card_back.jpg" alt="Card Back" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>


                                    </div>
                                ) : (
                                    // RESULT VIEW
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="w-full"
                                    >
                                        {isPremiumMode ? (
                                            // PREMIUM 4-CARD SPREAD (2x2 Grid)
                                            <div ref={premiumRef} className="flex flex-col items-center space-y-8 py-4">
                                                <h3 className="text-gold text-lg font-serif uppercase tracking-[0.2em] text-center border-b border-gold/20 pb-2 w-full">
                                                    Расклад "Мудрость Предков"
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4 w-full">
                                                    {premiumCards.map((sign, index) => {
                                                        const isRevealed = revealedPremiumCards.includes(index);
                                                        const titles = ["Ваш путь", "Преграда", "Помощь", "Итог"];
                                                        const descriptors = ["Где вы сейчас:", "Что мешает:", "В чем сила:", "Куда ведет дорога:"];

                                                        return (
                                                            <div key={index} className="flex flex-col items-center group">
                                                                <div className="text-amber/80 text-[10px] font-serif uppercase tracking-[0.1em] mb-2 group-hover:text-gold transition-colors">
                                                                    {titles[index]}
                                                                </div>

                                                                <div
                                                                    className="relative w-full aspect-[2/3] cursor-pointer perspective-1000"
                                                                    onClick={() => handlePremiumCardClick(index)}
                                                                >
                                                                    <motion.div
                                                                        className="w-full h-full relative preserve-3d transition-transform duration-700"
                                                                        style={{ transformStyle: 'preserve-3d' }}
                                                                        animate={{ rotateY: isRevealed ? 180 : 0 }}
                                                                    >
                                                                        {/* FRONT (Card Back) */}
                                                                        <div className="absolute inset-0 backface-hidden rounded-lg overflow-hidden border border-bronze/40 shadow-lg group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
                                                                            <img src="/images/card_back.jpg" alt="Card Back" className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                                                                        </div>

                                                                        {/* BACK (Revealed Card) */}
                                                                        <div
                                                                            className="absolute inset-0 backface-hidden rounded-lg overflow-hidden border border-gold/40 bg-secondary shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                                                                            style={{ transform: 'rotateY(180deg)' }}
                                                                        >
                                                                            <img
                                                                                src={sign.image}
                                                                                alt={sign.title}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => { e.target.src = "/images/lad1.jpg"; }}
                                                                            />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-2 text-center">
                                                                                <h4 className="text-gold font-serif text-[10px] sm:text-xs leading-tight">{sign.title}</h4>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                </div>

                                                                <AnimatePresence>
                                                                    {isRevealed && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            className="mt-3 p-2 bg-primary/40 border border-bronze/10 rounded text-center w-full"
                                                                        >
                                                                            <p className="text-ash/60 text-[8px] uppercase tracking-tighter mb-1 font-serif">{descriptors[index]}</p>
                                                                            <p className="text-parchment italic text-[9px] sm:text-[10px] leading-tight">
                                                                                {sign.text.split('.')[0]}...
                                                                            </p>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            // SINGLE CARD LAYOUT
                                            <div className="flex flex-col items-center py-4">
                                                <div
                                                    className="relative w-64 aspect-[2/3] mb-8 rounded-xl overflow-hidden border-2 border-gold/50 shadow-[0_0_50px_rgba(159,43,43,0.5)] cursor-pointer group"
                                                    onClick={() => setSelectedEnlargedCard(selectedSign)}
                                                >
                                                    <img
                                                        src={selectedSign?.image}
                                                        alt={selectedSign?.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        onError={(e) => { e.target.src = "/images/lad1.jpg"; }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                                                        <h2 className="text-2xl text-gold font-serif mb-2 drop-shadow-lg">{selectedSign?.title}</h2>
                                                        <p className="text-ash text-[10px] uppercase tracking-widest">{selectedSign?.date}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-primary/50 border border-bronze/30 p-5 rounded-lg relative mb-8 w-full">
                                                    <p className="text-parchment italic text-sm relative z-10 leading-relaxed text-center">
                                                        {selectedSign?.text}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3 w-full border-t border-bronze/20 mt-2 pt-2">
                                            <button
                                                onClick={() => setIsDonationInquiryOpen(true)}
                                                className="w-full py-3 border border-gold/30 bg-primary/40 text-gold text-xs font-bold uppercase tracking-[0.2em] rounded transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:bg-gold/10 hover:border-gold/60"
                                            >
                                                У меня еще вопрос
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (navigator.share) {
                                                        const text = isPremiumMode
                                                            ? `Мой Расклад Мастера в Обережье: ${premiumCards.map(s => s.title).join(', ')}`
                                                            : `Мне выпала карта: ${selectedSign?.title}\n\n"${selectedSign?.text}"`;

                                                        navigator.share({
                                                            title: 'Оракул - Обережье',
                                                            text: text,
                                                            url: window.location.href
                                                        });
                                                    }
                                                }}
                                                className="w-full py-3 bg-secondary/50 border border-bronze/50 text-gold/60 hover:bg-bronze hover:text-white font-bold uppercase rounded transition-all text-[10px] tracking-widest"
                                            >
                                                Поделиться
                                            </button>

                                            <button
                                                onClick={() => setShowDonationModal(true)}
                                                className="w-full py-3 bg-gradient-to-r from-bronze to-amber hover:from-amber hover:to-bronze text-white font-bold uppercase rounded transition-all shadow-lg hover:shadow-red-900/50 border border-white/10 text-xs tracking-widest"
                                            >
                                                Поблагодарить Мастера
                                            </button>

                                            <a
                                                href={telegramLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full py-3 bg-primary/30 border border-bronze/20 text-center text-ash hover:text-gold text-[10px] uppercase tracking-[0.2em] transition-all rounded"
                                            >
                                                Обсудить в Telegram
                                            </a>

                                            <button
                                                onClick={handleReset}
                                                className="w-full py-2 text-[10px] text-ash/50 hover:text-white uppercase tracking-widest transition-colors mt-4"
                                            >
                                                Сбросить и вернуться
                                            </button>

                                            {/* Promo Section (Shared) */}
                                            <div className="mt-4 pt-4">
                                                {!showPromoInput ? (
                                                    <button
                                                        onClick={() => setShowPromoInput(true)}
                                                        className="w-full text-[10px] text-gold/60 hover:text-gold font-bold uppercase tracking-[0.25em] transition-all"
                                                    >
                                                        ✨ Использовать промокод
                                                    </button>
                                                ) : (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                        <input
                                                            type="text"
                                                            value={promoCode}
                                                            onChange={(e) => setPromoCode(e.target.value)}
                                                            placeholder="Введите код"
                                                            className="w-full bg-primary/50 border border-bronze/30 rounded px-3 py-2 text-center text-parchment text-sm uppercase placeholder:text-ash/30 focus:outline-none focus:border-gold transition-colors"
                                                        />
                                                        {promoMessage && (
                                                            <p className={`text-center text-[10px] ${promoMessage.includes('принят') ? 'text-green-400' : 'text-red-400'}`}>
                                                                {promoMessage}
                                                            </p>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handlePromoSubmit}
                                                                className="flex-1 bg-bronze/20 hover:bg-bronze/40 text-gold border border-bronze/50 rounded py-2 text-[10px] uppercase tracking-widest transition-all"
                                                            >
                                                                Применить
                                                            </button>
                                                            <button
                                                                onClick={() => setShowPromoInput(false)}
                                                                className="px-4 text-ash hover:text-white text-[10px] uppercase tracking-widest"
                                                            >
                                                                Отмена
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Donation Modal Overhead */}
                            <AnimatePresence>
                                {showDonationModal && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-primary/95 z-50 flex flex-col items-center justify-center p-6 text-center"
                                    >
                                        <h3 className="text-xl font-bold text-gold mb-4 font-serif uppercase tracking-widest">Поддержка Проекта</h3>
                                        <p className="text-ash text-sm mb-6">
                                            Если вам понравился оракул, вы можете поддержать развитие мастерской любой суммой.
                                        </p>
                                        <div className="w-48 h-48 bg-white p-2 rounded-lg mb-6 shadow-2xl border-4 border-gold/50">
                                            <img src="/images/qr_code.png" alt="QR Code" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex gap-4">
                                            <a
                                                href="https://pay.cloudtips.ru/p/22e8f9f6"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-2 bg-amber hover:bg-amber/80 text-white font-bold uppercase rounded transition-all text-xs"
                                            >
                                                Перейти к оплате
                                            </a>
                                            <button
                                                onClick={() => setShowDonationModal(false)}
                                                className="px-6 py-2 border border-secondary text-ash hover:text-parchment uppercase text-xs rounded transition-all"
                                            >
                                                Закрыть
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <DonationInquiry
                isOpen={isDonationInquiryOpen}
                onClose={() => setIsDonationInquiryOpen(false)}
            />

            {/* ENLARGED CARD MODAL */}
            <AnimatePresence>
                {selectedEnlargedCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                        onClick={() => setSelectedEnlargedCard(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-secondary border border-gold/30 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.2)] flex flex-col md:flex-row max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedEnlargedCard(null)}
                                className="absolute top-4 right-4 text-ash/70 hover:text-gold transition-colors z-[110] bg-black/50 rounded-full p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Image Section */}
                            <div className="w-full md:w-1/2 aspect-[2/3] md:aspect-auto overflow-hidden">
                                <img
                                    src={selectedEnlargedCard.image}
                                    alt={selectedEnlargedCard.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = "/images/lad1.jpg"; }}
                                />
                            </div>

                            {/* Content Section */}
                            <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center overflow-y-auto no-scrollbar bg-gradient-to-br from-secondary to-primary/30 relative">
                                <h2 className="text-4xl md:text-5xl font-serif text-gold mb-3 text-center md:text-left drop-shadow-sm uppercase tracking-widest font-bold">
                                    {selectedEnlargedCard.title}
                                </h2>
                                <p className="text-gold/40 text-[10px] md:text-[11px] uppercase tracking-[0.4em] font-serif mb-6 text-center md:text-left">
                                    {selectedEnlargedCard.date || "Послание Предков"}
                                </p>

                                <div className="h-[1px] w-full bg-gold/10 mb-8"></div>

                                <p className="text-parchment italic text-base md:text-lg leading-relaxed text-center md:text-left font-serif first-letter:text-4xl first-letter:font-bold first-letter:text-gold first-letter:mr-2 first-letter:float-left first-letter:mt-1">
                                    {selectedEnlargedCard.text}
                                </p>

                                <div className="h-[1px] w-full bg-gold/10 mt-8 mb-10"></div>

                                <div className="flex justify-center md:justify-start">
                                    <button
                                        onClick={() => setSelectedEnlargedCard(null)}
                                        className="px-10 py-2.5 border border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60 transition-all rounded-full uppercase text-xs tracking-[0.2em] font-bold"
                                    >
                                        Вернуться
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DailyOracle;
