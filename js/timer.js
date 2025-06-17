export function initTimers() {
  const btn = document.getElementById('start-timer');
  const display = document.getElementById('timer');

  btn?.addEventListener('click', () => {
    let seconds = 60;
    const interval = setInterval(() => {
      display.textContent = `${seconds--}s`;
      if (seconds < 0) clearInterval(interval);
    }, 1000);
  });
}
