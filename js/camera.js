export function initCamera() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('snapshot');
  const button = document.getElementById('camera-btn');

  if (!navigator.mediaDevices) return;

  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
  });

  button?.addEventListener('click', () => {
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  });
}
