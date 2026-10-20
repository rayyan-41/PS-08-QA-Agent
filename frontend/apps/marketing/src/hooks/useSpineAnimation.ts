import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);
const brandEase = CustomEase.create('pokayoke-out', '0.22, 1, 0.36, 1');
const sectionStages = [
  ['hero', 0],
  ['problem', 2],
  ['why-rules', 3],
  ['poka-yoke', 1],
  ['ninjas', 3],
  ['trust', 4],
  ['roadmap', 5],
  ['demo', 5],
] as const;
const positions = [
  { x: 0, y: 0 },
  { x: 22, y: 70 },
  { x: 0, y: 140 },
  { x: 22, y: 210 },
  { x: 0, y: 280 },
  { x: 22, y: 318 },
] as const;

/** Only this hook owns the spine; scroll updates never rebuild the React tree. */
export function useSpineAnimation(ref: RefObject<HTMLElement | null>, presenting: boolean) {
  useEffect(() => {
    const root = ref.current;
    if (!root || presenting) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
      const context = gsap.context(() => {
        const popups = gsap.utils.toArray<HTMLElement>('[data-spine-popup]', root);
        const record = root.querySelector<HTMLElement>('.travelling-record');
        const flow = root.querySelector<SVGPathElement>('.spine-flow');
        let current = -1;
        gsap.set(popups, { autoAlpha: 0, y: 10 });
        gsap.set(record, { x: 0, y: 0 });
        gsap.set(flow, { strokeDasharray: 1, strokeDashoffset: 0.83 });
        root.dataset.animated = 'true';

        const reveal = (stage: number, instant = false) => {
          if (current === stage && !instant) return;
          current = stage;
          root.dataset.stage = String(stage);
          const duration = instant ? 0 : 0.22;
          popups.forEach((popup, index) => {
            const active = index === stage;
            popup.setAttribute('aria-hidden', String(!active));
            gsap.to(popup, {
              autoAlpha: active ? 1 : 0,
              y: active ? 0 : 10,
              duration,
              ease: brandEase,
              overwrite: true,
            });
          });
          gsap.to(record, { ...positions[stage], duration, ease: brandEase, overwrite: true });
          // SVG stroke drawing is the explicit marketing exception to transform/opacity motion.
          gsap.to(flow, {
            strokeDashoffset: 0.83 - stage * 0.166,
            duration,
            ease: brandEase,
            overwrite: true,
          });
        };
        reveal(0, true);
        sectionStages.forEach(([id, stage]) => {
          ScrollTrigger.create({
            trigger: document.getElementById(id),
            start: 'top 52%',
            end: 'bottom 52%',
            onEnter: () => reveal(stage),
            onEnterBack: () => reveal(stage),
            onRefresh: (self) => {
              if (self.isActive) reveal(stage, true);
            },
          });
        });
        ScrollTrigger.create({
          trigger: document.querySelector('.workflow-sequence'),
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            if (self.isActive) reveal(Math.min(5, Math.floor(self.progress * 6)));
          },
          onEnter: () => reveal(0),
          onEnterBack: () => reveal(5),
          onRefresh: (self) => {
            if (self.isActive) reveal(Math.min(5, Math.floor(self.progress * 6)), true);
          },
        });
      }, root);
      const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => {
        cancelAnimationFrame(refresh);
        gsap.killTweensOf(
          root.querySelectorAll('[data-spine-popup], .travelling-record, .spine-flow'),
        );
        context.revert();
        root
          .querySelectorAll('[data-spine-popup]')
          .forEach((popup) => popup.setAttribute('aria-hidden', 'true'));
        delete root.dataset.animated;
        delete root.dataset.stage;
      };
    });
    return () => media.revert();
  }, [ref, presenting]);
}
