import React, { useState, useEffect } from 'react';
import LoadingScreen from './sections/LoadingScreen.jsx';
import Navbar from './sections/Navbar.jsx';
import Hero from './sections/Hero.jsx';
import PlatosDestacados from './sections/PlatosDestacados.jsx';
import SeguirMiPedido from './sections/SeguirMiPedido.jsx';
import Galeria from './sections/Galeria.jsx';
import Recetas from './sections/Recetas.jsx';
import Estadisticas from './sections/Estadisticas.jsx';
import ReservasFooter from './sections/ReservasFooter.jsx';

export default function Landing() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  return (
    <>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      <Navbar />
      <main>
        <Hero />
        <PlatosDestacados />
        <SeguirMiPedido />
        <Galeria />
        <Recetas />
        <Estadisticas />
        <ReservasFooter />
      </main>
    </>
  );
}
