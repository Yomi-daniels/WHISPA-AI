export function initDiary() {
  const recordBtn = document.getElementById('record-diary');
  const output = document.getElementById('diary-output');

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recordBtn?.addEventListener('click', () => {
    recognition.start();
  });

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    output.value += `\n${text}`;
  };
}
