import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dailySigns } from '../utils/predictions';

const DailyOracle = ({ isOpen, onClose, telegramLink }) => {
    const [hasPredictedToday, setHasPredictedToday] = useState(false);
    const [selectedSign, setSelectedSign] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [shuffledCards, setShuffledCards] = useState([]);
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const [showDonationModal, setShowDonationModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkPredictionStatus();
        }
    }, [isOpen]);

    const checkPredictionStatus = () => {
        const lastDate = localStorage.getItem('topordorf_last_prediction_date');
        const today = new Date().toDateString();

        if (lastDate === today) {
            const savedSignId = localStorage.getItem('topordorf_prediction_id');
            const sign = dailySigns.find(s => s.id === parseInt(savedSignId));
            if (sign) {
                setHasPredictedToday(true);
                setSelectedSign(sign);
                setIsFlipped(true); // Show result immediately
            } else {
                resetForNewDay();
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
        setShuffledCards([1, 2, 3, 4]);
    };

    const handleCardClick = (cardIndex) => {
        if (hasPredictedToday) return;

        setSelectedCardIndex(cardIndex);

        // Pick a random prediction
        const randomIndex = Math.floor(Math.random() * dailySigns.length);
        const result = dailySigns[randomIndex];

        // Save to localStorage
        const today = new Date().toDateString();
        localStorage.setItem('topordorf_last_prediction_date', today);
        localStorage.setItem('topordorf_prediction_id', result.id);

        setSelectedSign(result);

        // Animate flip
        setTimeout(() => {
            setHasPredictedToday(true);
            setIsFlipped(true);
        }, 600);
    };

    const handleReset = () => {
        localStorage.removeItem('topordorf_last_prediction_date');
        localStorage.removeItem('topordorf_prediction_id');
        resetForNewDay();
    };

    return (
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

                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-parchment to-gold uppercase tracking-widest font-serif text-center mb-6 mt-2 relative z-10 drop-shadow-sm">
                            Карта Дня
                        </h2>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
                            {!hasPredictedToday ? (
                                // CARD SELECTION VIEW
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {shuffledCards.map((card, index) => (
                                        <motion.div
                                            key={index}
                                            onClick={() => handleCardClick(index)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            animate={selectedCardIndex !== null && selectedCardIndex !== index ? { opacity: 0.5, scale: 0.9 } : { opacity: 1, scale: 1 }}
                                            className={`aspect-[2/3] bg-primary/80 rounded-lg cursor-pointer border-2 ${selectedCardIndex === index ? 'border-amber shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'border-bronze/30 hover:border-bronze'} transition-all relative overflow-hidden group`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent pointer-events-none"></div>
                                            <img src="/images/card_back.JPG" alt="Card Back" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                // RESULT VIEW
                                <motion.div
                                    initial={{ opacity: 0, rotateY: 90 }}
                                    animate={{ opacity: 1, rotateY: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="text-center"
                                >
                                    <div className="mb-6 relative w-full aspect-[2/3] mx-auto rounded-lg overflow-hidden border-2 border-gold/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                                        <img
                                            src={selectedSign?.image || "/images/card_back.JPG"}
                                            alt={selectedSign?.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-90"></div>
                                        <div className="absolute bottom-4 left-0 right-0 p-2">
                                            <h3 className="text-xl text-gold font-serif mb-2 drop-shadow-md">{selectedSign?.title}</h3>
                                        </div>
                                    </div>

                                    <div className="bg-primary/50 border border-bronze/30 p-4 rounded-lg relative mb-6">
                                        <div className="text-bronze text-4xl font-serif absolute -top-4 -left-2 opacity-30">"</div>
                                        <p className="text-parchment italic text-sm relative z-10 leading-relaxed">
                                            {selectedSign?.text}
                                        </p>
                                        <div className="text-bronze text-4xl font-serif absolute -bottom-8 -right-2 opacity-30 rotate-180">"</div>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: 'Моя Карта Дня - Обережье',
                                                        text: `Мне выпала карта: ${selectedSign?.title}\n\n"${selectedSign?.text}"\n\nУзнай свое предсказание:`,
                                                        url: window.location.href
                                                    });
                                                }
                                            }}
                                            className="w-full py-3 bg-secondary/50 border border-bronze/50 text-gold hover:bg-bronze hover:text-white font-bold uppercase rounded transition-all"
                                        >
                                            Поделиться
                                        </button>

                                        <button
                                            onClick={() => setShowDonationModal(true)}
                                            className="w-full py-3 bg-gradient-to-r from-bronze to-amber hover:from-amber hover:to-bronze text-white font-bold uppercase rounded transition-all shadow-lg hover:shadow-red-900/50 animate-pulse border border-white/10"
                                        >
                                            Поблагодарить Мастера
                                        </button>

                                        <a
                                            href={telegramLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-3 text-ash hover:text-gold text-xs uppercase tracking-widest transition-colors"
                                        >
                                            Обсудить в Telegram
                                        </a>

                                        <button
                                            onClick={handleReset}
                                            className="text-[10px] text-ash hover:text-white mt-4 uppercase border-b border-transparent hover:border-ash transition-colors"
                                        >
                                            Сбросить (Тест)
                                        </button>
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
    );
};

export default DailyOracle;
