import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3 } from 'lucide-react';
import { RECETAS } from '../data.js';

export default function Recetas() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-10 md:mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-stroke-dark" />
            <span className="text-xs text-mutedwarm uppercase tracking-[0.3em]">Desde la cocina</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display italic text-4xl md:text-6xl text-cacao">
              Nuestras <span className="italic">recetas</span>
            </h2>
            <button className="hidden md:inline-flex items-center gap-2 rounded-full border border-stroke-dark bg-surface text-cacao text-sm px-6 py-3 transition-all duration-200 hover:scale-105 hover:shadow-lift">
              Ver todas <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>

        <div className="space-y-4">
          {RECETAS.map((r, i) => (
            <motion.article
              key={r.titulo}
              initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="group flex items-center gap-4 md:gap-6 rounded-[40px] md:rounded-full bg-surface/60 hover:bg-surface border border-stroke p-4 transition-all duration-300 hover:shadow-lift cursor-pointer"
            >
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden shrink-0 border border-stroke">
                <img src={r.imagen} alt={r.titulo} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display italic text-xl md:text-2xl text-cacao truncate">{r.titulo}</h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-mutedwarm">
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={12} /> {r.lectura}</span>
                  <span className="hidden sm:inline">{r.fecha}</span>
                </div>
              </div>
              <ArrowRight size={18} className="text-mutedwarm group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0 mr-2" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
