export function initVoiceCommands() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.continuous = true;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log('Voice command:', transcript);

    if (transcript.includes('take photo')) document.getElementById('camera-btn')?.click();
    if (transcript.includes('open diary')) document.getElementById('diary-section')?.classList.remove('hidden');
    if (transcript.includes('dark mode')) document.body.classList.add('dark');
    if (transcript.includes('light mode')) document.body.classList.remove('dark');
    if (transcript.includes('start timer')) startTimer(60); // 1 min timer
    if (transcript.includes('show sidebar')) document.getElementById('sidebar')?.classList.remove('hidden');
    if (transcript.includes('play music')) document.getElementById('music-player')?.play();
  };

  recognition.start();
}

function startTimer(seconds) {
  const display = document.getElementById('timer');
  let remaining = seconds;
  const interval = setInterval(() => {
    display.textContent = `${remaining--}s`;
    if (remaining < 0) clearInterval(interval);
  }, 1000);
}
