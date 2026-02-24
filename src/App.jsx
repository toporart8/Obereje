import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DateInput from './components/DateInput';
import DailyOracle from './components/DailyOracle';
import { getSlavicHall, getZoroastrianTotem, getZodiac } from './utils/logic';
import { products, categories } from './utils/products';
import { getUpcomingHolidays, PRODUCTS_DB } from './utils/holidays';
import SketchGenerator from './components/SketchGenerator';
import LegacyBook from './components/LegacyBook';


const CONTACTS = {
  telegram: "https://t.me/topordorf",
  whatsapp: "https://wa.me/qr/KSWHUSHUBL5HJ1",
  max: "https://max.ru/u/f9LHodD0cOLV4pqZZg8Zbt2CkYFRwJfgzbCXhunpRVxVTjbhBp4zHw2YQM0",
  vk: "https://vk.com/твоя_ссылка"
};

const CollapsibleText = ({ text, maxLength = 200 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text.length <= maxLength) return <p className="text-sm text-zinc-400 mt-2">{text}</p>;

  return (
    <div className="mt-2">
      <p className="text-sm text-zinc-400">
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-orange-500 text-xs uppercase font-bold mt-1 hover:text-orange-400 transition-colors"
      >
        {isExpanded ? "Свернуть" : "Читать далее"}
      </button>
    </div>
  );
};
function App() {
  const [date, setDate] = useState({ day: '', month: '', year: '' });
  const [result, setResult] = useState(null);
  const [recommendedProduct, setRecommendedProduct] = useState(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isSketchOpen, setIsSketchOpen] = useState(false);
  const [isLegacyBookOpen, setIsLegacyBookOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  // Maintenance Timer State
  const [maintenanceTime, setMaintenanceTime] = useState(6540); // 1h 49m = 109m * 60s = 6540s

  // Holiday Feature State
  const [isHolidaysOpen, setIsHolidaysOpen] = useState(false);
  const [isGiftCatalogOpen, setIsGiftCatalogOpen] = useState(false);
  const [selectedHolidayName, setSelectedHolidayName] = useState('');
  const [giftCatalogProducts, setGiftCatalogProducts] = useState([]);

  const handleOpenGiftCatalog = (tags, holidayName) => {
    // Map holiday tags to product categorySlugs from products.js
    const tagMap = {
      'idols': 'figures',
      'axes': 'axes',
      'amulets': 'amulets',
      'decor': 'runes' // Mapping decor to runes to ensure products show up
    };

    const targetCategories = tags.map(t => tagMap[t] || t);

    // Filter products from the main products array
    const filtered = products.filter(p => targetCategories.includes(p.categorySlug));

    setGiftCatalogProducts(filtered);
    setSelectedHolidayName(holidayName);
    setIsHolidaysOpen(false);
    setIsGiftCatalogOpen(true);
  };

  useEffect(() => {
    // Reset timer on mount (every time user opens/refreshes page)
    setMaintenanceTime(6540);

    const timer = setInterval(() => {
      setMaintenanceTime((prev) => (prev > 0 ? prev - 1 : 6540)); // Loop or stop at 0? User said "starts from beginning every time opens". On refresh it resets.
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ... lines 73-535 ...



  // Promo Code State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState(false);
  const [promoUseLimit, setPromoUseLimit] = useState(null); // null = unlimited, number = daily limit

  const handlePromoSubmit = async () => {
    const code = promoCode.trim().toLowerCase();
    setPromoError(false);

    try {
      const response = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'sketch' })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success
        setPromoUseLimit(result.data.limit || null);
        setIsPromoModalOpen(false);
        setIsSketchOpen(true);
        setPromoCode('');
        setPromoError(false);
      } else {
        // Error from server
        setPromoError(result.error || 'Неверный код доступа');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setPromoError('Ошибка сети. Попробуйте позже.');
    }
  };

  const findProduct = (slavicData, zoroData) => {
    // Нормализация строк для поиска (нижний регистр)
    const hallName = slavicData.hall.toLowerCase(); // "чертог ворон"
    const godName = slavicData.god.toLowerCase();     // "коляда"
    const totemName = zoroData.totem.toLowerCase();   // "ворон"

    // 1. Поиск по Чертогу (приоритет)
    let match = products.find(p => p.tags.some(tag => hallName.includes(tag) || godName.includes(tag)));

    // 2. Если нет, поиск по Тотему
    if (!match) {
      match = products.find(p => p.tags.some(tag => totemName.includes(tag)));
    }

    // 3. Если нет совпадений - товар по умолчанию (id: 3 - Амулет)
    if (!match) {
      match = products.find(p => p.id === 3);
    }

    return match;
  };

  const handleCalculate = () => {
    const d = parseInt(date.day);
    const m = parseInt(date.month);
    const y = parseInt(date.year);

    if (!d || !m || !y) {
      alert('Пожалуйста, заполните все поля!');
      return;
    }

    const slavic = getSlavicHall(d, m);
    const zoro = getZoroastrianTotem(y, m, d);
    const zodiac = getZodiac(d, m);

    // Подбор товара
    const product = findProduct(slavic, zoro);

    setResult(null);
    setRecommendedProduct(null);

    setTimeout(() => {
      setResult({ slavic, zoro, zodiac });
      setRecommendedProduct(product);
    }, 50);
  };

  return (
    // Главный контейнер (фон - глубокий черный)
    <div className="min-h-screen text-parchment font-sans selection:bg-bronze/30 selection:text-white relative overflow-x-hidden bg-primary">
      {/* Premium Background */}
      <div className="fixed inset-0 z-0">
        {/* Subtle Noble Glow (Red/Gold) */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-bronze/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[120px]"></div>

        {/* Grain/Texture Overlay (Leather effect) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

        {/* Strong Vignette for focus */}
        <div className="absolute inset-0 bg-radial-gradient-t from-transparent via-primary/80 to-primary pointer-events-none"></div>
      </div>

      <div className="max-w-md mx-auto p-4 flex flex-col relative z-20">

        {/* Header Section */}
        <header className="text-center mb-12 relative z-10">
          {/* Enhanced Logo Glow Layers */}
          <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-48 h-48 bg-gold/10 rounded-full blur-[60px] -z-10 animate-pulse"></div>

          {/* Shimmering Gold Layer */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute top-[40px] left-1/2 -translate-x-1/2 w-56 h-56 bg-gold/5 rounded-full blur-[40px] -z-10"
          />

          <div className="mb-6 flex justify-center relative">
            {/* Direct Backglow */}
            <div className="absolute inset-0 bg-gold/5 rounded-full blur-2xl animate-shimmer -z-10"></div>

            <img
              src="/images/logo_bw.png"
              alt="Обережье"
              className="h-32 w-auto object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)] opacity-95 hover:opacity-100 transition-all duration-700 hover:scale-105"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-3 uppercase tracking-widest font-serif text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Обережье
          </h1>
          <p className="text-ash text-xs sm:text-sm uppercase tracking-[0.5em] font-bold border-y border-bronze/30 py-3 mx-12">
            Связь Времен
          </p>
        </header>

        {/* Main Calculator Card - Leather Style */}
        <div className="bg-secondary border-2 border-dashed border-bronze/40 p-1 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9)] relative overflow-hidden ring-1 ring-black/50">
          {/* Stitching Effect Detail */}
          <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none"></div>

          <div className="bg-primary/30 rounded-[10px] p-4 relative overflow-hidden">
            {/* Oracle Badge */}
            <div className="text-center mb-6 px-1">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-parchment to-gold uppercase tracking-[0.25em] font-serif drop-shadow-sm w-full mb-6 max-w-full">
                Код Судьбы
              </h2>
              <button
                onClick={() => setIsOracleOpen(true)}
                className="w-full py-4 border border-gold/30 bg-primary/40 text-gold text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-gold/10 hover:border-gold/60 transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] backdrop-blur-sm group"
              >
                <span className="group-hover:text-parchment transition-colors duration-300">✦ Твоя Карта Дня ✦</span>
              </button>

              <button
                onClick={() => setIsLegacyBookOpen(true)}
                className="w-full py-4 border border-gold/30 bg-primary/40 text-gold text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-gold/10 hover:border-gold/60 transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] backdrop-blur-sm group mt-3"
              >
                <span className="group-hover:text-parchment transition-colors duration-300">✦ Книга Рода ✦</span>
              </button>
            </div>

            {/* Форма (Body) */}
            <div className="px-1 space-y-6">
              <DateInput value={date} onChange={setDate} />

              {/* Кнопка - Red Gradient with Stitching vibe */}
              <button
                onClick={handleCalculate}
                className="w-full py-4 bg-gradient-to-r from-bronze to-amber text-white font-bold uppercase tracking-widest hover:from-amber hover:to-bronze transition-all duration-500 rounded-lg cursor-pointer relative overflow-hidden group shadow-[0_5px_20px_rgba(159,43,43,0.4)] hover:shadow-[0_10px_30px_rgba(220,38,38,0.5)] border-t border-white/20 font-serif"
              >
                <span className="relative z-10 drop-shadow-md">Узнать свой оберег</span>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12"></div>
              </button>

              {/* Блок результатов */}
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="mt-8 p-6 bg-black/30 border border-secondary/30 rounded text-center space-y-8 relative overflow-hidden"
                  >
                    {/* Background Logo */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      <img src="/images/logo_bw.png" alt="" className="w-3/4 object-contain opacity-5 brightness-50 contrast-150 mix-blend-overlay" />
                    </div>

                    {/* Славянский */}
                    <div className="relative z-10">
                      <h3 className="text-amber text-xs uppercase tracking-[0.2em] mb-1">Твой Чертог</h3>
                      <p className="text-2xl text-parchment font-medium font-serif">{result.slavic.hall}</p>
                      <p className="text-xs text-ash mt-1 mb-3 uppercase tracking-wider">{result.slavic.god}</p>
                      <CollapsibleText text={result.slavic.description || "Описание чертога пока не добавлено."} />
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>

                    {/* Зороастрийский (Тотем) */}
                    <div className="relative z-10">
                      <h3 className="text-amber text-xs uppercase tracking-[0.2em] mb-1">Твой Тотем</h3>
                      <p className="text-2xl text-parchment font-medium font-serif">{result.zoro.totem}</p>
                      <p className="text-xs text-ash mt-1 mb-3 uppercase tracking-wider">{result.zoro.symbol}</p>
                      <CollapsibleText text={result.zoro.description || "Описание тотема пока не добавлено."} />
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>

                    {/* Зодиак */}
                    <div className="relative z-10">
                      <h3 className="text-amber text-xs uppercase tracking-[0.2em] mb-1">Знак Зодиака</h3>
                      <p className="text-xl text-parchment font-medium font-serif">{result.zodiac}</p>
                    </div>

                    {/* Рекомендация Товара */}
                    {recommendedProduct && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mt-8 border-t border-secondary/30 pt-6"
                      >
                        <h3 className="text-bronze text-sm uppercase tracking-widest font-bold mb-6">
                          Твой Артефакт Силы
                        </h3>

                        <div className="bg-primary/50 rounded-lg overflow-hidden border border-secondary/30 hover:border-bronze/50 transition-colors group">
                          <div className="overflow-hidden relative">
                            <img
                              src={recommendedProduct.image}
                              alt={recommendedProduct.name}
                              className="w-full aspect-[3/4] object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                          </div>

                          <div className="p-5 relative z-10 -mt-12 bg-gradient-to-t from-primary via-primary to-transparent pt-12 text-center">
                            <h4 className="text-parchment font-serif text-lg leading-tight mb-2 group-hover:text-amber transition-colors">
                              {recommendedProduct.name}
                            </h4>
                            <p className="text-xs text-ash mb-4 line-clamp-3 leading-relaxed">
                              {recommendedProduct.description}
                            </p>

                            <div className="mt-4 space-y-3">
                              {recommendedProduct.longDescription && (
                                <button
                                  onClick={() => setIsLegendOpen(true)}
                                  className="text-mystic hover:text-white underline decoration-dotted text-xs font-medium cursor-pointer transition-colors w-full text-center"
                                >
                                  ✦ Узнать значение символа
                                </button>
                              )}

                              <div className="text-ash text-xs">
                                Цена без скидки: <span className="line-through">{recommendedProduct.price}</span>
                              </div>
                              <div className="text-amber font-bold text-sm animate-pulse">
                                Смотреть цену с личной скидкой:
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {recommendedProduct.links?.wb && (
                                  <a
                                    href={recommendedProduct.links.wb}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-[#cb11ab]/20 border border-[#cb11ab]/50 text-[#cb11ab] hover:bg-[#cb11ab] hover:text-white text-xs font-bold uppercase py-3 px-2 rounded hover:shadow-[0_0_15px_rgba(203,17,171,0.4)] transition-all text-center flex items-center justify-center"
                                  >
                                    Wildberries
                                  </a>
                                )}
                                {recommendedProduct.links?.ozon && (
                                  <a
                                    href={recommendedProduct.links.ozon}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-[#005bff]/20 border border-[#005bff]/50 text-[#005bff] hover:bg-[#005bff] hover:text-white text-xs font-bold uppercase py-3 px-2 rounded hover:shadow-[0_0_15px_rgba(0,91,255,0.4)] transition-all text-center flex items-center justify-center"
                                  >
                                    Ozon
                                  </a>
                                )}
                              </div>

                              <a
                                href="https://t.me/topordorf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-[#229ED9]/20 border border-[#229ED9]/50 text-[#229ED9] hover:bg-[#229ED9] hover:text-white font-bold uppercase rounded transition-all hover:shadow-[0_0_15px_rgba(34,158,217,0.4)] flex flex-col items-center justify-center"
                              >
                                <span className="text-xs leading-none">Получить больше полезной</span>
                                <span className="text-xs leading-none mt-1">информации бесплатно</span>
                              </a>

                              {/* Кнопка "Вопрос Мастеру" */}
                              <button
                                onClick={() => setIsContactModalOpen(true)}
                                className="w-full py-3 border border-ash/30 text-ash hover:border-parchment hover:text-parchment transition-colors rounded uppercase text-xs tracking-wider font-medium"
                              >
                                Задать вопрос мастеру
                              </button>

                              <button
                                onClick={() => setIsCatalogOpen(true)}
                                className="w-full py-3 text-bronze hover:text-amber font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                                Весь каталог
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Модальное окно "Связь с Мастером" */}
            <AnimatePresence>
              {isContactModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                  onClick={() => setIsContactModalOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-primary border border-secondary p-6 rounded-xl w-full max-w-sm shadow-2xl space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

                    <h3 className="text-xl font-bold text-parchment text-center uppercase tracking-wide mb-4 font-serif relative z-10">
                      Связь с Мастером
                    </h3>

                    <a
                      href={CONTACTS.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/50 text-[#229ED9] hover:text-white font-bold uppercase rounded text-center transition-all flex items-center justify-center gap-2 relative z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.02-2.38-1.63-1.05-.69-.37-1.07.23-1.68.15-.15 2.81-2.57 2.86-2.79.01-.05.01-.1-.02-.14-.03-.04-.08-.06-.11-.04-.08.02-1.29.82-3.64 2.41-.34.23-.66.35-.97.35-.32-.01-.94-.18-1.4-.33-.56-.18-1.01-.28-1.04-.58.02-.16.24-.32.65-.49 2.54-1.1 4.23-1.84 5.08-2.19 2.42-.99 2.92-1.16 3.25-1.16.07 0 .23.01.33.09.09.07.12.17.12.27 0 .1 0 .2-.01.24z" />
                      </svg>
                      Telegram
                    </a>

                    <a
                      href={CONTACTS.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-[#25D366] hover:text-white font-bold uppercase rounded text-center transition-all flex items-center justify-center gap-2 relative z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>

                    <a
                      href={CONTACTS.max}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 hover:from-purple-500/40 hover:to-pink-500/40 text-pink-300 font-bold uppercase rounded text-center transition-all flex items-center justify-center gap-2 shadow-lg relative z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
                      </svg>
                      MAX
                    </a>

                    <button
                      onClick={() => setIsContactModalOpen(false)}
                      className="w-full pt-4 text-ash text-xs uppercase tracking-widest hover:text-parchment transition-colors relative z-10"
                    >
                      Отмена
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Модальное окно Каталога */}
            <AnimatePresence>
              {isCatalogOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
                >
                  <div className="w-full max-w-2xl bg-primary border border-secondary rounded-xl overflow-hidden mt-8 mb-8 shadow-2xl relative">

                    {/* Header Каталога */}
                    <div className="sticky top-0 bg-primary/95 backdrop-blur z-10 border-b border-secondary p-4 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-parchment uppercase tracking-widest font-serif">
                        Мастерская
                      </h2>
                      <button
                        onClick={() => { setIsCatalogOpen(false); setActiveCategory(null); }}
                        className="p-2 hover:bg-black/20 rounded-full transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-ash hover:text-parchment">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-black/10">
                      {!activeCategory ? (
                        // Список Категорий
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categories.map(cat => (
                            <div
                              key={cat.id}
                              onClick={() => setActiveCategory(cat.slug)}
                              className="group relative h-48 rounded-lg overflow-hidden cursor-pointer border border-secondary/50 hover:border-bronze transition-colors"
                            >
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40 transition-colors">
                                <h3 className="text-2xl font-bold text-parchment uppercase tracking-widest font-serif drop-shadow-lg text-center px-2">
                                  {cat.name}
                                </h3>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Список Товаров
                        <div>
                          <button
                            onClick={() => setActiveCategory(null)}
                            className="mb-6 flex items-center gap-2 text-ash hover:text-parchment transition-colors text-sm uppercase tracking-wide font-bold"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Назад к категориям
                          </button>

                          <div className="space-y-6">
                            {products
                              .filter(p => p.categorySlug === activeCategory)
                              .map(product => (
                                <div key={product.id} className="bg-primary/50 border border-secondary/30 rounded-lg overflow-hidden flex flex-col sm:flex-row group hover:border-bronze/50 transition-colors">
                                  <div className="sm:w-1/3 aspect-square sm:aspect-auto sm:h-auto relative">
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    />
                                  </div>
                                  <div className="p-4 sm:w-2/3 flex flex-col justify-between">
                                    <div>
                                      <h4 className="text-parchment font-serif text-lg leading-tight mb-2 group-hover:text-amber transition-colors">
                                        {product.name}
                                      </h4>
                                      <p className="text-xs text-ash mb-3 line-clamp-2">
                                        {product.description}
                                      </p>
                                    </div>
                                    <div className="mt-2">
                                      <div className="text-ash text-xs mb-1">
                                        Цена без скидки: <span className="line-through">{product.price}</span>
                                      </div>
                                      <div className="text-amber font-bold text-sm mb-3">
                                        Смотреть цену с личной скидкой:
                                      </div>
                                      <div className="flex gap-2">
                                        {product.links.wb && (
                                          <a href={product.links.wb} target="_blank" rel="noreferrer" className="flex-1 bg-[#cb11ab]/20 border border-[#cb11ab]/50 hover:bg-[#cb11ab] hover:text-white text-[#cb11ab] text-[10px] sm:text-xs font-bold uppercase py-2 rounded text-center transition-all shadow-md hover:shadow-[0_0_15px_rgba(203,17,171,0.4)]">
                                            Wildberries
                                          </a>
                                        )}
                                        {product.links.ozon && (
                                          <a href={product.links.ozon} target="_blank" rel="noreferrer" className="flex-1 bg-[#005bff]/20 border border-[#005bff]/50 hover:bg-[#005bff] hover:text-white text-[#005bff] text-[10px] sm:text-xs font-bold uppercase py-2 rounded text-center transition-all shadow-md hover:shadow-[0_0_15px_rgba(0,91,255,0.4)]">
                                            Ozon
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* Кнопка "Ближайшие Праздники" */}
        <div className="w-full max-w-md mb-4 mt-4">
          <button
            onClick={() => setIsHolidaysOpen(true)}
            className="w-full py-4 bg-secondary/80 border border-bronze/30 hover:border-bronze hover:bg-secondary text-parchment font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">📅</span>
            <span className="group-hover:text-gold transition-colors">Ближайшие Праздники</span>
          </button>
        </div>

        {/* Ссылка на генератор эскизов */}
        <div className="w-full max-w-md mb-6">
          <div className="bg-primary/40 border border-secondary p-6 rounded-2xl text-center relative overflow-hidden group hover:border-bronze/30 transition-colors">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>

            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-parchment via-gold to-parchment uppercase tracking-widest font-serif mb-2">
              Мастерская Эскизов
            </h3>
            <p className="text-xs text-ash mb-4 px-4">
              СОЗДАЙ СВОЙ УНИКАЛЬНЫЙ ДИЗАЙН ДЛЯ ТОПОРА
            </p>

            <button
              onClick={() => setIsPromoModalOpen(true)}
              className="px-8 py-3 bg-transparent border border-gold/30 text-gold hover:bg-gold hover:text-primary font-bold uppercase rounded-full transition-all text-xs tracking-wider flex items-center gap-2 mx-auto hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Открыть Генератор
            </button>
          </div>
        </div>
      </div>

      {/* Promo Code Modal */}
      <AnimatePresence>
        {isPromoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setIsPromoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary border-2 border-dashed border-bronze/40 p-8 rounded-xl w-full max-w-md shadow-2xl text-center relative overflow-hidden"
            >
              {/* Stitching Detail */}
              <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none"></div>

              {/* Background Decoration */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <img src="/images/logo_bw.png" alt="" className="w-full h-full object-contain mix-blend-overlay" />
              </div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

              <div className="relative z-10">
                {/* Maintenance Message (Inside Modal) */}
                <div className="mb-6 text-center animate-pulse border-b border-bronze/20 pb-4">
                  <p className="text-amber font-bold uppercase tracking-widest text-sm mb-1">
                    ⚠️ Техническое обслуживание ⚠️
                  </p>
                  <p className="text-ash text-[10px] uppercase tracking-wide">
                    Возможны перебои в работе
                  </p>
                  <p className="text-ash text-xs uppercase tracking-wide mt-2">
                    Ожидаемое время завершения:<br />
                    <span className="text-gold font-mono text-xl font-bold">{formatTime(maintenanceTime)}</span>
                  </p>
                </div>

                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-parchment via-gold to-parchment uppercase tracking-widest mb-6 font-serif">
                  Доступ к Мастерской
                </h3>

                {!promoError ? (
                  <>
                    <p className="text-ash text-sm mb-4">
                      Введите секретный код доступа, чтобы открыть генератор.
                    </p>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Введите код"
                      className="w-full bg-primary/80 border border-secondary text-center text-gold focus:border-amber outline-none transition-all rounded mb-4 placeholder-ash/30 p-3 shadow-inner font-mono tracking-widest"
                      autoFocus
                    />
                    <button
                      onClick={handlePromoSubmit}
                      className="w-full py-3 bg-gradient-to-r from-bronze to-amber hover:from-amber hover:to-bronze text-white font-bold uppercase rounded transition-all shadow-lg hover:shadow-red-900/40 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Войти</span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12"></div>
                    </button>
                  </>
                ) : (
                  <div className="animate-shake">
                    <p className="text-red-500 font-bold mb-2 uppercase tracking-wide">Неверный код!</p>
                    <p className="text-ash text-sm mb-6">
                      Для получения кода обратитесь к Мастеру.
                    </p>

                    <a
                      href={CONTACTS.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-[#229ED9]/20 hover:bg-[#229ED9]/40 border border-[#229ED9]/50 text-[#229ED9] hover:text-white font-bold uppercase rounded transition-all mb-3 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.02-2.38-1.63-1.05-.69-.37-1.07.23-1.68.15-.15 2.81-2.57 2.86-2.79.01-.05.01-.1-.02-.14-.03-.04-.08-.06-.11-.04-.08.02-1.29.82-3.64 2.41-.34.23-.66.35-.97.35-.32-.01-.94-.18-1.4-.33-.56-.18-1.01-.28-1.04-.58.02-.16.24-.32.65-.49 2.54-1.1 4.23-1.84 5.08-2.19 2.42-.99 2.92-1.16 3.25-1.16.07 0 .23.01.33.09.09.07.12.17.12.27 0 .1 0 .2-.01.24z" /></svg>
                      Написать Мастеру
                    </a>

                    <button
                      onClick={() => { setPromoError(false); setPromoCode(''); }}
                      className="text-ash text-xs uppercase hover:text-gold transition-colors border-b border-transparent hover:border-gold"
                    >
                      Попробовать снова
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {isSketchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] overflow-y-auto bg-black/95 backdrop-blur-md"
            onClick={() => setIsSketchOpen(false)}
          >
            <div className="flex min-h-full items-start md:items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl relative my-8 md:my-0"
              >
                <button
                  onClick={() => setIsSketchOpen(false)}
                  className="absolute -top-12 right-0 text-ash hover:text-gold transition-colors flex items-center gap-2 uppercase text-xs font-bold tracking-widest"
                >
                  Закрыть
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="bg-secondary border-2 border-dashed border-bronze/40 rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none z-50"></div>
                  <SketchGenerator usageLimit={promoUseLimit} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer: Подписка и Отзывы */}
      <div className="w-full max-w-2xl mt-6 space-y-8 mx-auto px-6 pb-12 relative z-20">
        {/* Подписка */}
        <div className="bg-primary/50 border border-secondary/30 rounded-xl p-6 text-center shadow-lg relative overflow-hidden group hover:border-bronze/30 transition-colors">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <img src="/images/logo_bw.png" alt="" className="w-full h-full object-contain mix-blend-overlay" />
          </div>
          <div className="relative z-10">
            <h3 className="text-bronze font-serif text-lg mb-2">Хочешь знать больше о силе знаков?</h3>
            <p className="text-ash text-sm mb-4">Подписывайся на закрытый канал мастерской</p>
            <a
              href="https://t.me/topordorf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#229ED9]/20 border border-[#229ED9]/50 hover:bg-[#229ED9] hover:text-white text-[#229ED9] font-bold uppercase rounded-full transition-all gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.02-2.38-1.63-1.05-.69-.37-1.07.23-1.68.15-.15 2.81-2.57 2.86-2.79.01-.05.01-.1-.02-.14-.03-.04-.08-.06-.11-.04-.08.02-1.29.82-3.64 2.41-.34.23-.66.35-.97.35-.32-.01-.94-.18-1.4-.33-.56-.18-1.01-.28-1.04-.58.02-.16.24-.32.65-.49 2.54-1.1 4.23-1.84 5.08-2.19 2.42-.99 2.92-1.16 3.25-1.16.07 0 .23.01.33.09.09.07.12.17.12.27 0 .1 0 .2-.01.24z" /></svg>
              Перейти в Telegram
            </a>
          </div>
        </div>

        {/* Отзывы */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Иван, г. Тверь", text: "Заказывал топор с Велесом. Работа — огонь, чувствуется мощь в руке." },
            { name: "Ольга, Москва", text: "Амулет пришел быстро. Очень красивая детализация, ношу не снимая." },
            { name: "Дмитрий, Екб", text: "Мастера своего дела. Тотем определили верно, характер совпал на 100%." }
          ].map((review, i) => (
            <div key={i} className="bg-secondary border border-bronze/10 rounded-lg p-4 text-center hover:border-bronze/30 transition-colors">
              <div className="flex justify-center mb-2 text-gold text-xs">★★★★★</div>
              <p className="text-ash text-xs italic mb-3">"{review.text}"</p>
              <p className="text-bronze text-[10px] font-bold uppercase tracking-widest">{review.name}</p>
            </div>
          ))}
        </div>
      </div>

      <LegacyBook isOpen={isLegacyBookOpen} onClose={() => setIsLegacyBookOpen(false)} />

      <DailyOracle
        isOpen={isOracleOpen}
        onClose={() => setIsOracleOpen(false)}
        telegramLink={CONTACTS.telegram}
      />

      {/* Модальное окно "Легенда" */}
      <AnimatePresence>
        {isLegendOpen && recommendedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setIsLegendOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary border-2 border-dashed border-bronze/40 p-8 rounded-xl w-full max-w-md shadow-2xl space-y-6 relative overflow-hidden"
            >
              {/* Stitching Detail */}
              <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none"></div>

              {/* Background Decoration */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <img src="/images/oracle_bg.png" alt="" className="w-3/4 object-contain brightness-50" />
              </div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

              <div className="relative z-10 text-center">
                <h3 className="text-2xl font-bold text-gold uppercase tracking-widest font-serif mb-4 drop-shadow-sm">
                  {recommendedProduct.name}
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber to-transparent mx-auto mb-6"></div>
                <p className="text-parchment text-base leading-relaxed font-serif italic whitespace-pre-line">
                  {recommendedProduct.longDescription}
                </p>
              </div>

              <button
                onClick={() => setIsLegendOpen(false)}
                className="w-full py-3 bg-primary/50 border border-secondary hover:bg-secondary text-ash hover:text-white font-bold uppercase rounded transition-colors tracking-widest text-xs relative z-10"
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно "Праздники" */}
      <AnimatePresence>
        {isHolidaysOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
            onClick={() => setIsHolidaysOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-secondary border-2 border-dashed border-bronze/40 rounded-xl overflow-hidden shadow-2xl relative my-8"
            >
              <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none z-50"></div>

              <div className="p-0 relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-secondary z-0"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-bronze/10 to-transparent z-0 pointer-events-none"></div>

                <div className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setIsHolidaysOpen(false)} className="text-ash hover:text-gold transition-colors text-xs uppercase font-bold flex items-center gap-2 group">
                      <span className="group-hover:-translate-x-1 transition-transform">←</span> Назад
                    </button>
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber uppercase tracking-[0.2em] font-serif text-center drop-shadow-sm">
                      Грядущие События
                    </h2>
                    <div className="w-16"></div>
                  </div>

                  <div className="mb-6 flex items-center gap-4">
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-bronze/30 to-transparent flex-grow"></div>
                    <span className="text-ash text-[10px] uppercase tracking-[0.3em]">Ближайшие 30 дней</span>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-bronze/30 to-transparent flex-grow"></div>
                  </div>

                  <div className="space-y-4">
                    {getUpcomingHolidays().length > 0 ? (
                      getUpcomingHolidays().map((h, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative group cursor-default"
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-bronze to-amber rounded-lg blur opacity-10 group-hover:opacity-40 transition duration-500"></div>
                          <div className="relative bg-primary border border-secondary p-5 rounded-lg flex flex-col gap-4 hover:border-bronze/50 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl border border-bronze/20 shadow-inner group-hover:scale-110 transition-transform duration-300 ring-1 ring-black">
                                {h.type === 'male' ? '⚔️' : h.type === 'female' ? '🌺' : '🔮'}
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-gold text-xs font-bold tracking-widest uppercase">{h.displayDate}</span>
                                  <span className="w-2 h-2 rounded-full bg-amber shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse"></span>
                                </div>
                                <h3 className="text-parchment font-serif text-lg leading-tight group-hover:text-gold transition-colors">{h.name}</h3>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenGiftCatalog(h.tags, h.name)}
                              className="w-full py-3 bg-secondary border border-bronze/30 hover:border-bronze hover:bg-bronze hover:text-white text-ash font-bold uppercase text-xs rounded transition-all duration-300 flex items-center justify-center gap-2 group/btn relative overflow-hidden shadow-md"
                            >
                              <span className="relative z-10 flex items-center gap-2 group-hover/btn:tracking-widest transition-all">
                                🎁 Подобрать подарок
                              </span>
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-ash py-12 flex flex-col items-center gap-4">
                        <span className="text-6xl opacity-30 grayscale filter blur-[1px]">🦉</span>
                        <p className="font-serif text-lg text-parchment">В ближайшие 30 дней тишина...</p>
                        <p className="text-xs uppercase tracking-widest text-bronze">Время копить ману</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно "Подарки к празднику" */}
      <AnimatePresence>
        {isGiftCatalogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-start justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto pt-10"
            onClick={() => setIsGiftCatalogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-secondary border-2 border-dashed border-bronze/40 rounded-xl overflow-hidden shadow-2xl relative mb-10"
            >
              <div className="absolute inset-[3px] border border-dashed border-bronze/20 rounded-[10px] pointer-events-none z-50"></div>

              {/* Header */}
              <div className="sticky top-0 bg-secondary/95 backdrop-blur z-20 border-b border-bronze/20 p-4 flex items-center justify-between">
                <button
                  onClick={() => { setIsGiftCatalogOpen(false); setIsHolidaysOpen(true); }}
                  className="flex items-center gap-2 text-ash hover:text-gold transition-colors text-xs uppercase tracking-wide font-bold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  К праздникам
                </button>

                <h2 className="text-sm font-bold text-parchment uppercase tracking-widest font-serif text-center flex-1 px-4">
                  <span className="text-amber">{selectedHolidayName}</span>
                </h2>

                <button
                  onClick={() => setIsGiftCatalogOpen(false)}
                  className="p-2 hover:bg-primary rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-ash hover:text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-6 relative z-10">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                {giftCatalogProducts.length > 0 ? (
                  giftCatalogProducts.map(p => (
                    <div key={p.id} className="bg-primary/80 border border-secondary rounded-xl overflow-hidden flex flex-col md:flex-row relative group shadow-lg hover:border-bronze/50 transition-colors">
                      {/* Image Section (Left) */}
                      <div className="w-full md:w-1/2 relative shrink-0" style={{ aspectRatio: '3/4' }}>
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-0 left-0 p-3">
                          <span className="bg-black/80 backdrop-blur px-3 py-1 text-[10px] uppercase font-bold text-gold rounded border border-gold/30 shadow-lg">
                            Ручная работа
                          </span>
                        </div>
                      </div>

                      {/* Info Section (Right) */}
                      <div className="p-5 md:p-6 w-full md:w-1/2 flex flex-col justify-center text-left">
                        <h3 className="text-xl md:text-2xl font-bold text-parchment uppercase font-serif leading-tight mb-2 group-hover:text-gold transition-colors">
                          {p.name}
                        </h3>

                        <p className="text-ash text-sm leading-relaxed mb-3 line-clamp-3">
                          {p.description}
                        </p>

                        <button className="text-amber text-xs font-bold uppercase tracking-widest border-b border-amber/50 hover:border-amber pb-0.5 self-start mb-4 transition-colors">
                          ✦ Узнать значение символа
                        </button>

                        <div className="mt-auto space-y-3">
                          <div>
                            <p className="text-ash/50 text-xs line-through mb-1">
                              Цена без скидки: {parseInt(p.price.replace(/\D/g, '')) * 1.2} ₽
                            </p>
                            <p className="text-amber font-bold text-xs uppercase mb-3">
                              Смотреть цену с личной скидкой:
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <a href={p.links?.wb || "#"} target="_blank" rel="noreferrer" className="flex items-center justify-center bg-[#cb11ab]/20 border border-[#cb11ab]/50 hover:bg-[#cb11ab] hover:text-white text-[#cb11ab] font-bold py-3 rounded-lg text-xs uppercase transition-all shadow-lg hover:shadow-[0_0_15px_rgba(203,17,171,0.4)]">
                              Wildberries
                            </a>
                            <a href={p.links?.ozon || "#"} target="_blank" rel="noreferrer" className="flex items-center justify-center bg-[#005bff]/20 border border-[#005bff]/50 hover:bg-[#005bff] hover:text-white text-[#005bff] font-bold py-3 rounded-lg text-xs uppercase transition-all shadow-lg hover:shadow-[0_0_15px_rgba(0,91,255,0.4)]">
                              Ozon
                            </a>
                          </div>

                          <a href="https://t.me/topordorf" target="_blank" rel="noreferrer" className="block text-center w-full py-3 bg-[#229ED9]/20 hover:bg-[#229ED9] border border-[#229ED9]/50 text-[#229ED9] hover:text-white font-bold rounded-lg text-xs uppercase transition-all shadow-lg hover:shadow-[0_0_15px_rgba(34,158,217,0.4)]">
                            Получить больше полезной<br />информации бесплатно
                          </a>

                          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-secondary">
                            <button className="w-full py-2 bg-secondary hover:bg-primary border border-secondary text-ash hover:text-white font-bold rounded-lg text-[10px] uppercase transition-colors">
                              Задать вопрос мастеру
                            </button>
                            <button onClick={() => { setIsGiftCatalogOpen(false); setIsHolidaysOpen(true); }} className="w-full py-2 bg-transparent hover:bg-secondary text-ash hover:text-gold font-bold rounded-lg text-[10px] uppercase transition-colors flex items-center justify-center gap-2">
                              ≡ Весь каталог
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-ash py-12">
                    <p className="mb-4 text-4xl opacity-50 grayscale">🦉</p>
                    <p className="font-serif text-lg">Товары для этого праздника скоро появятся.</p>
                    <button onClick={() => { setIsGiftCatalogOpen(false); setIsHolidaysOpen(true); }} className="mt-4 text-amber hover:text-gold font-bold text-xs uppercase border-b border-amber hover:border-gold pb-0.5">
                      Вернуться назад
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}

export default App;
