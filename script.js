// DOM Elements
const h6Elem = document.querySelector('#h6Elem');
const btnListen = document.querySelector('#btnListen');
const debugText = document.querySelector('#debugText');
const sidebar = document.querySelector('#sidebar');
const sidebarToggle = document.querySelector('#sidebarToggle');
const timerDisplay = document.querySelector('#timerDisplay');
const spotifyPlayer = document.getElementById('spotifyPlayer');
const video = document.getElementById('cameraStream');
const canvas = document.getElementById('photoCanvas');
const downloadLink = document.getElementById('downloadLink');
const gallery = document.getElementById('gallery');
const gallerySection = document.getElementById('gallerySection');

// Diary Elements
const toggleDiaryBtn = document.getElementById('toggleDiaryBtn');
const diarySection = document.getElementById('diarySection');
const diaryInput = document.getElementById('diaryInput');
const saveDiaryBtn = document.getElementById('saveDiaryBtn');
const clearDiaryBtn = document.getElementById('clearDiaryBtn');
const diaryEntriesList = document.getElementById('diaryEntriesList');
const startVoiceBtn = document.getElementById('startVoiceBtn');
const stopVoiceBtn = document.getElementById('stopVoiceBtn');

// State Variables
let activeTimers = [];
let voiceCommandActive = true;

let mediaStream = null;
let faceDetectionEnabled = false;
let currentFilter = '';
let currentTheme = 'default';
let finalTranscript = '';

// Check browser support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  debugText.textContent = "Speech recognition not supported in this browser";
  btnListen.disabled = true;
  startVoiceBtn.disabled = true;
}

// Initialize main speech recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.continuous = false;

recognition.onstart = () => console.log('Main recognition started');
recognition.onend = () => {
  if (voiceCommandActive) {
    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition restart error:', e);
    }
  }
};

recognition.onresult = (e) => {
  if (!voiceCommandActive || isVoicePrintActive) return;
  const result = e.results[0][0].transcript.toLowerCase();
  h6Elem.textContent = result;
  debugText.textContent = `Heard: "${result}"`;
  respondToCommand(result);
};


recognition.onerror = (e) => {
  console.error('Recognition error:', e.error);
  debugText.textContent = `Error: ${e.error}`;
};

// Initialize diary speech recognition
const diaryRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
diaryRecognition.lang = 'en-US';
diaryRecognition.interimResults = true;
diaryRecognition.continuous = true;

diaryRecognition.onresult = (event) => {
  let interimTranscript = '';
  for (let i = event.resultIndex; i < event.results.length; ++i) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript + ' ';
    } else {
      interimTranscript += transcript;
    }
  }
  diaryInput.value = finalTranscript + interimTranscript;
};

diaryRecognition.onerror = (e) => {
  console.error('Diary recognition error:', e.error);
  speak(`Diary voice error: ${e.error}`);
};

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'default';
  switchTheme(savedTheme);
  loadDiaryEntries();
});

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

btnListen.addEventListener('click', () => {
  if (!voiceCommandActive) {
    voiceCommandActive = true;
    speak('Voice command activated.');
  }
  h6Elem.textContent = 'Listening...';
  try {
    recognition.start();
  } catch (e) {
    console.warn('Recognition start error:', e);
  }
});

toggleDiaryBtn.addEventListener('click', () => {
  diarySection.style.display = diarySection.style.display === 'block' ? 'none' : 'block';
  loadDiaryEntries();
});

saveDiaryBtn.addEventListener('click', () => {
  saveDiaryEntry(diaryInput.value);
});

clearDiaryBtn.addEventListener('click', () => {
  clearDiaryEntries();
});

startVoiceBtn.addEventListener('click', () => {
  if (voiceCommandActive) {
    stopVoiceCommand();
  }
  diaryInput.focus();
  try {
    diaryRecognition.start();
    startVoiceBtn.disabled = true;
    stopVoiceBtn.disabled = false;
    speak('Diary voice input started.');
  } catch (e) {
    console.warn('Diary recognition start error:', e);
  }
});

stopVoiceBtn.addEventListener('click', () => {
  try {
    diaryRecognition.stop();
    startVoiceBtn.disabled = false;
    stopVoiceBtn.disabled = true;
    speak('Diary voice input stopped.');
  } catch (e) {
    console.warn('Diary recognition stop error:', e);
  }
  voiceCommandActive = true;
  try {
    recognition.start();
    h6Elem.textContent = 'Listening...';
  } catch (e) {
    console.warn('Main recognition restart error:', e);
  }
});

diaryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    saveDiaryBtn.click();
  }
});

// Core Functions
function speak(text) {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported.');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = 1;
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}


function respondToCommand(cmd) {
  const commands = {
    'dark mode': () => switchTheme('dark'),
    'cyberpunk': () => switchTheme('cyberpunk'),
    'default theme': () => switchTheme('default'),
    'light mode': () => switchTheme('default'),
    // NEW COMMANDS ADDED HERE
    'toggle sidebar': () => {
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      speak(isCollapsed ? "Sidebar hidden." : "Sidebar shown.");
    },
    'switch to dark mode': () => switchTheme('dark'),
    'switch to light mode': () => switchTheme('default'),
    // END NEW COMMANDS
    'enable face detection': () => {
      faceDetectionEnabled = true;
      speak("Face detection enabled.");
      detectFaces();
    },
    'disable face detection': () => {
      faceDetectionEnabled = false;
      speak("Face detection disabled.");
    },
    'apply sepia': () => {
      currentFilter = 'sepia(100%)';
      canvas.style.filter = currentFilter;
      speak("Sepia filter applied.");
    },
    'apply cartoon': () => {
      currentFilter = 'contrast(200%) brightness(120%)';
      canvas.style.filter = currentFilter;
      speak("Cartoon filter applied.");
    },
    'remove filter': () => {
      currentFilter = '';
      canvas.style.filter = 'none';
      speak("Filters removed.");
    },
    'clear filter': () => {
      currentFilter = '';
      canvas.style.filter = 'none';
      speak("Filters removed.");
    },
    'turn off voice command': () => stopVoiceCommand(),
    'stop listening': () => stopVoiceCommand(),
    'disable voice command': () => stopVoiceCommand(),
    'open sidebar': () => {
      sidebar.classList.remove("collapsed");
      speak("Opening sidebar.");
    },
    'show sidebar': () => {
      sidebar.classList.remove("collapsed");
      speak("Opening sidebar.");
    },
    'expand sidebar': () => {
      sidebar.classList.remove("collapsed");
      speak("Opening sidebar.");
    },
    'close sidebar': () => {
      sidebar.classList.add("collapsed");
      speak("Closing sidebar.");
    },
    'hide sidebar': () => {
      sidebar.classList.add("collapsed");
      speak("Closing sidebar.");
    },
    'collapse sidebar': () => {
      sidebar.classList.add("collapsed");
      speak("Closing sidebar.");
    },
    'youtube': () => {
      window.open("https://www.youtube.com", "_blank");
      speak("Opening YouTube.");
    },
    'gmail': () => {
      window.open("https://mail.google.com", "_blank");
      speak("Opening Gmail.");
    },
    'spotify': () => {
      window.open("https://open.spotify.com", "_blank");
      speak("Opening Spotify.");
    },
    'show music player': () => {
      spotifyPlayer.style.display = "block";
      speak("Showing music player.");
    },
    'open music player': () => {
      spotifyPlayer.style.display = "block";
      speak("Showing music player.");
    },
    'play spotify': () => {
      spotifyPlayer.style.display = "block";
      speak("Showing music player.");
    },
    'hide music player': () => {
      spotifyPlayer.style.display = "none";
      speak("Hiding music player.");
    },
    'close music player': () => {
      spotifyPlayer.style.display = "none";
      speak("Hiding music player.");
    },
    'stop spotify': () => {
      spotifyPlayer.style.display = "none";
      speak("Hiding music player.");
    },
    'weather': () => {
      checkWeather();
      speak("Checking the weather.");
    },
    'forecast': () => {
      checkWeather();
      speak("Checking the forecast.");
    },
    'show photos': () => {
      showImages();
      speak("Here are your photos.");
    },
    'display images': () => {
      showImages();
      speak("Displaying your images.");
    },
    'open photos': () => {
      showImages();
      speak("Opening photo gallery.");
    },
    'cancel timer': () => {
      cancelAllTimers();
      speak("All timers cancelled.");
    },
    'stop timer': () => {
      cancelAllTimers();
      speak("All timers cancelled.");
    },
    'cancel all timers': () => {
      cancelAllTimers();
      speak("All timers cancelled.");
    },
    'open camera': () => openCamera(),
    'start camera': () => openCamera(),
    'show camera': () => openCamera(),
    'take photo': () => takePhoto(),
    'snap picture': () => takePhoto(),
    'capture photo': () => takePhoto(),
    'open diary': () => {
      diarySection.style.display = 'block';
      speak("Diary opened.");
      loadDiaryEntries();
    },
    'show diary': () => {
      diarySection.style.display = 'block';
      speak("Diary opened.");
      loadDiaryEntries();
    },
    'close diary': () => {
      diarySection.style.display = 'none';
      speak("Diary closed.");
    },
    'hide diary': () => {
      diarySection.style.display = 'none';
      speak("Diary closed.");
    },
    'start diary voice': () => startVoiceBtn.click(),
    'stop diary voice': () => stopVoiceBtn.click(),
    'save diary': () => saveDiaryBtn.click(),
    'clear diary input': () => {
      diaryInput.value = '';
      finalTranscript = '';
      speak('Diary input cleared.');
    },
    'clear diary entries': () => clearDiaryBtn.click()
  };

  for (let key in commands) {
    if (cmd.includes(key)) return commands[key]();
  }

  const timerMatch = cmd.match(/set (a )?timer for (\d+)\s?(second|seconds|minute|minutes)/);
  if (timerMatch) {
    const amount = parseInt(timerMatch[2]);
    const unit = timerMatch[3];
    const ms = unit.includes("minute") ? amount * 60000 : amount * 1000;
    const label = `${amount} ${unit}`;
    startTimer(ms, label);
    speak(`Timer set for ${label}.`);
    return;
  }

  const weatherMatch = cmd.match(/weather in (\w+)/i);
  if (weatherMatch) {
    checkWeather(weatherMatch[1]);
    return;
  }

  speak("Sorry, I didn't understand the command.");
}

function switchTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  speak(`Switched to ${theme} theme`);
}

function stopVoiceCommand() {
  voiceCommandActive = false;
  try {
    recognition.stop();
    diaryRecognition.stop();
  } catch (e) {
    console.warn('Recognition stop error:', e);
  }
  speak("Voice command deactivated.");
  h6Elem.textContent = "Voice command is off.";
}

function startTimer(duration, label) {
  const endTime = Date.now() + duration;
  const displayElem = document.createElement("div");
  displayElem.className = "timer";
  timerDisplay.appendChild(displayElem);

  const interval = setInterval(() => {
    const remaining = Math.max(0, endTime - Date.now());
    const seconds = Math.floor(remaining / 1000);
    displayElem.textContent = `⏱ ${label} - ${seconds}s left`;

    if (remaining <= 0) {
      clearInterval(interval);
      displayElem.textContent = `✅ ${label} - Time's up!`;
      speak(`Time's up for ${label}`);
    }
  }, 1000);

  activeTimers.push({ interval, displayElem });
}

function cancelAllTimers() {
  activeTimers.forEach(timer => {
    clearInterval(timer.interval);
    timer.displayElem.remove();
  });
  activeTimers = [];
}

async function openCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = mediaStream;
    video.style.display = "block";
    canvas.style.display = "block";
    speak("Camera opened. Say 'take photo' to capture.");
  } catch (err) {
    console.error("Camera error:", err);
    speak("Camera access denied.");
  }
}

function takePhoto() {
  if (!mediaStream) return speak('Camera is not open yet.');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.filter = currentFilter || 'none';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Save to gallery
  const imageDataUrl = canvas.toDataURL('image/png');
  let photos = JSON.parse(localStorage.getItem('photos') || '[]');
  photos.push(imageDataUrl);
  localStorage.setItem('photos', JSON.stringify(photos));
  
  downloadLink.href = imageDataUrl;
  downloadLink.download = `photo_${Date.now()}.png`;
  downloadLink.style.display = 'inline-block';
  speak("Photo captured and saved.");
}

// Diary Functions
function saveDiaryEntry(text) {
  if (!text.trim()) return;
  let diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
  diaryEntries.push({ text, date: new Date().toISOString() });
  localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));
  speak('Diary entry saved.');
  loadDiaryEntries();
  diaryInput.value = '';
  finalTranscript = '';
}

function loadDiaryEntries() {
  diaryEntriesList.innerHTML = '';
  const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');

  diaryEntries.forEach((entry, index) => {
    const li = document.createElement('li');
    li.textContent = `${new Date(entry.date).toLocaleString()}: ${entry.text}`;
    li.style.cursor = 'pointer';
    li.title = 'Click to hear this entry';

    li.addEventListener('click', () => {
      speak(entry.text);
    });

    diaryEntriesList.appendChild(li);
  });
}


function clearDiaryEntries() {
  localStorage.removeItem('diaryEntries');
  diaryEntriesList.innerHTML = '';
  speak('Diary cleared.');
}

// Face Detection
async function detectFaces() {
  if (!faceDetectionEnabled) return;
  
  try {
    // Load face-api.js models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);

    if (!video.srcObject) {
      await openCamera();
    }

    video.onloadedmetadata = () => {
      faceapi.matchDimensions(canvas, {
        width: video.videoWidth,
        height: video.videoHeight,
      });

      const detectionInterval = setInterval(async () => {
        if (!faceDetectionEnabled) {
          clearInterval(detectionInterval);
          return;
        }

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(detections, {
          width: video.videoWidth,
          height: video.videoHeight,
        });

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }, 500);
    };
  } catch (error) {
    console.error("Face detection error:", error);
    speak("Face detection failed to initialize.");
  }
}

// Weather Function
async function checkWeather(city = "Lagos") {
  const apiKey = "2556c85c0ebdb7e1918893e0020825a2"; // Replace with your actual API key
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== 200) {
      throw new Error(data.message || "Weather data not available");
    }

    const description = data.weather[0].description;
    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    
    const weatherMessage = `Weather in ${city}: ${description}, Temperature: ${temperature}°C, Humidity: ${humidity}%, Wind: ${windSpeed} m/s.`;
    
    speak(weatherMessage);
    debugText.textContent = weatherMessage;
  } catch (error) {
    console.error("Weather fetch error:", error);
    speak(`Sorry, I couldn't fetch the weather for ${city}.`);
  }
}

// Gallery Functions
function showImages() {
  const images = JSON.parse(localStorage.getItem('photos') || '[]');

  if (images.length === 0) {
    speak("You have no saved images.");
    return;
  }

  gallery.innerHTML = "";
  images.forEach((imgData, i) => {
    const img = document.createElement('img');
    img.src = imgData;
    img.alt = `Photo ${i + 1}`;
    img.className = 'gallery-image';
    gallery.appendChild(img);
  });

  gallerySection.style.display = 'block';
  speak(`Displaying your ${images.length} saved images.`);
}

// Start the application
setTimeout(() => {
  h6Elem.textContent = 'Listening...';
  try {
    recognition.start();
    speak('Voice command activated.');
  } catch (err) {
    console.warn('Speech recognition failed to start:', err);
    debugText.textContent = 'Please click the mic button to start.';
  }
}, 1000);

function toggleHelpMenu() {
  const menu = document.getElementById('helpMenu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// Optional: Auto-close on outside click
document.addEventListener('click', function (e) {
  const helpBtn = document.getElementById('helpButton');
  const helpMenu = document.getElementById('helpMenu');
  if (!helpMenu.contains(e.target) && !helpBtn.contains(e.target)) {
    helpMenu.style.display = 'none';
  }
});

let isVoicePrintActive = false;
let voicePrintTensor = null;
let mfccs = [];

// Record MFCC features
async function startRecordingFeatures(duration = 2000) {
  return new Promise(async (resolve, reject) => {
    mfccs = [];
    const energyList = [];

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic = audioContext.createMediaStreamSource(stream);

      analyzer = Meyda.createMeydaAnalyzer({
        audioContext,
        source: mic,
        bufferSize: 512,
        featureExtractors: ['mfcc', 'rms'],
        callback: features => {
          if (features && features.mfcc && features.rms != null) {
            mfccs.push(features.mfcc);
            energyList.push(features.rms);
          }
        }
      });

      analyzer.start();

      setTimeout(() => {
        analyzer.stop();
        stream.getTracks().forEach(track => track.stop());

        const avgEnergy = energyList.reduce((a, b) => a + b, 0) / energyList.length;
        const minFrames = 10;
        const minEnergy = 0.01;

        if (mfccs.length < minFrames || avgEnergy < minEnergy) {
          console.warn('Too quiet or too short to be valid voice input');
          resolve(null); // reject silent input
        } else {
          resolve(tf.tensor(mfccs));
        }
      }, duration);
    } catch (err) {
      console.error('Audio setup error:', err);
      resolve(null);
    }
  });
}


// Train voice print
async function recordAndTrain() {
  isVoicePrintActive = true;
  voiceCommandActive = false;
  try { recognition.stop(); } catch {}

  debugText.textContent = "🎤 Recording your voice...";
  speak("Recording....");

  const tensor = await startRecordingFeatures();

  if (!tensor) {
    speak("❌ No valid voice detected. Please try again.");
    debugText.textContent = "❌ No voice input. Try again.";
  } else {
    voicePrintTensor = tensor.mean(0);
    speak("✅ Voice print training complete.");
    debugText.textContent = "✅ Voice print saved.";
  }

  isVoicePrintActive = false;
  voiceCommandActive = true;
  try { recognition.start(); } catch {}
}



// Verify voice
async function verifyVoiceMatch() {
  if (!voicePrintTensor) {
    speak(" Please train your voice print first.");
    return;
  }

  isVoicePrintActive = true;
  voiceCommandActive = false;
  try { recognition.stop(); } catch {}

  debugText.textContent = "🎤 Listening to verify your voice...";
  speak(" verifying...");

  const inputTensor = await startRecordingFeatures();

  if (!inputTensor) {
    speak(" No valid voice detected.");
    debugText.textContent = " No voice input.";
  } else {
    const newAvg = inputTensor.mean(0);
    const dot = voicePrintTensor.dot(newAvg).arraySync();
    const normA = voicePrintTensor.norm().arraySync();
    const normB = newAvg.norm().arraySync();
    const similarity = dot / (normA * normB);
    const percent = Math.round(similarity * 100);

    if (similarity > 0.85) {
      speak(" Voice match verified.");
      debugText.textContent = ` Verified: ${percent}% match`;
    } else {
      speak(" Voice does not match.");
      debugText.textContent = ` Mismatch: ${percent}% similarity`;
    }
  }

  isVoicePrintActive = false;
  voiceCommandActive = true;
  try { recognition.start(); } catch {}
}


// ...existing code...

function carouselNext() {
  const track = document.querySelector('.carousel-track');
  track.scrollBy({ left: 240, behavior: 'smooth' });
}
function carouselPrev() {
  const track = document.querySelector('.carousel-track');
  track.scrollBy({ left: -240, behavior: 'smooth' });
}

// ...existing code...