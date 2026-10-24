import {
  createElement,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

type RevealVariant = 'up' | 'left' | 'scale';

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  /** Stagger in milliseconds. */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Scroll-triggered entrance animation that does not depend on a JS
 * animation library.
 *
 * The element is VISIBLE by default. JavaScript only adds the `reveal-pending`
 * class when the element starts off-screen AND an IntersectionObserver is
 * available to bring it back. If scripting is unavailable or the observer
 * never fires, the content stays on screen.
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className,
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'static' | 'pending' | 'in'>('static');

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setState('in');
      return;
    }

    const rect = node.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) {
      setState('in');
      return;
    }

    setState('pending');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('in');
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const variantClass =
    variant === 'left' ? 'reveal-left' : variant === 'scale' ? 'reveal-scale' : 'reveal';

  return createElement(
    as,
    {
      ref,
      className: cn(
        variantClass,
        state === 'pending' && 'reveal-pending',
        state === 'in' && 'reveal-in',
        className,
      ),
      style: { '--reveal-delay': `${delay}ms` } as CSSProperties,
    },
    children,
  );
}
