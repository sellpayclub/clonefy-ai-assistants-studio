(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var src = script ? script.src : '';
  var params = {};
  try {
    var url = new URL(src);
    url.searchParams.forEach(function (v, k) { params[k] = v; });
  } catch (e) {}

  var bot = params.bot || '';
  var position = params.position === 'left' ? 'left' : 'right';
  var color = params.color ? decodeURIComponent(params.color) : '#0088cc';
  var tooltip = params.tooltip ? decodeURIComponent(params.tooltip) : 'Fale conosco no Telegram';
  var mode = params.mode || 'float';

  if (!bot) {
    console.warn('[telegram-widget] Parâmetro "bot" não informado. Ex: ?bot=meubot');
    return;
  }

  var telegramUrl = 'https://t.me/' + bot;

  // ── Inline mode ──────────────────────────────────────────────────────────
  if (mode === 'inline') {
    var links = document.querySelectorAll('a.telegram-btn');
    links.forEach(function (el) {
      el.href = telegramUrl;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:8px',
        'background:' + color,
        'color:#fff',
        'padding:10px 20px',
        'border-radius:8px',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'font-size:15px',
        'font-weight:600',
        'text-decoration:none',
        'transition:opacity .2s,transform .15s',
        'box-shadow:0 2px 8px rgba(0,0,0,.18)',
      ].join(';');
      el.addEventListener('mouseover', function () {
        el.style.opacity = '0.88';
        el.style.transform = 'translateY(-1px)';
      });
      el.addEventListener('mouseout', function () {
        el.style.opacity = '1';
        el.style.transform = '';
      });
    });
    return;
  }

  // ── Float mode ────────────────────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '@keyframes tg-pulse{0%,100%{box-shadow:0 0 0 0 ' + color + '55}50%{box-shadow:0 0 0 8px transparent}}',
    '.tg-fab{position:fixed;bottom:24px;' + position + ':24px;z-index:2147483647;display:flex;align-items:center;gap:10px;flex-direction:' + (position === 'left' ? 'row' : 'row-reverse') + '}',
    '.tg-btn{width:56px;height:56px;border-radius:50%;background:' + color + ';border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,136,204,.45);transition:transform .2s,box-shadow .2s;animation:tg-pulse 2.8s ease-in-out infinite;flex-shrink:0}',
    '.tg-btn:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(0,136,204,.6);animation:none}',
    '.tg-btn svg{width:30px;height:30px;fill:#fff}',
    '.tg-tip{background:rgba(0,0,0,.78);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;font-weight:500;padding:7px 13px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transform:translateX(' + (position === 'left' ? '-6px' : '6px') + ');transition:opacity .2s,transform .2s}',
    '.tg-fab:hover .tg-tip{opacity:1;transform:translateX(0)}',
  ].join('');
  document.head.appendChild(styleEl);

  var fab = document.createElement('div');
  fab.className = 'tg-fab';

  var btn = document.createElement('button');
  btn.className = 'tg-btn';
  btn.setAttribute('aria-label', tooltip);
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>';
  btn.addEventListener('click', function () {
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  });

  var tip = document.createElement('span');
  tip.className = 'tg-tip';
  tip.textContent = tooltip;

  fab.appendChild(btn);
  fab.appendChild(tip);

  if (document.body) {
    document.body.appendChild(fab);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(fab);
    });
  }
})();
