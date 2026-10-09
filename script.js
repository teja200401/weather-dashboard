const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const themeToggle = document.getElementById("theme-toggle");
const statusMessage = document.getElementById("status-message");
const weatherCard = document.getElementById("weather-card");
const recentContainer = document.getElementById("recent-searches");
const recentTags = document.getElementById("recent-tags");

const API_KEY = "a96f3a1cd19a96254e480dee32ea994e"; // Insert your API Key here

let recentCities = JSON.parse(localStorage.getItem("weather_recent")) || [];

// Event Listeners
searchBtn.addEventListener("click", () => handleSearch());
locationBtn.addEventListener("click", handleGeolocation);
themeToggle.addEventListener("click", toggleDarkMode);
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Initial Load
updateRecentUI();

function handleSearch(cityName) {
  const city = cityName || cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  fetchWeatherData(`q=${encodeURIComponent(city)}`, city);
}

function handleGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherData(`lat=${latitude}&lon=${longitude}`);
    },
    () => showError("Unable to retrieve location permission.")
  );
}

async function fetchWeatherData(queryParam, cityName = null) {
  showLoading();
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${queryParam}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 404) throw new Error("City not found.");
      if (response.status === 401) throw new Error("Invalid API key.");
      throw new Error("Unable to fetch weather data.");
    }

    const data = await response.json();
    displayWeatherData(data);

    if (cityName || data.name) {
      saveRecentCity(cityName || data.name);
    }
  } catch (error) {
    showError(error.message);
  }
}

function saveRecentCity(city) {
  const formatted = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  if (!recentCities.includes(formatted)) {
    recentCities.unshift(formatted);
    if (recentCities.length > 3) recentCities.pop(); // Keep top 3
    localStorage.setItem("weather_recent", JSON.stringify(recentCities));
    updateRecentUI();
  }
}

function updateRecentUI() {
  if (recentCities.length === 0) {
    recentContainer.classList.add("hidden");
    return;
  }
  recentTags.innerHTML = "";
  recentCities.forEach((city) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = city;
    tag.addEventListener("click", () => handleSearch(city));
    recentTags.appendChild(tag);
  });
  recentContainer.classList.remove("hidden");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function showLoading() {
  statusMessage.textContent = "Fetching weather data...";
  statusMessage.className = "status loading";
  weatherCard.classList.add("hidden");
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.className = "status error";
  weatherCard.classList.add("hidden");
}

function displayWeatherData(data) {
  statusMessage.className = "hidden";
  document.getElementById("city-name").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById("condition").textContent = data.weather[0].description;
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("wind").textContent = `${data.wind.speed} m/s`;

  const iconCode = data.weather[0].icon;
  document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherCard.classList.remove("hidden");
}