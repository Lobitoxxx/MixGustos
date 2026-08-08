import React from 'react';
import { X, HelpCircle, Search, Loader2, Inbox, CheckCircle2, AlertTriangle, Info as InfoIcon } from 'lucide-react';

/* ---------------------------------- Button --------------------------------- */

export function Button({ children, variant = 'primary', size = 'md', className = '', icon, loading, ...props }) {
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/25',
    secondary: 'bg-white hover:bg-ink-50 text-ink-800 border border-ink-200 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/25',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25',
    ghost: 'hover:bg-ink-100 text-ink-600',
    soft: 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-100',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-xs gap-1.5', md: 'px-4 py-2 text-sm gap-2', lg: 'px-6 py-3 text-base gap-2' };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({ children, className = '', title, subtitle, actions, pad = true, hover = false, icon }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-ink-100 shadow-card transition-all duration-200 ${
        hover ? 'hover:shadow-lift hover:border-ink-200 hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-ink-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="font-display italic text-lg text-cacao leading-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

/* ------------------------------- Input / Select ---------------------------- */

export function Input({ label, className = '', icon, hint, error, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-ink-700 mb-1.5">
          {label}
          {hint && <span className="font-normal text-ink-400">· {hint}</span>}
        </span>
      )}
      <span className="relative block">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>}
        <input
          className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-ink-400 focus:ring-2 ${
            error ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400' : 'border-ink-200 focus:ring-brand-500/25 focus:border-brand-500'
          } ${icon ? 'pl-9' : ''} ${className}`}
          {...props}
        />
      </span>
      {error && <span className="block mt-1 text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Select({ label, children, className = '', hint, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-ink-700 mb-1.5">{label}</span>}
      <select
        className={`w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

/* ---------------------------------- Search --------------------------------- */

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '', autoFocus }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-ink-200 bg-white pl-10 pr-3 py-2 text-sm outline-none transition placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"
      />
    </div>
  );
}

/* ----------------------------------- Badge --------------------------------- */

export function Badge({ children, className = '', color = 'bg-ink-100 text-ink-700 border-ink-200', dot }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${color} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  );
}

/* ---------------------------------- Table ---------------------------------- */

export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50/70">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-ink-500 text-[11px] uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '', colSpan }) {
  return (
    <td className={`px-4 py-3 text-ink-700 align-middle ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

/* ----------------------------------- Modal --------------------------------- */

export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg', footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-hidden flex flex-col animate-slide-up`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-ink-100">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-600 transition shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto scroll-thin flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-ink-100 bg-ink-50/50">{footer}</div>}
      </div>
    </div>
  );
}

/* --------------------------------- StatCard -------------------------------- */

export function StatCard({ label, value, icon, color = 'bg-brand-50 text-brand-600', sub, onClick, trend }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`group bg-white rounded-2xl border border-ink-100 p-5 shadow-card transition-all duration-200 ${
        onClick ? 'hover:shadow-lift hover:-translate-y-0.5 cursor-pointer text-left' : 'hover:border-ink-200'
      }`}
    >
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-105`}>
        {icon}
      </div>
      <div className="mt-3">
        <div className="font-display italic text-3xl text-cacao leading-tight">{value}</div>
        <div className="text-sm text-ink-500 font-medium mt-0.5">{label}</div>
      </div>
      {(sub || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold ${trend.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {sub && <span className="text-ink-400">{sub}</span>}
        </div>
      )}
    </Wrapper>
  );
}

/* ---------------------------------- Empty ---------------------------------- */

export function Empty({ text = 'Sin datos para mostrar', icon, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center px-4 ${className}`}>
      {icon && (
        <div className="h-12 w-12 rounded-2xl bg-ink-50 text-ink-300 flex items-center justify-center mb-3">{icon}</div>
      )}
      {!icon && <Inbox size={28} className="text-ink-200 mb-3" />}
      <div className="text-sm text-ink-400 max-w-xs">{text}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ---------------------------------- Spinner -------------------------------- */

export function Spinner({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-9 w-9 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      {text && <div className="text-sm text-ink-400">{text}</div>}
    </div>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-ink-100/80 ${className}`} />;
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- PageHeader -------------------------------- */

export function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in-down">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="hidden sm:flex h-11 w-11 rounded-xl bg-brand-50 text-brand-600 items-center justify-center border border-brand-100 shrink-0">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display italic text-2xl sm:text-3xl text-cacao leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* --------------------------------- Tooltip --------------------------------- */

export function Tooltip({ label, children, side = 'top', className = '' }) {
  const [show, setShow] = React.useState(false);
  if (!label) return children;
  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-lg bg-ink-900 text-white text-xs px-2.5 py-1.5 shadow-lg pointer-events-none animate-scale-in ${
            side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-1.5' : 'top-full left-1/2 -translate-x-1/2 mt-1.5'
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}

/* ----------------------------------- Info ---------------------------------- */

export function Info({ children, title }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1 -m-1 rounded-md text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition"
        aria-label="Más información"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full right-0 mb-2 w-64 rounded-xl bg-white border border-ink-100 shadow-lift p-3 text-left animate-scale-in"
        >
          {title && <div className="text-xs font-semibold text-ink-900 mb-1">{title}</div>}
          <div className="text-xs text-ink-500 leading-relaxed">{children}</div>
        </span>
      )}
    </span>
  );
}

/* ------------------------------ SegmentedControl --------------------------- */

export function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-xl bg-ink-100 p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            value === o.value ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- ProgressBar ------------------------------- */

export function ProgressBar({ value, max = 100, className = '', color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor =
    color || (pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500');
  return (
    <div className={`h-1.5 w-full rounded-full bg-ink-100 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ----------------------------------- Menu ---------------------------------- */

export function Menu({ button, children, align = 'right', width = 'w-56' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{button}</div>
      {open && (
        <div
          className={`absolute z-50 mt-2 ${width} rounded-xl bg-white border border-ink-100 shadow-lift p-1.5 animate-scale-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, children, onClick, danger, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
      }`}
    >
      {icon && <span className="text-ink-400">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
}

/* ---------------------------------- Toasts --------------------------------- */

const ToastContext = React.createContext(null);
let toastCounter = 0;

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

const TOAST_STYLES = {
  success: { ring: 'border-emerald-200', iconColor: 'text-emerald-500', Icon: CheckCircle2, label: 'Correcto' },
  error: { ring: 'border-red-200', iconColor: 'text-red-500', Icon: X, label: 'Error' },
  warning: { ring: 'border-amber-200', iconColor: 'text-amber-500', Icon: AlertTriangle, label: 'Aviso' },
  info: { ring: 'border-sky-200', iconColor: 'text-sky-500', Icon: InfoIcon, label: 'Información' },
};

function ToastViewport({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.tipo];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl bg-white border ${s.ring} shadow-lift p-3.5 animate-slide-in-right`}
          >
            <span className={`shrink-0 ${s.iconColor}`}>
              <s.Icon size={19} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink-900">{t.titulo}</div>
              {t.mensaje && <div className="text-xs text-ink-500 mt-0.5 leading-relaxed">{t.mensaje}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-ink-300 hover:text-ink-500 shrink-0">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const push = React.useCallback((tipo, titulo, mensaje) => {
    const id = ++toastCounter;
    setToasts((t) => [...t, { id, tipo, titulo, mensaje }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismiss = React.useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const api = React.useMemo(
    () => ({
      success: (t, m) => push('success', t, m),
      error: (t, m) => push('error', t, m),
      warning: (t, m) => push('warning', t, m),
      info: (t, m) => push('info', t, m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}
