import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PALABRAS = ['Sabor', 'Tradición', 'Placer'];

export default function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0);
  const [word, setWord] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const start = performance.now();
    const DURATION = 2700;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / DURATION);
      setCount(Math.round(p * 100));
      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setTimeout(onComplete, 400);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [onComplete]);

  useEffect(() => {
    const t = setInterval(() => setWord((w) => (w + 1) % PALABRAS.length), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-cream flex flex-col justify-between p-6 md:p-10">
      <div className="flex items-center justify-between animate-fade-in">
        <span className="text-xs uppercase tracking-[0.3em] text-mutedwarm">MixGustos</span>
        <span className="text-xs uppercase tracking-[0.3em] text-mutedwarm">Restaurante</span>
      </div>

      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="font-display italic text-5xl md:text-7xl lg:text-8xl text-cacao/90"
          >
            {PALABRAS[word]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="flex items-end justify-between gap-4">
        <span className="font-display italic text-2xl text-mutedwarm pb-2 hidden sm:block">Bienvenido</span>
        <span className="font-display italic text-7xl md:text-9xl text-cacao tabular-nums leading-none">
          {String(count).padStart(3, '0')}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-stroke">
        <div
          className="accent-gradient h-full origin-left"
          style={{ transform: `scaleX(${count / 100})`, boxShadow: '0 0 8px rgba(234, 88, 12, 0.4)' }}
        />
      </div>
    </div>
  );
}
