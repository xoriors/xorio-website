/* Runs before first paint so the page never flashes the wrong theme.
   Dark is the default; a saved choice wins. */
(function () {
  var t = 'mono';
  try { if (localStorage.getItem('xorio-theme') === 'light') t = 'light'; } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
})();
