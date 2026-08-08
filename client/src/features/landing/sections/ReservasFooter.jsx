import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Clock3, MapPin, Instagram, Facebook, Send } from 'lucide-react';
import { CONTACTO, NAV_LINKS, RESERVAS_IMG, waLink } from '../data.js';

const REDES_ICON = { Facebook: Facebook, Instagram: Instagram, WhatsApp: MessageCircle, TikTok: Send };

export default function ReservasFooter() {
  function ir(target) {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  }

  const waReserva = waLink(
    CONTACTO.whatsapp,
    '¡Hola MixGustos! Quisiera reservar una mesa para visitarlos. ¿Tienen disponibilidad?'
  );

  return (
    <>
      <section id="reservas" className="bg-cream pb-20 md:pb-28">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative overflow-hidden rounded-3xl min-h-[420px] md:min-h-[480px] flex items-center"
          >
            <img src={RESERVAS_IMG} alt="Mesa reservada en MixGustos" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-cacao/95 via-cacao/80 to-cacao/30" />

            <div className="relative z-10 px-8 md:px-14 py-12 md:py-16 max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-px bg-cream/50" />
                <span className="text-xs text-cream/70 uppercase tracking-[0.3em]">Reservas</span>
              </div>
              <h2 className="font-display italic text-4xl md:text-6xl text-cream mb-4">
                Tu mesa te <span className="italic">espera</span>
              </h2>
              <p className="text-sm md:text-base text-cream/80 mb-8">
                Reserva para la familia, amigos o celebraciones. Te aseguramos un rincón acogedor y el mejor sabor de la casa.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={waReserva}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full accent-gradient text-white text-sm font-semibold px-7 py-3.5 transition-all duration-200 hover:scale-105 hover:shadow-glow"
                >
                  <MessageCircle size={16} /> Reservar por WhatsApp
                </a>
                <a
                  href={`tel:+${CONTACTO.whatsapp}`}
                  className="inline-flex items-center gap-2 rounded-full border border-cream/40 text-cream text-sm font-medium px-7 py-3.5 transition-all duration-200 hover:scale-105 hover:bg-cream/10"
                >
                  <Phone size={16} /> {CONTACTO.whatsapp}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-cacao-deep text-cream/80">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 py-14 md:py-16">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-10 w-10 rounded-full accent-gradient p-[2px]">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-cacao-deep font-display italic text-cream">
                    MG
                  </span>
                </span>
                <span className="font-display italic text-2xl text-cream">MixGustos</span>
              </div>
              <p className="text-sm text-cream/60 max-w-sm">
                Cocina auténtica con un toque moderno. Tradición en cada plato y calidez en cada visita.
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] text-cream/50 mb-4">Explora</h4>
              <ul className="space-y-2.5">
                {NAV_LINKS.map((l) => (
                  <li key={l.target}>
                    <button onClick={() => ir(l.target)} className="text-sm hover:text-cream transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] text-cream/50 mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <MapPin size={15} className="mt-0.5 text-brand-400 shrink-0" /> {CONTACTO.direccion}
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone size={15} className="text-brand-400 shrink-0" /> +{CONTACTO.whatsapp}
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock3 size={15} className="text-brand-400 shrink-0" /> Lun–Dom · 12:00 – 23:00
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-cream/15 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-cream/40">© {new Date().getFullYear()} MixGustos. Todos los derechos reservados.</p>
            <div className="flex items-center gap-3">
              {CONTACTO.redes.map((r) => {
                const Icon = REDES_ICON[r] || Send;
                return (
                  <a
                    key={r}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    aria-label={r}
                    className="h-9 w-9 rounded-full border border-cream/20 flex items-center justify-center text-cream/60 hover:text-cream hover:border-cream/40 hover:scale-110 transition-all"
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
