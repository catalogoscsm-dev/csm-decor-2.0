/* privacidade.js */
document.getElementById('ano').textContent = new Date().getFullYear();

(function () {
  var saved = localStorage.getItem('csm-theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('csm-theme', isDark ? 'light' : 'dark');
  });
}());
