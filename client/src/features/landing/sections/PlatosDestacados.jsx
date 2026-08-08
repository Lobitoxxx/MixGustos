import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PLATOS } from '../data.js';

const SPANS = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'];

export default function PlatosDestacados() {
  function ir(target) {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section id="menu" className="bg-cream py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-12 md:mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-stroke-dark" />
            <span className="text-xs text-mutedwarm uppercase tracking-[0.3em]">Platos insignia</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="font-display italic text-4xl md:text-6xl text-cacao">
                Nuestra <span className="italic">cocina</span>
              </h2>
              <p className="text-sm md:text-base text-mutedwarm max-w-md mt-3">
                Una selección de los platos que nos acompañan todos los días, del horno y la sartén a tu mesa.
              </p>
            </div>
            <button
              onClick={() => ir('reservas')}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-stroke-dark bg-surface text-cacao text-sm px-6 py-3 transition-all duration-200 hover:scale-105 hover:shadow-lift"
            >
              Reservar para probarlos <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          {PLATOS.map((p, i) => (
            <motion.article
              key={p.nombre}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: (i % 2) * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              className={`group relative overflow-hidden rounded-3xl bg-surface border border-stroke aspect-[4/3] ${SPANS[i]}`}
            >
              <img
                src={p.img}
                alt={p.nombre}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cacao/70 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <span className="inline-flex rounded-full bg-cream/90 backdrop-blur px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
                  {p.precio}
                </span>
                <h3 className="font-display italic text-2xl md:text-3xl text-white">{p.nombre}</h3>
                <p className="text-sm text-white/80 mt-1 max-w-sm">{p.desc}</p>
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-cacao/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="rounded-full bg-white text-cacao text-sm px-6 py-2.5 font-medium shadow-lift inline-flex items-center gap-2">
                  Ver — <span className="font-display italic">{p.nombre}</span>
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
