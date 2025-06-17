export function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  toggleBtn?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
}
