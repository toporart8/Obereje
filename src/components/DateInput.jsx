import React, { useRef } from 'react';

const DateInput = ({ value, onChange }) => {
    const dayRef = useRef(null);
    const monthRef = useRef(null);
    const yearRef = useRef(null);

    const handleDayChange = (e) => {
        let val = e.target.value;
        if (val.length > 2) val = val.slice(0, 2);
        if (parseInt(val) > 31) val = "31";

        onChange({ ...value, day: val });

        if (val.length === 2 && monthRef.current) {
            monthRef.current.focus();
        }
    };

    const handleMonthChange = (e) => {
        let val = e.target.value;
        if (val.length > 2) val = val.slice(0, 2);
        if (parseInt(val) > 12) val = "12";

        onChange({ ...value, month: val });

        if (val.length === 2 && yearRef.current) {
            yearRef.current.focus();
        }
    };

    const handleYearChange = (e) => {
        const currentYear = new Date().getFullYear();
        let val = e.target.value;
        if (val.length > 4) val = val.slice(0, 4);
        if (parseInt(val) > currentYear) val = currentYear.toString();

        onChange({ ...value, year: val });
    };

    const inputClasses = "w-full bg-secondary border-2 border-dashed border-bronze/30 p-3 text-center text-gold focus:border-amber focus:text-parchment outline-none transition-all rounded-lg text-xl font-bold placeholder:text-ash/50 focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] font-mono relative z-10 hover:border-bronze/60";
    const labelClasses = "block text-ash text-[10px] uppercase tracking-[0.2em] mb-2 text-center font-bold";

    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="relative group">
                <label className={labelClasses}>День</label>
                <div className="relative">
                    <input
                        ref={dayRef}
                        type="number"
                        value={value.day}
                        onChange={handleDayChange}
                        onFocus={(e) => e.target.select()}
                        placeholder="DD"
                        className={inputClasses}
                    />
                    {/* Inner Shadow/Texture for Depth */}
                    <div className="absolute inset-0 bg-black/10 pointer-events-none rounded-lg"></div>
                </div>
            </div>

            <div className="relative group">
                <label className={labelClasses}>Месяц</label>
                <div className="relative">
                    <input
                        ref={monthRef}
                        type="number"
                        value={value.month}
                        onChange={handleMonthChange}
                        onFocus={(e) => e.target.select()}
                        placeholder="MM"
                        className={inputClasses}
                    />
                    <div className="absolute inset-0 bg-black/10 pointer-events-none rounded-lg"></div>
                </div>
            </div>

            <div className="relative group">
                <label className={labelClasses}>Год</label>
                <div className="relative">
                    <input
                        ref={yearRef}
                        type="number"
                        value={value.year}
                        onChange={handleYearChange}
                        onFocus={(e) => e.target.select()}
                        placeholder="YYYY"
                        className={inputClasses}
                    />
                    <div className="absolute inset-0 bg-black/10 pointer-events-none rounded-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default DateInput;
