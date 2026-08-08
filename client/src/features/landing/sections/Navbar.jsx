import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Utensils } from 'lucide-react';
import { NAV_LINKS } from '../data.js';

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('inicio');

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.target);
    const onScroll = () => {
      setScrolled(window.scrollY > 100);
      const pos = window.scrollY + 260;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= pos) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function ir(target) {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4 pointer-events-none">
      <nav
        className={`pointer-events-auto inline-flex items-center rounded-full backdrop-blur-md border border-stroke bg-surface/85 px-2 py-2 transition-all duration-300 ${
          scrolled ? 'shadow-lift' : ''
        }`}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="relative h-9 w-9 rounded-full p-[2px] accent-gradient group"
          aria-label="MixGustos"
        >
          <span className="flex h-full w-full items-center justify-center rounded-full bg-cream text-[11px] font-display italic text-cacao group-hover:scale-[1.06] transition-transform">
            MG
          </span>
        </button>

        <span className="w-px h-5 bg-stroke mx-1 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-0.5 mx-1">
          {NAV_LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => ir(l.target)}
              className={`text-xs sm:text-sm rounded-full px-3 py-1.5 transition ${
                active === l.target ? 'text-cacao bg-stroke/60 font-medium' : 'text-mutedwarm hover:text-cacao hover:bg-stroke/40'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-stroke mx-1" />

        <button
          onClick={() => navigate('/login')}
          className="relative group rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium text-cacao"
        >
          <span className="absolute inset-[-2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 group-hover:bg-cream transition-colors">
            <Utensils size={13} className="text-brand-600" />
            Ingresar
            <ArrowUpRight size={13} className="text-brand-600" />
          </span>
        </button>
      </nav>
    </header>
  );
}
