/**
 * Polar for Canvas — content script
 *
 * Detects Canvas LMS (Instructure-hosted *or* a school's custom domain),
 * injects the Polar stylesheet from web-accessible resources, and toggles
 * the `polar-active` root class from chrome.storage so the popup can enable
 * or disable the theme instantly.
 *
 * The stylesheet is only injected on pages that look like Canvas, so it
 * never touches unrelated sites even though the script matches broadly.
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  // We inject the stylesheet ourselves (only on Canvas), so don't let WXT
  // auto-inject anything.
  cssInjectionMode: 'manual',

  main() {
    const ROOT = document.documentElement;
    const STYLE_ID = 'polar-for-canvas';
    const FONT_ID = 'polar-for-canvas-fonts';

    /** Hostnames that are Canvas without needing a DOM check. */
    const hostLooksLikeCanvas = (): boolean => {
      const h = location.hostname;
      return (
        h.endsWith('.instructure.com') ||
        h.endsWith('.canvas.net') ||
        /(^|\.)canvas\./.test(h) // canvas.okstate.edu, canvas.school.edu, ...
      );
    };

    /** DOM fingerprint for custom domains that don't advertise Canvas in the host. */
    const domLooksLikeCanvas = (): boolean =>
      !!(
        document.querySelector('.ic-app-header') ||
        document.querySelector('meta[name="csrf-token"]') ||
        (document.getElementById('application') &&
          document.body?.className.includes('ic-app'))
      );

    const injectStyles = () => {
      if (!document.getElementById(STYLE_ID)) {
        const link = document.createElement('link');
        link.id = STYLE_ID;
        link.rel = 'stylesheet';
        link.href = browser.runtime.getURL('/polar.css');
        // Only neutralize white InstUI surfaces once the theme is applied,
        // otherwise every (still-unstyled) surface would read as white.
        link.addEventListener('load', () => {
          cssReady = true;
          scheduleClassify();
        });
        (document.head || ROOT).appendChild(link);
      }
      if (!document.getElementById(FONT_ID)) {
        const fonts = document.createElement('link');
        fonts.id = FONT_ID;
        fonts.rel = 'stylesheet';
        // Geist Mono is open; Inter stands in for the commercial Neue Montreal.
        fonts.href =
          'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap';
        (document.head || ROOT).appendChild(fonts);
      }
    };

    const setEnabled = (enabled: boolean) => {
      ROOT.classList.toggle('polar-active', enabled);
    };

    /**
     * Canvas's React/InstUI buttons bake their color into hashed "emotion"
     * class names with no semantic marker — a primary action and a secondary
     * one are indistinguishable in the DOM except by the rendered fill. So we
     * classify them at runtime: vivid brand fills become `primary` (→ Ether),
     * white/near-white fills become `light` (→ raised), and already-dark
     * buttons are left alone. CSS does the recoloring from the data attribute.
     */
    const classifyButtons = () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        '[class*="baseButton__content"]:not([data-polar])'
      );
      nodes.forEach((el) => {
        const m = getComputedStyle(el).backgroundColor.match(
          /(\d+),\s*(\d+),\s*(\d+)/
        );
        if (!m) {
          el.dataset.polar = '';
          return;
        }
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        const light = Math.max(r, g, b) / 255;
        el.dataset.polar = sat > 40 ? 'primary' : light > 0.82 ? 'light' : '';
      });
    };

    /**
     * Generalized dark-mode "fixer" (inspired by BetterCanvas): the static
     * stylesheet gives the exact Polar look on known surfaces; this is the
     * safety net that catches everything it misses — without enumerating a
     * single selector. After the theme is applied, it walks each element once
     * and tags any that still read as a light-theme remnant:
     *   • near-white background        → flatten (Night shows through)
     *   • light-gray background        → raise to Ash
     *   • light/near-white border      → hairline
     *   • very-dark text               → Snow
     * Colored elements (saturated) are left alone, so semantic hues survive.
     * Reading the *computed* color means it never touches what the theme
     * already darkened, and it re-runs on SPA mutations for late content.
     */
    let cssReady = false;
    const rgb = (v: string) =>
      v.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/);
    const neutral = (r: number, g: number, b: number) =>
      Math.max(r, g, b) - Math.min(r, g, b) < 26; // gray/white, not a hue
    const fixLightRemnants = () => {
      if (!cssReady) return;
      const nodes = document.querySelectorAll<HTMLElement>(
        'body *:not([data-pf])'
      );
      nodes.forEach((el) => {
        el.dataset.pf = ''; // processed once
        if (el.matches('img, svg, svg *, canvas, video, iframe, .avatar')) return;
        const s = getComputedStyle(el);

        const bg = rgb(s.backgroundColor);
        if (bg) {
          const a = bg[4] === undefined ? 1 : +bg[4];
          const r = +bg[1],
            g = +bg[2],
            b = +bg[3];
          if (a > 0.9 && neutral(r, g, b)) {
            if (r >= 244) el.dataset.pfBg = '0';
            else if (r >= 222) el.dataset.pfBg = '1';
          }
        }

        const bd = rgb(s.borderColor);
        if (
          bd &&
          +bd[1] >= 198 &&
          neutral(+bd[1], +bd[2], +bd[3]) &&
          (parseFloat(s.borderTopWidth) > 0 ||
            parseFloat(s.borderBottomWidth) > 0 ||
            parseFloat(s.borderLeftWidth) > 0 ||
            parseFloat(s.borderRightWidth) > 0)
        ) {
          el.dataset.pfBorder = '1';
        }

        const tx = rgb(s.color);
        if (tx && +tx[1] <= 72 && +tx[2] <= 72 && +tx[3] <= 72) {
          el.dataset.pfText = '1';
        }
      });
    };

    let scheduled = false;
    const scheduleClassify = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        classifyButtons();
        fixLightRemnants();
      });
    };

    const watchButtons = () => {
      classifyButtons();
      fixLightRemnants();
      // Canvas is a SPA; re-tag buttons/surfaces added on navigation/render.
      new MutationObserver(scheduleClassify).observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    const activate = () => {
      injectStyles();
      // Default ON; respect the stored preference and live changes.
      storage.getItem<boolean>('sync:polarEnabled').then((v) => {
        setEnabled(v !== false);
      });
      storage.watch<boolean>('sync:polarEnabled', (v) => setEnabled(v !== false));
      // Paint immediately to avoid a flash of unstyled Canvas.
      setEnabled(true);
      // Tag InstUI buttons once the DOM is ready, then keep watching.
      if (document.body) watchButtons();
      else
        document.addEventListener('DOMContentLoaded', watchButtons, {
          once: true,
        });
    };

    if (hostLooksLikeCanvas()) {
      activate();
      return;
    }

    // Custom domain: wait for enough DOM to fingerprint Canvas.
    const check = () => {
      if (domLooksLikeCanvas()) {
        activate();
        return true;
      }
      return false;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => check(), { once: true });
    } else if (!check()) {
      // Some Canvas chrome renders late; give it one more tick.
      setTimeout(check, 500);
    }
  },
});
