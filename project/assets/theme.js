/* Runs before first paint so the page never flashes the wrong theme.
   Dark is the default; a saved choice wins. Also keeps the browser chrome
   (theme-color) in step with the page. */
(function () {
  var t = 'mono';
  try { if (localStorage.getItem('xorio-theme') === 'light') t = 'light'; } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', t === 'light' ? '#FFFFFF' : '#0A0A0B');
})();
