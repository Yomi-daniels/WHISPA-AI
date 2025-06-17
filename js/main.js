import { initVoiceCommands } from './voiceCommands.js';
import { initCamera } from './camera.js';
import { initDiary } from './diary.js';
import { initTheme } from './theme.js';
import { initTimers } from './timer.js';
import { initSidebar } from './sidebar.js';
import { initFaceDetection } from './faceDetection.js';
import { initMusic } from './music.js';
import { initWeather } from './weather.js';

window.addEventListener('DOMContentLoaded', () => {
  initVoiceCommands();
  initCamera();
  initDiary();
  initTheme();
  initTimers();
  initSidebar();
  initFaceDetection();
  initMusic();
  initWeather();
});
