export async function initFaceDetection() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  const video = document.getElementById('camera');

  faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).then((detections) => {
    console.log('Faces detected:', detections.length);
  });
}
