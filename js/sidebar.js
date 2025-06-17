export function initSidebar() {
  const toggle = document.getElementById('toggle-sidebar');
  const sidebar = document.getElementById('sidebar');
  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
  });
}
