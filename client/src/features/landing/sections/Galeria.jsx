import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GALERIA } from '../data.js';

gsap.registerPlugin(ScrollTrigger);

const ROT = ['-rotate-2', 'rotate-2', '-rotate-3', 'rotate-3', '-rotate-2', 'rotate-2'];

export default function Galeria() {
  const sectionRef = useRef(null);
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const contentRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        col1Ref.current,
        { y: 120 },
        {
          y: -240,
          ease: 'none',
          scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: true },
        }
      );
      gsap.fromTo(
        col2Ref.current,
        { y: -240 },
        {
          y: 120,
          ease: 'none',
          scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: true },
        }
      );
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.92 },
        {
          opacity: 1,
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'center center', scrub: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="galeria" ref={sectionRef} className="relative bg-cream min-h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="relative h-full max-w-[1400px] mx-auto px-6">
          <div ref={contentRef} className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-stroke-dark" />
              <span className="text-xs text-mutedwarm uppercase tracking-[0.3em]">Galería</span>
              <span className="w-8 h-px bg-stroke-dark" />
            </div>
            <h2 className="font-display italic text-4xl md:text-6xl text-cacao">
              Sabores en <span className="italic">imágenes</span>
            </h2>
            <p className="text-sm text-mutedwarm mt-3 max-w-sm">Haz clic en cualquier foto para verla a detalle.</p>
          </div>

          <div ref={col1Ref} className="absolute inset-y-0 left-0 md:left-[8%] w-[46%] md:w-[36%] flex flex-col justify-center gap-10 pointer-events-none">
            {GALERIA.filter((_, i) => i % 2 === 0).map((g, i) => (
              <button
                key={g}
                onClick={() => setLightbox(g)}
                className={`pointer-events-auto group relative aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden border border-stroke shadow-lift transition-transform duration-300 hover:scale-105 ${ROT[i * 2]}`}
              >
                <img src={g} alt="Plato MixGustos" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div ref={col2Ref} className="absolute inset-y-0 right-0 md:right-[8%] w-[46%] md:w-[36%] flex flex-col justify-center gap-10 pointer-events-none">
            {GALERIA.filter((_, i) => i % 2 === 1).map((g, i) => (
              <button
                key={g}
                onClick={() => setLightbox(g)}
                className={`pointer-events-auto group relative aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden border border-stroke shadow-lift transition-transform duration-300 hover:scale-105 ${ROT[i * 2 + 1]}`}
              >
                <img src={g} alt="Plato MixGustos" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-cacao/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition" onClick={() => setLightbox(null)}>
              <X size={22} />
            </button>
            <motion.img
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              transition={{ duration: 0.3 }}
              src={lightbox}
              alt="Plato MixGustos"
              className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
