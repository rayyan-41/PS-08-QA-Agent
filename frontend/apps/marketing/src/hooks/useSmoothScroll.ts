import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Native document scrolling keeps sticky layout, links, and presenter mode compatible. */
export function useSmoothScroll(presenting: boolean) {
  useEffect(() => {
    if (presenting) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lenis = new Lenis({ duration: 0.85, smoothWheel: true, autoRaf: false });
      const update = () => ScrollTrigger.update();
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      lenis.on('scroll', update);
      gsap.ticker.add(tick);

      const onAnchor = (event: MouseEvent) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const link =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
            : null;
        if (!link || link.target || link.hasAttribute('download')) return;
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        window.history.pushState(null, '', link.hash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        lenis.scrollTo(target, { offset: -24, immediate: event.detail === 0 });
        // Match native anchor navigation for keyboard and screen reader users.
        const temporaryFocus = !target.hasAttribute('tabindex');
        if (temporaryFocus) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (temporaryFocus)
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      };
      document.addEventListener('click', onAnchor);
      const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => {
        cancelAnimationFrame(refresh);
        document.removeEventListener('click', onAnchor);
        gsap.ticker.remove(tick);
        lenis.off('scroll', update);
        lenis.destroy();
      };
    });
    return () => media.revert();
  }, [presenting]);
}
