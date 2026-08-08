import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { HERO_IMG, ROLES } from '../data.js';

export default function Hero() {
  const sectionRef = useRef(null);
  const [role, setRole] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ ease: 'power3.out' })
        .from('.name-reveal', { opacity: 0, y: 50, duration: 1.2, delay: 0.1 })
        .from('.blur-in', { opacity: 0, y: 20, filter: 'blur(10px)', duration: 1, stagger: 0.1, delay: 0.3 }, '-=0.6');
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRole((r) => (r + 1) % ROLES.length), 2000);
    return () => clearInterval(t);
  }, []);

  function ir(target) {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section id="inicio" ref={sectionRef} className="relative min-h-screen overflow-hidden bg-cream flex items-center justify-center">
      <div className="absolute inset-0">
        <img src={HERO_IMG} alt="Plato de MixGustos" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/55 to-cream/25" />
        <div className="absolute inset-0 bg-brand-600/10 mix-blend-multiply" />
      </div>

      <div className="relative z-10 px-6 text-center max-w-4xl mx-auto py-28">
        <p className="blur-in text-xs text-cacao-soft uppercase tracking-[0.3em] mb-8">MixGustos · Cocina auténtica</p>
        <h1 className="name-reveal font-display italic text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight text-cacao mb-6">
          MixGustos
        </h1>
        <p className="blur-in text-base md:text-lg text-cacao-soft mb-4">
          El{' '}
          <span key={role} className="font-display italic text-cacao inline-block animate-role-fade-in">
            {ROLES[role]}
          </span>{' '}
          se sirve aquí.
        </p>
        <p className="blur-in text-sm md:text-base text-mutedwarm max-w-md mx-auto mb-12">
          Sabores que combinan lo mejor de la tradición con un toque moderno. Hecho con ingredientes frescos, cada día, para ti.
        </p>
        <div className="blur-in flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => ir('menu')}
            className="group rounded-full bg-cacao text-cream text-sm px-7 py-3.5 font-medium transition-all duration-200 hover:scale-105 hover:shadow-lift inline-flex items-center gap-2"
          >
            Ver menú <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => ir('reservas')}
            className="rounded-full border-2 border-cacao/30 bg-cream/80 text-cacao text-sm px-7 py-3.5 font-medium transition-all duration-200 hover:scale-105 hover:border-brand-500 hover:text-brand-600 inline-flex items-center gap-2"
          >
            <MessageCircle size={15} /> Reservar mesa
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
        <span className="text-[10px] text-mutedwarm uppercase tracking-[0.25em]">Descubre</span>
        <div className="h-10 w-px bg-stroke-dark overflow-hidden">
          <div className="accent-gradient h-1/3 w-full animate-scroll-down" />
        </div>
      </div>
    </section>
  );
}
