import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, Smartphone, CheckCircle2, Loader2, ArrowRight, UserPlus, BellRing, ShieldCheck } from 'lucide-react';
import { api } from '../../../api/client.js';
import { useToast } from '../../../components/ui.jsx';
import { badgePedido, moneda, TIPOS_PEDIDO } from '../../../lib/format.js';

const PASOS = ['CREADO', 'CONFIRMADO', 'RECIBIDO_COCINA', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'FINALIZADO'];

export default function SeguirMiPedido() {
  const navigate = useNavigate();
  const toast = useToast();
  const [codigo, setCodigo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pedido, setPedido] = useState(null);
  const [aviso, setAviso] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setPedido(null);
    setLoading(true);
    try {
      const avisoRes = await api.post(`/client/orders/${codigo}/telefono`, { telefono });
      const detalle = await api.get(`/client/orders/${codigo}`);
      setPedido(detalle);
      setAviso({
        numero: avisoRes.telefono,
        yaNotificado: !!avisoRes.telefono,
      });
      toast.success(
        avisoRes.telefono ? '¡Te avisaremos por WhatsApp!' : 'Pedido vinculado',
        avisoRes.telefono
          ? `Cuando tu pedido esté listo te escribiremos al ${avisoRes.telefono}.`
          : 'Agrega tu WhatsApp para recibir el aviso al instante.'
      );
    } catch (err) {
      setError(err.response?.data?.error || 'No pudimos encontrar tu pedido. Verifica el código.');
      if (err.response?.status === 404) setError('Pedido no encontrado. Revisa el código que te entregaron.');
    } finally {
      setLoading(false);
    }
  }

  const idx = pedido ? PASOS.indexOf(pedido.estado) : -1;
  const cancelado = pedido && ['CANCELADO', 'RECHAZADO'].includes(pedido.estado);

  return (
    <section id="seguir" className="bg-cream-deep/60 py-16 md:py-24 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-stroke-dark" />
              <span className="text-xs text-mutedwarm uppercase tracking-[0.3em]">Tu pedido en vivo</span>
            </div>
            <h2 className="font-display italic text-4xl md:text-5xl text-cacao mb-4">
              ¿Ya pediste? <span className="italic">Síguelo</span> aquí
            </h2>
            <p className="text-sm md:text-base text-mutedwarm max-w-md mb-8">
              Ingresa el código de tu boleta y tu WhatsApp. El mozo recibe tu pedido al instante y te
              contactamos cuando esté listo.
            </p>
            <ul className="space-y-4 text-sm text-cacao-soft">
              <li className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-xl bg-surface border border-stroke flex items-center justify-center text-brand-600"><BellRing size={16} /></span>
                Aviso inmediato al mozo encargado de tu pedido
              </li>
              <li className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-xl bg-surface border border-stroke flex items-center justify-center text-brand-600"><Smartphone size={16} /></span>
                Notificación por WhatsApp cuando esté listo para recoger
              </li>
              <li className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-xl bg-surface border border-stroke flex items-center justify-center text-brand-600"><ShieldCheck size={16} /></span>
                Sin necesidad de cuenta, solo tu código
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-3xl bg-surface border border-stroke shadow-lift p-6 md:p-8"
          >
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cacao mb-1.5">Código del pedido</label>
                <div className="relative">
                  <PackageSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedwarm" />
                  <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: L20260808-001"
                    className="w-full rounded-xl border border-stroke-dark bg-cream/50 pl-10 pr-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 placeholder:text-mutedwarm/70"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cacao mb-1.5">
                  Tu WhatsApp <span className="font-normal text-mutedwarm">(opcional, recomendado)</span>
                </label>
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedwarm" />
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +51 987 654 321"
                    className="w-full rounded-xl border border-stroke-dark bg-cream/50 pl-10 pr-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 placeholder:text-mutedwarm/70"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600 animate-fade-in-down">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!codigo || loading}
                className="w-full rounded-xl accent-gradient text-white text-sm font-semibold px-6 py-3.5 inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lift disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />}
                {loading ? 'Vinculando...' : 'Avisarme cuando esté listo'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <UserPlus size={13} /> ¿Quieres pedir online? Regístrate o inicia sesión <ArrowRight size={13} />
              </button>
            </div>

            <AnimatePresence>
              {pedido && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 pt-6 border-t border-stroke space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cacao">{pedido.codigo}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgePedido(pedido.estado).color}`}>
                          {badgePedido(pedido.estado).label}
                        </span>
                      </div>
                      <div className="text-xs text-mutedwarm mt-1">
                        {TIPOS_PEDIDO[pedido.tipo]?.emoji} {TIPOS_PEDIDO[pedido.tipo]?.label} · Total{' '}
                        <b className="text-cacao">{moneda(pedido.total)}</b>
                      </div>
                    </div>
                    <span className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </span>
                  </div>

                  <div className="flex items-center">
                    {PASOS.slice(0, -1).map((p, i) => {
                      const alcanzado = !cancelado && idx >= i;
                      return (
                        <React.Fragment key={p}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                              cancelado ? 'bg-red-100 text-red-500' : alcanzado ? 'bg-brand-600 text-white' : 'bg-stroke text-mutedwarm'
                            }`}>
                              <CheckCircle2 size={14} />
                            </div>
                            <span className={`text-[9px] text-center ${alcanzado ? 'font-semibold text-brand-700' : 'text-mutedwarm'}`}>
                              {badgePedido(p).label}
                            </span>
                          </div>
                          {i < PASOS.length - 2 && (
                            <div className={`flex-1 h-0.5 mb-4 ${alcanzado ? 'accent-gradient' : 'bg-stroke'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {aviso?.yaNotificado && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2.5 animate-fade-in-up">
                      <Smartphone size={16} className="shrink-0 mt-0.5" />
                      <span>
                        El mozo fue notificado y te contactaremos al <b>{aviso.numero}</b> cuando tu pedido esté listo.
                      </span>
                    </div>
                  )}
                  {!aviso?.yaNotificado && (
                    <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-700 flex items-start gap-2.5 animate-fade-in-up">
                      <BellRing size={16} className="shrink-0 mt-0.5" />
                      <span>El mozo fue notificado de tu pedido. Agrega tu WhatsApp para recibir el aviso cuando esté listo.</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
