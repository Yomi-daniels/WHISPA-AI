export function initMusic() {
  const player = document.getElementById('music-player');
  const playBtn = document.getElementById('play-music');

  playBtn?.addEventListener('click', () => {
    player.play();
  });
}
