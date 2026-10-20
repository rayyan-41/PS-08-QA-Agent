import { useCallback, useEffect, useRef, useState } from 'react';

function hashIndex(ids: readonly string[]): number {
  try {
    return ids.indexOf(decodeURIComponent(window.location.hash.slice(1)));
  } catch {
    return -1;
  }
}

export function usePresenter(sectionIds: readonly string[]) {
  const [presenting, setPresenting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, hashIndex(sectionIds)));
  const indexRef = useRef(activeIndex);
  const presentingRef = useRef(presenting);
  useEffect(() => {
    indexRef.current = activeIndex;
    presentingRef.current = presenting;
  }, [activeIndex, presenting]);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(sectionIds.length - 1, index));
      setActiveIndex(next);
      indexRef.current = next;
      window.history.replaceState(null, '', `#${sectionIds[next]}`);
      requestAnimationFrame(() => {
        document
          .getElementById(sectionIds[next])
          ?.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    },
    [sectionIds],
  );

  const toggle = useCallback(() => {
    setPresenting((value) => !value);
    window.history.replaceState(null, '', `#${sectionIds[indexRef.current]}`);
    requestAnimationFrame(() => {
      document
        .getElementById(sectionIds[indexRef.current])
        ?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }, [sectionIds]);

  useEffect(() => {
    const initial = hashIndex(sectionIds);
    if (initial >= 0)
      requestAnimationFrame(() =>
        document.getElementById(sectionIds[initial])?.scrollIntoView({ behavior: 'instant' }),
      );
    const onHashChange = () => {
      const index = hashIndex(sectionIds);
      if (index >= 0) {
        setActiveIndex(index);
        indexRef.current = index;
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [sectionIds]);

  useEffect(() => {
    if (presenting) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const index = sectionIds.indexOf(visible.target.id);
        if (index >= 0) {
          setActiveIndex(index);
          indexRef.current = index;
        }
      },
      { rootMargin: '-10% 0px -55% 0px', threshold: 0 },
    );
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [presenting, sectionIds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        toggle();
        return;
      }
      if (!presentingRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        toggle();
        return;
      }
      if (event.key === ' ' && target?.closest('button, a, summary')) return;
      const directions: Record<string, number> = {
        ArrowRight: 1,
        ArrowDown: 1,
        PageDown: 1,
        ' ': 1,
        ArrowLeft: -1,
        ArrowUp: -1,
        PageUp: -1,
      };
      if (event.key in directions) {
        event.preventDefault();
        goTo(indexRef.current + directions[event.key]);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        goTo(event.key === 'Home' ? 0 : sectionIds.length - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goTo, toggle, sectionIds]);

  return { presenting, activeIndex, toggle, goTo };
}
