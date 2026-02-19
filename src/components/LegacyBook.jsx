import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LegacyBook = ({ isOpen, onClose }) => {
    // Mock data for names
    const [names, setNames] = useState([
        "Иван",
        "Мария",
        "Алексей",
        "Светлана",
        "Дмитрий",
        "Елена"
    ]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-secondary border-2 border-dashed border-bronze/40 p-8 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Stitching Detail */}
                        <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none"></div>

                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-0"></div>
                        <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] bg-bronze/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
                        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

                        {/* Header */}
                        <div className="relative z-10 text-center mb-6">
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-parchment to-gold uppercase tracking-[0.2em] font-serif mb-2">
                                Книга Рода
                            </h2>
                            <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-bronze/50 to-transparent"></div>
                        </div>

                        {/* Content Section */}
                        <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar space-y-8 px-2">
                            <div className="text-center space-y-4">


                                <div className="bg-primary/40 border border-bronze/20 p-4 rounded-lg">
                                    <p className="text-gold text-xs uppercase tracking-widest font-bold mb-3">Благодарность за дар</p>
                                    <p className="text-ash text-sm leading-relaxed font-bold">
                                        Каждое воскресенье в Обережье вершится Обряд Живого Огня. Мы зачитываем имена дарителей у костра, направляя вам удачу и силу предков. Это ваш личный оберег на удачу ,защиту и любовь на всю следующую неделю.
                                    </p>
                                </div>
                            </div>

                            {/* Names List */}
                            <div className="space-y-4">
                                <h3 className="text-amber text-xs uppercase tracking-[0.3em] font-bold text-center">Имена этой недели</h3>
                                <div className="grid grid-cols-2 gap-3 text-center font-serif text-lg text-parchment/80">
                                    {names.map((name, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="py-2 border-b border-bronze/10"
                                        >
                                            {name}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4">
                                <a
                                    href="https://pay.cloudtips.ru/p/22e8f9f6"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-4 bg-gradient-to-r from-bronze to-amber text-white font-bold uppercase tracking-widest text-center rounded-lg shadow-lg hover:shadow-red-900/40 transition-all border-t border-white/20"
                                >
                                    Вписать имя за дар
                                </a>
                                <p className="text-ash/50 text-[10px] text-center mt-3 uppercase tracking-tighter">
                                    имена обновляются каждое воскресенье
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

export default LegacyBook;
