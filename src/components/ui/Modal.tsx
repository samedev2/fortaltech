import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

const CLOSE_MS = 180;

/**
 * Accessible dialog: focus trap, ESC to dismiss, scroll lock and focus
 * restoration.
 *
 * The entrance animation moves and scales the panel but never fades it, so
 * a stalled animation clock can never leave an invisible — and therefore
 * unusable — dialog on screen.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2, 9)}`);

  // Keep the latest callback without making the focus/keyboard effect depend
  // on its identity — otherwise the effect would re-run on every parent
  // render and steal focus back to the trigger button.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Mount/unmount with a short exit window so the panel can slide out.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    // Scroll lock without the layout shift caused by `overflow: hidden`.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const focusFirst = () => {
      const node = panelRef.current;
      if (!node) return;
      const target =
        node.querySelector<HTMLElement>('[data-autofocus]') ??
        node.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    };

    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const node = panelRef.current;
      if (!node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={description ? descId.current : undefined}
        className={cn(
          'my-auto w-full overflow-hidden rounded-3xl border border-white/10 bg-ink-850 shadow-2xl shadow-black/80',
          closing ? 'panel-out' : 'panel-in',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/8 p-6">
          <div className="min-w-0">
            <h2
              id={titleId.current}
              className="text-lg font-extrabold tracking-tight text-white"
            >
              {title}
            </h2>
            {description && (
              <p id={descId.current} className="mt-1 text-sm leading-relaxed text-white/50">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon -mr-2 -mt-1 shrink-0"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-white/8 bg-black/20 p-5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
