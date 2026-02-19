import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DonationInquiry = ({ isOpen, onClose }) => {
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
                        className="bg-secondary border-2 border-dashed border-bronze/40 p-8 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] z-[151]"
                    >
                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-0"></div>
                        <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] bg-bronze/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
                        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

                        {/* Stitching Detail */}
                        <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none"></div>

                        {/* Header */}
                        <div className="relative z-10 text-center mb-6">
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-parchment to-gold uppercase tracking-[0.2em] font-serif mb-2">
                                Дар за Дар
                            </h2>
                            <p className="text-gold/80 text-[10px] uppercase tracking-[0.3em] italic">
                                как мы питаем корни, так древо дает нам плоды
                            </p>
                            <div className="h-px w-1/2 mx-auto bg-gradient-to-r from-transparent via-bronze/50 to-transparent mt-4"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar space-y-6 px-2">
                            <p className="text-parchment/90 text-sm leading-relaxed font-bold italic text-center">
                                В традиции Обережье знание никогда не давалось впустую. Дар — это ваш личный вклад в сохранение равновесия и залог того, что полученное знание приживется и станет вашей опорой, а не просто словами.
                            </p>

                            <p className="text-parchment/80 text-sm leading-relaxed text-center">
                                Когда вы его вносите, подтверждается серьезность ваших намерений перед Родом. Только так информация превращается в живую энергию, которая начинает работать на ваше благополучие, оберегая от ошибок и освещая верный путь.
                            </p>

                            {/* Action Button */}
                            <div className="pt-4 text-center">
                                <a
                                    href="https://pay.cloudtips.ru/p/22e8f9f6"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-3 bg-gradient-to-r from-bronze to-amber text-white font-bold uppercase text-center rounded-lg shadow-lg hover:shadow-red-900/40 transition-all border-t border-white/20"
                                >
                                    <span className="block tracking-widest mb-0.5">внести Дар</span>
                                    <span className="block text-[10px] opacity-80 normal-case font-normal">сколько посчитаете достаточным</span>
                                </a>
                                <p className="text-gold/60 text-[11px] mt-3 uppercase tracking-widest font-bold">
                                    получите 1 дополнительный расклад
                                </p>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-ash hover:text-gold transition-colors z-20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
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
