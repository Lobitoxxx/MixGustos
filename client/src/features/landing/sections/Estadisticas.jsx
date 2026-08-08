import React from 'react';
import { motion } from 'framer-motion';
import { STATS } from '../data.js';

export default function Estadisticas() {
  return (
    <section className="bg-cream pb-20 md:pb-28">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="rounded-3xl bg-cacao text-cream px-8 md:px-14 py-12 md:py-16 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="font-display italic text-5xl md:text-7xl accent-gradient bg-clip-text text-transparent">
                  {s.valor}
                </div>
                <div className="text-sm text-cream/70 mt-2 uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
