/* Runs before first paint so the page never flashes the wrong theme.
   A saved choice wins; otherwise follow the OS preference. */
(function () {
  var t = null;
  try { t = localStorage.getItem('xorio-theme'); } catch (e) {}
  if (t !== 'light' && t !== 'mono') {
    t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'mono';
  }
  document.documentElement.setAttribute('data-theme', t);
})();
