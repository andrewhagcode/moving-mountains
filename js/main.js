/* Moving Mountains — progressive enhancement. Site works without this file. */
(function () {
  var doc = document.documentElement;
  var hero = document.querySelector('.hero');
  var word = hero && hero.querySelector('.word');

  /* ---------- hero scaling: 1440×610 stage fitted to the viewport ---------- */
  function fitHero() {
    if (!hero) return;
    var W = doc.clientWidth;
    var mobile = W < 760;
    var s, hh, ws, wy;
    if (!mobile) {
      s = Math.min(W / 1440, 1.2);
      hh = 610 * s;
      ws = s;
      wy = -86;
      // keep the wordmark inside the frame on narrow desktops
      doc.style.setProperty('--ws', ws);
      var wNat = naturalWidth();
      if (wNat && wNat * ws > W - 24) ws = (W - 24) / wNat;
    } else {
      s = W / 1000;                      // whole band fits across a phone
      wy = 14;
      doc.style.setProperty('--ws', 0.5);
      var wNatM = naturalWidth() || 900;
      ws = Math.min((W - 16) / wNatM, 0.62);
      var wordBottom = word ? (wy + word.offsetHeight) * ws : 240;
      hh = Math.max(610 * s, wordBottom + 585 * s + 6);
    }
    doc.style.setProperty('--s', s.toFixed(4));
    doc.style.setProperty('--ws', ws.toFixed(4));
    doc.style.setProperty('--hh', Math.round(hh) + 'px');
    doc.style.setProperty('--wy', wy + 'px');
  }
  function naturalWidth() {
    if (!word) return 0;
    var max = 0;
    word.querySelectorAll('h1, p').forEach(function (el) { max = Math.max(max, el.offsetWidth); });
    return max ? max + 32 : 0;
  }
  fitHero();
  window.addEventListener('resize', fitHero, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);

  /* ---------- header shadow + active section ---------- */
  var head = document.getElementById('head');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a[href^="#"]:not(.pill):not(.menu-close)'));
  function onScroll() {
    if (head) head.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu (CSS :target fallback) ---------- */
  var menu = document.getElementById('menu');
  var btn = document.querySelector('.menu-btn');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (btn) btn.addEventListener('click', function (e) { e.preventDefault(); setMenu(true); });
  if (menu) menu.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    if (a.classList.contains('menu-close')) { e.preventDefault(); setMenu(false); return; }
    setMenu(false);
  });

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var groups = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.remove('pre');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    var fold = window.innerHeight;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.rv').forEach(function (el) {
      if (reduce || el.getBoundingClientRect().top < fold) return;   // already on screen: leave visible
      var p = el.parentElement;
      var n = groups.get(p) || 0;
      groups.set(p, n + 1);
      el.style.setProperty('--d', Math.min(n, 6) * 0.08 + 's');
      el.classList.add('pre');
      io.observe(el);
    });

    // active nav link
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var t = document.querySelector(a.getAttribute('href'));
      if (t) secIO.observe(t);
    });

    // band cards: slow crossfade between each member's two photos
    var cards = document.querySelectorAll('.member');
    var timer = null, idx = 0;
    var bandIO = new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !timer && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = setInterval(function () {
          cards[idx % cards.length].classList.toggle('flip');
          idx++;
        }, 1800);
      } else if (!vis && timer) { clearInterval(timer); timer = null; }
    });
    var bandSec = document.getElementById('band');
    if (bandSec && cards.length) bandIO.observe(bandSec);
  }


  /* ---------- YouTube thumbnails: load the player only when clicked ---------- */
  document.querySelectorAll('.yt[data-yt]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + a.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = a.getAttribute('aria-label') || 'YouTube video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      var holder = document.createElement('div');
      holder.className = 'yt';
      holder.appendChild(f);
      a.replaceWith(holder);
    });
  });

  /* ---------- lightbox (no hash jumps when JS is on) ---------- */
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.lb'));
  var current = -1, lastFocus = null;
  function openBox(i) {
    closeBox(true);
    current = (i + boxes.length) % boxes.length;
    var b = boxes[current];
    b.classList.add('open');
    document.body.style.overflow = 'hidden';
    var c = b.querySelector('.lb-close'); if (c) c.focus({ preventScroll: true });
  }
  function closeBox(keep) {
    if (current < 0) return;
    boxes[current].classList.remove('open');
    current = -1;
    if (!keep) {
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
  }
  document.querySelectorAll('.g-item').forEach(function (a, i) {
    a.addEventListener('click', function (e) { e.preventDefault(); lastFocus = a; openBox(i); });
  });
  boxes.forEach(function (b, i) {
    b.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) {
        e.preventDefault();
        if (a.classList.contains('lb-prev')) openBox(i - 1);
        else if (a.classList.contains('lb-next')) openBox(i + 1);
        else closeBox();
      } else if (e.target === b) closeBox();
    });
  });
  document.addEventListener('keydown', function (e) {
    if (current >= 0) {
      if (e.key === 'Escape') closeBox();
      else if (e.key === 'ArrowLeft') openBox(current - 1);
      else if (e.key === 'ArrowRight') openBox(current + 1);
    } else if (e.key === 'Escape' && menu && menu.classList.contains('open')) setMenu(false);
  });
  // if someone arrives on a #ph-N link, show it via class too
  if (/^#ph-\d+$/.test(location.hash)) {
    var n = parseInt(location.hash.slice(4), 10) - 1;
    if (boxes[n]) { history.replaceState(null, '', '#photos'); openBox(n); }
  }
})();
