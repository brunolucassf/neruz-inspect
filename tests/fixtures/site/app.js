window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ event: 'gtm.js', 'gtm.start': 1 }, { event: 'page_view', page: 'home' });
window.gtag = function () { window.dataLayer.push(arguments); };
window.fbq = function () {};
localStorage.setItem('theme', 'light');
localStorage.setItem('user', JSON.stringify({ id: 7, name: 'Ana', tags: ['a', 'b'] }));
sessionStorage.setItem('session-key', 'abc123');
document.cookie = 'visited=1; path=/';
document.cookie = 'consent=yes; path=/; max-age=3600';
const el = document.querySelector('.waapi');
if (el && el.animate) {
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(120px)' }], { duration: 1800, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
}
