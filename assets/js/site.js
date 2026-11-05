/* InnQue 웹사이트 — 꼭 필요한 동작만 (2026-11-05, Pixel · INNA-233)
   1) 모바일·태블릿 메뉴 판 열기/닫기 (Esc, 포커스 가두기, 닫을 때 메뉴 버튼으로 포커스 복귀)
   2) 메뉴 현재 위치(aria-current)를 스크롤 위치에 맞춤
   3) ?review — 대표님 확인 전이라 숨긴 [확인 필요] 자리를 옅게 보여 주는 검토 모드
   JS가 없어도 모든 내용은 보이고, 메뉴는 푸터 메뉴로 대신합니다. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');

  if (/[?&]review\b/.test(location.search)) root.classList.add('is-review');

  /* ---------- 1. 메뉴 판 ---------- */
  var panel = document.getElementById('menu-panel');
  var openBtn = document.querySelector('[data-menu-open]');
  var lastFocus = null;
  var outside = document.querySelectorAll('body > header, body > main, body > footer, body > .skip');

  function focusables() {
    return Array.prototype.filter.call(
      panel.querySelectorAll('a[href], button:not([disabled])'),
      function (el) { return el.offsetParent !== null; }
    );
  }

  function setOpen(open, restoreFocus) {
    if (!panel || !openBtn) return;
    root.classList.toggle('menu-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    Array.prototype.forEach.call(outside, function (el) {
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) {
      lastFocus = document.activeElement;
      var current = panel.querySelector('nav a[aria-current]') || panel.querySelector('nav a');
      if (current) current.focus();
    } else if (restoreFocus !== false) {
      (lastFocus && document.contains(lastFocus) ? lastFocus : openBtn).focus();
    }
  }

  if (panel && openBtn) {
    openBtn.addEventListener('click', function () { setOpen(true); });
    Array.prototype.forEach.call(panel.querySelectorAll('[data-menu-close]'), function (el) {
      /* 메뉴 항목을 누르면 그 섹션으로 이동하므로 포커스를 메뉴 버튼으로 돌리지 않음 */
      el.addEventListener('click', function () { setOpen(false, el.tagName === 'BUTTON'); });
    });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      var list = focusables();
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    /* 넓은 화면으로 바뀌면(≥1280, 메뉴가 펼쳐짐) 판을 닫음 */
    var wide = window.matchMedia('(min-width: 1280px)');
    var onWide = function () { if (wide.matches && root.classList.contains('menu-open')) setOpen(false, false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  /* ---------- 2. 메뉴 현재 위치 ---------- */
  var links = document.querySelectorAll('[data-spy] a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  var byId = {};
  Array.prototype.forEach.call(links, function (a) {
    var id = a.getAttribute('href').slice(1);
    (byId[id] = byId[id] || []).push(a);
  });
  var sections = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var visible = {};
  function mark() {
    var currentId = null;
    sections.forEach(function (s) { if (visible[s.id]) currentId = currentId || s.id; });
    Array.prototype.forEach.call(links, function (a) { a.removeAttribute('aria-current'); });
    if (currentId) byId[currentId].forEach(function (a) { a.setAttribute('aria-current', 'location'); });
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
    mark();
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(function (s) { io.observe(s); });
})();
