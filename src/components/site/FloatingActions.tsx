import { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';

interface FloatingActionsProps {
  whatsappUrl: string;
}

/**
 * Sticky WhatsApp call-to-action plus a scroll-to-top control.
 * Both live in the bottom-right corner, stacked so they never overlap.
 */
export function FloatingActions({ whatsappUrl }: FloatingActionsProps) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Scroll to top */}
      {showTop && (
        <button
          type="button"
          className="pop-in fixed bottom-24 right-5 z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-ink-850/90 text-white/70 backdrop-blur-xl transition-colors hover:border-brand-400/40 hover:text-brand-400"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Voltar ao topo da página"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/30 transition-transform duration-300 hover:scale-110 active:scale-95"
        aria-label="Falar com um técnico pelo WhatsApp"
      >
        {/* pulse ring */}
        <span
          className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-20"
          aria-hidden="true"
        />
        <MessageCircle className="h-7 w-7" />

        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-xl border border-white/10 bg-ink-850 px-3.5 py-2 text-sm font-bold text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
          Falar com técnico
        </span>
      </a>
    </>
  );
}
