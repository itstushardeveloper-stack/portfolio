/* ═══════════════════════════════════════════════════════════════
   Tushar Chauhan — Portfolio
   Vanilla JS. No dependencies.

   01. Helpers            07. Scrollspy
   02. Theme              08. Card spotlight
   03. Header & progress  09. Magnetic buttons
   04. Mobile nav         10. Custom cursor
   05. Scroll reveal      11. Smooth anchor scroll
   06. Stat counters      12. Misc
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══ 01. HELPERS ══════════════════════════════════════════════ */

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const motionQuery   = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer   = window.matchMedia('(pointer: fine)');
  const reducedMotion = () => motionQuery.matches;

  /** Run fn at most once per animation frame. */
  function rafThrottle(fn) {
    let queued = false;
    return function (...args) {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn.apply(this, args);
      });
    };
  }


  /* ══ 02. THEME ════════════════════════════════════════════════ */

  const THEME_KEY = 'tc-theme';

  const Theme = {
    button: $('#themeToggle'),

    init() {
      const stored = localStorage.getItem(THEME_KEY);
      const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      this.apply(stored || system);

      if (this.button) {
        this.button.addEventListener('click', () => {
          const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
          this.apply(next);
          localStorage.setItem(THEME_KEY, next);
        });
      }
    },

    apply(theme) {
      document.documentElement.dataset.theme = theme;

      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#08090c' : '#fbfbfd');

      if (this.button) {
        this.button.setAttribute(
          'aria-label',
          `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
        );
      }
    }
  };


  /* ══ 03. HEADER & SCROLL PROGRESS ═════════════════════════════ */

  const header      = $('#header');
  const progressBar = $('#progressBar');

  /**
   * @param {boolean} fromScroll True only for real scroll events, so a
   *   resize or the initial sync doesn't trigger the cursor indicator.
   */
  function readScroll(fromScroll) {
    const y = window.scrollY;

    if (header) header.classList.toggle('is-scrolled', y > 24);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;

    if (progressBar) progressBar.style.transform = `scaleX(${pct})`;
    if (fromScroll) Cursor.setProgress(pct);

    Scrollspy.update(y);
  }

  const onScroll = rafThrottle(() => readScroll(true));
  const onResize = rafThrottle(() => readScroll(false));


  /* ══ 04. MOBILE NAV ═══════════════════════════════════════════ */

  const MobileNav = {
    toggle: $('#menuToggle'),
    panel:  $('#mobileNav'),
    open:   false,

    init() {
      if (!this.toggle || !this.panel) return;

      this.toggle.addEventListener('click', () => this.set(!this.open));

      // Close when a link is chosen
      $$('a', this.panel).forEach((link) => {
        link.addEventListener('click', () => this.set(false));
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.open) {
          this.set(false);
          this.toggle.focus();
        }
      });

      // Reset when resizing back up to desktop
      window.addEventListener('resize', rafThrottle(() => {
        if (window.innerWidth > 900 && this.open) this.set(false);
      }));
    },

    set(state) {
      this.open = state;
      this.panel.classList.toggle('is-open', state);
      this.toggle.classList.toggle('is-open', state);
      this.toggle.setAttribute('aria-expanded', String(state));
      this.toggle.setAttribute('aria-label', state ? 'Close menu' : 'Open menu');
      this.panel.setAttribute('aria-hidden', String(!state));
      document.body.classList.toggle('no-scroll', state);
    }
  };


  /* ══ 05. SCROLL REVEAL ════════════════════════════════════════ */

  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    // No IntersectionObserver support, or user prefers reduced motion:
    // show everything immediately.
    if (reducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    items.forEach((el) => {
      const delay = el.dataset.revealDelay;
      if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }


  /* ══ 06. STAT COUNTERS ════════════════════════════════════════ */

  function initCounters() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    if (reducedMotion() || !('IntersectionObserver' in window)) {
      counters.forEach((el) => { el.textContent = el.dataset.count; });
      return;
    }

    const animate = (el) => {
      const target   = Number(el.dataset.count) || 0;
      const duration = 1500;
      const start    = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        // easeOutExpo — fast start, gentle landing
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animate(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((el) => observer.observe(el));
  }


  /* ══ 07. SCROLLSPY ════════════════════════════════════════════ */

  const Scrollspy = {
    links: [],
    map:   [],

    init() {
      this.links = $$('.nav__link');
      this.map = this.links
        .map((link) => {
          const id = link.getAttribute('href');
          const section = id && id.startsWith('#') ? $(id) : null;
          return section ? { link, section } : null;
        })
        .filter(Boolean);
    },

    update(scrollY) {
      if (!this.map.length) return;

      // The "reading line" sits a third of the way down the viewport.
      const line = scrollY + window.innerHeight * 0.33;
      let current = null;

      this.map.forEach((entry) => {
        if (entry.section.offsetTop <= line) current = entry;
      });

      // Snap to the last section once we hit the bottom of the page.
      const atBottom =
        window.innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) current = this.map[this.map.length - 1];

      this.links.forEach((link) => {
        link.classList.toggle('is-active', Boolean(current) && link === current.link);
      });
    }
  };


  /* ══ 08. CARD SPOTLIGHT ═══════════════════════════════════════
     Tracks the cursor inside a card and feeds --mx / --my to CSS. */

  function initSpotlight() {
    if (!finePointer.matches || reducedMotion()) return;

    $$('[data-spotlight]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }


  /* ══ 09. MAGNETIC BUTTONS ═════════════════════════════════════
     Subtle pull toward the cursor. Desktop + fine pointer only.    */

  function initMagnetic() {
    if (!finePointer.matches || reducedMotion()) return;

    const STRENGTH = 0.28;

    $$('[data-magnetic]').forEach((el) => {
      let raf = null;

      const move = (e) => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - (rect.left + rect.width  / 2)) * STRENGTH;
          const y = (e.clientY - (rect.top  + rect.height / 2)) * STRENGTH;
          el.style.transform = `translate(${x}px, ${y}px)`;
        });
      };

      const reset = () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      };

      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', reset);
      el.addEventListener('blur', reset);
    });
  }


  /* ══ 10. CUSTOM CURSOR ════════════════════════════════════════
     A dot that tracks the pointer exactly, plus a ring that trails
     behind it and expands over anything interactive.              */

  const CURSOR_INTERACTIVE = [
    'a',
    'button',
    '[data-magnetic]',
    '[data-spotlight]',
    '.chips li',
    '.marquee__row li',
    '.job__list li',
    '.skill-group__list li'
  ].join(', ');

  /* Shared handle so the scroll listener can drive the cursor dot. */
  const Cursor = {
    dot:   null,
    fill:  null,
    timer: null,

    /** pct is 0–1 of total page scroll. */
    setProgress(pct) {
      if (!this.dot) return;

      this.fill.style.setProperty('--progress', `${(pct * 100).toFixed(2)}%`);
      this.dot.classList.add('is-scrolling');

      // Settle back into a plain dot once scrolling stops.
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.dot.classList.remove('is-scrolling');
      }, 420);
    }
  };

  function initCursor() {
    if (!finePointer.matches || reducedMotion()) return;

    const ring = document.createElement('div');
    const dot  = document.createElement('div');
    const fill = document.createElement('span');
    ring.className = 'cursor cursor--ring';
    dot.className  = 'cursor cursor--dot';
    fill.className = 'cursor__fill';
    ring.setAttribute('aria-hidden', 'true');
    dot.setAttribute('aria-hidden', 'true');
    dot.append(fill);
    document.body.append(ring, dot);
    document.documentElement.classList.add('has-custom-cursor');

    Cursor.dot  = dot;
    Cursor.fill = fill;

    const EASE  = 0.18;  // ring lag — lower trails further behind
    const GROW  = 1.85;  // ring scale over interactive elements
    const PRESS = 0.82;  // ring scale while the pointer is down

    let pointerX = 0, pointerY = 0;   // live pointer position
    let ringX    = 0, ringY    = 0;   // eased ring position
    let scale = 1, targetScale = 1;

    let visible = false;
    let hovered = null;
    let pressed = false;

    const setScale = () => {
      targetScale = (hovered ? GROW : 1) * (pressed ? PRESS : 1);
    };

    const show = () => {
      if (visible) return;
      visible = true;
      ring.classList.add('is-active');
      dot.classList.add('is-active');
    };

    const hide = () => {
      visible = false;
      ring.classList.remove('is-active');
      dot.classList.remove('is-active');
    };

    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pointerX = e.clientX;
      pointerY = e.clientY;

      // Jump the ring into place the first time, so it doesn't fly in
      // from the top-left corner on the very first move.
      if (!visible) {
        ringX = pointerX;
        ringY = pointerY;
        show();
      }
    }, { passive: true });

    // Tracking hover with pointerover alone (rather than pointerover +
    // pointerout) avoids flicker when moving between a parent and its
    // children inside the same interactive element.
    document.addEventListener('pointerover', (e) => {
      const target = e.target.closest ? e.target.closest(CURSOR_INTERACTIVE) : null;
      if (target === hovered) return;
      hovered = target;
      setScale();
      ring.classList.toggle('is-hovering', Boolean(target));
      dot.classList.toggle('is-hovering', Boolean(target));
    });

    document.addEventListener('pointerdown', () => { pressed = true;  setScale(); });
    document.addEventListener('pointerup',   () => { pressed = false; setScale(); });

    document.documentElement.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);

    const loop = () => {
      ringX += (pointerX - ringX) * EASE;
      ringY += (pointerY - ringY) * EASE;
      scale += (targetScale - scale) * EASE;

      dot.style.transform  = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${scale})`;

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }


  /* ══ 11. SMOOTH ANCHOR SCROLL ═════════════════════════════════
     Animates in-page jumps so they ease to a stop under the fixed
     header. Only the jump is scripted — wheel, trackpad, keyboard,
     scrollbar and find-in-page scrolling stay entirely native.     */

  /** easeInOutCubic — leans in, then settles instead of stopping dead. */
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Keys that mean "I want to scroll myself now".
  const SCROLL_KEYS = [
    'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'
  ];

  const SmoothScroll = {
    frame: null,
    stop:  null,

    init() {
      if (reducedMotion()) return;

      // Hand the CSS fallback over to JS so the two aren't both
      // animating the same scroll.
      document.documentElement.classList.add('has-js-scroll');

      document.addEventListener('click', (e) => this.onClick(e));
    },

    onClick(e) {
      // Leave modified clicks (new tab, new window…) to the browser.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;

      // The skip link lands instantly — nobody relying on it wants to
      // sit through an animation to reach the content.
      if (link.classList.contains('skip-link')) return;

      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      const target = document.getElementById(hash.slice(1));
      if (!target || reducedMotion()) return;

      e.preventDefault();
      this.to(target, hash);
    },

    /** Scroll position that puts `el` clear of the header. */
    targetTop(el) {
      // scroll-margin-top keeps the header offset defined in CSS.
      const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      const top    = el.getBoundingClientRect().top + window.scrollY - margin;
      const max    = document.documentElement.scrollHeight - window.innerHeight;

      return Math.min(Math.max(top, 0), Math.max(max, 0));
    },

    to(target, hash) {
      this.cancel();

      const from     = window.scrollY;
      const distance = this.targetTop(target) - from;

      if (Math.abs(distance) < 1) {
        this.land(target, hash);
        return;
      }

      // Longer trips get a little more time, but never enough to make
      // the page feel like it's dawdling.
      const duration = Math.min(1000, Math.max(420, Math.abs(distance) * 0.6));
      const startedAt = performance.now();

      // Any genuine scroll input hands control straight back to the user.
      const interrupt = () => this.cancel();
      const onKey = (ev) => { if (SCROLL_KEYS.includes(ev.key)) interrupt(); };

      window.addEventListener('wheel', interrupt, { passive: true });
      window.addEventListener('touchstart', interrupt, { passive: true });
      window.addEventListener('keydown', onKey);

      this.stop = () => {
        window.removeEventListener('wheel', interrupt);
        window.removeEventListener('touchstart', interrupt);
        window.removeEventListener('keydown', onKey);
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.stop  = null;
      };

      const step = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        window.scrollTo(0, from + distance * easeInOutCubic(progress));

        if (progress < 1) {
          this.frame = requestAnimationFrame(step);
          return;
        }

        this.cancel();
        this.land(target, hash);
      };

      this.frame = requestAnimationFrame(step);
    },

    cancel() {
      if (this.stop) this.stop();
    },

    /** Everything a native jump does once it arrives: URL, then focus. */
    land(target, hash) {
      history.pushState(null, '', hash);

      // Keyboard and screen-reader users should carry on from the
      // section they asked for, not from the top of the document.
      const focusable = target.hasAttribute('tabindex');
      if (!focusable) target.setAttribute('tabindex', '-1');

      target.focus({ preventScroll: true });

      if (!focusable) {
        target.addEventListener(
          'blur',
          () => target.removeAttribute('tabindex'),
          { once: true }
        );
      }
    }
  };


  /* ══ 12. MISC ═════════════════════════════════════════════════ */

  function initYear() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }


  /* ══ BOOT ═════════════════════════════════════════════════════ */

  function init() {
    Theme.init();
    MobileNav.init();
    Scrollspy.init();
    SmoothScroll.init();

    initReveal();
    initCounters();
    initSpotlight();
    initMagnetic();
    initCursor();
    initYear();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    readScroll(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
