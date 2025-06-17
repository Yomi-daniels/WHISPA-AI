export function initWeather() {
  const display = document.getElementById('weather-display');
  fetch('https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=London')
    .then(res => res.json())
    .then(data => {
      display.textContent = `${data.location.name}: ${data.current.temp_c}°C`;
    })
    .catch(() => {
      display.textContent = 'Weather info unavailable';
    });
}
