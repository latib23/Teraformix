import React from 'react';

const ChristmasLights = () => {
    return (
        <div className="absolute top-0 left-0 w-full h-12 overflow-hidden pointer-events-none z-50 flex justify-center">
            <ul className="flex justify-between w-full max-w-7xl px-4" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <li key={i} className={`
                relative w-3 h-3 rounded-full mt-[-4px]
                animate-pulse
                ${i % 4 === 0 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : ''}
                ${i % 4 === 1 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : ''}
                ${i % 4 === 2 ? 'bg-yellow-400 shadow-[0_0_10px_#facc15]' : ''}
                ${i % 4 === 3 ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : ''}
                before:content-[''] before:absolute before:top-[-8px] before:left-1/2 before:w-[2px] before:h-[8px] before:bg-gray-800
             `}
                        style={{ animationDelay: `${Math.random() * 2}s`, animationDuration: `${1 + Math.random()}s` }}
                    >
                    </li>
                ))}
            </ul>
            {/* Wire connecting them */}
            <div className="absolute top-[-2px] left-0 w-full h-[2px] bg-gray-800" />
        </div>
    );
};

export default ChristmasLights;
