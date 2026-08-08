const img = (id, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMG = img('photo-1517248135467-4c7edcad34c4', 1920);
export const RESERVAS_IMG = img('photo-1555396273-367ea4eb4db5', 1920);

export const ROLES = ['mejor sabor', 'auténtico sabor', 'nuevo placer', 'sabor casero'];

export const NAV_LINKS = [
  { label: 'Inicio', target: 'inicio' },
  { label: 'Menú', target: 'menu' },
  { label: 'Mi pedido', target: 'seguir' },
  { label: 'Galería', target: 'galeria' },
  { label: 'Reservas', target: 'reservas' },
];

export const PLATOS = [
  {
    nombre: 'Lomo Saltado',
    desc: 'Salteado de lomo con verduras, papas doradas y arroz.',
    precio: 'S/ 38',
    img: img('photo-1504674900247-0877df9cc836'),
  },
  {
    nombre: 'Ceviche Clásico',
    desc: 'Pescado fresco marinado en limón, ají y cebolla morada.',
    precio: 'S/ 42',
    img: img('photo-1546069901-ba9599a7e63c'),
  },
  {
    nombre: 'Ají de Gallina',
    desc: 'Pollo deshilachado en cremosa salsa de ají amarillo.',
    precio: 'S/ 29',
    img: img('photo-1414235077428-338989a2e8c0'),
  },
  {
    nombre: 'Causa Rellena',
    desc: 'Puré de papa amarilla relleno de pollo, palta y mayonesa.',
    precio: 'S/ 24',
    img: img('photo-1467003909585-2f8a72700288'),
  },
];

export const RECETAS = [
  {
    titulo: 'El secreto de un buen ceviche',
    imagen: img('photo-1540189549336-e6e99c3679fe', 600),
    lectura: '6 min de lectura',
    fecha: 'Hace 3 días',
  },
  {
    titulo: 'Ají amarillo: de la huerta a tu mesa',
    imagen: img('photo-1551183053-bf91a1d81141', 600),
    lectura: '4 min de lectura',
    fecha: 'Hace 1 semana',
  },
  {
    titulo: 'Desayunos que enamoran',
    imagen: img('photo-1482049016688-2d3e1b311543', 600),
    lectura: '5 min de lectura',
    fecha: 'Hace 2 semanas',
  },
  {
    titulo: 'Técnicas de maridaje criollo',
    imagen: img('photo-1567620905732-2d1ec7ab7445', 600),
    lectura: '7 min de lectura',
    fecha: 'Hace 3 semanas',
  },
];

export const GALERIA = [
  img('photo-1544025162-d76694265947', 900),
  img('photo-1476224203421-9ac39bcb3327', 900),
  img('photo-1512621776951-a57141f2eefd', 900),
  img('photo-1498837167922-ddd27525d352', 900),
  img('photo-1555396273-367ea4eb4db5', 900),
  img('photo-1551782450-a2132b4ba21d', 900),
];

export const STATS = [
  { valor: '25+', label: 'Años de tradición' },
  { valor: '80+', label: 'Platos en carta' },
  { valor: '15k+', label: 'Comensales al mes' },
];

export const CONTACTO = {
  whatsapp: '51987654321',
  email: 'reservas@mixgustos.com',
  direccion: 'Av. Primavera 123, Miraflores, Lima',
  redes: ['Facebook', 'Instagram', 'WhatsApp', 'TikTok'],
};

export function waLink(numero, texto) {
  const n = String(numero || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(texto || '')}`;
}
