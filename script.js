// --- DOM Element Selectors ---
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const themeToggle = document.getElementById("theme-toggle");
const statusMessage = document.getElementById("status-message");
const weatherCard = document.getElementById("weather-card");
const recentContainer = document.getElementById("recent-searches");
const recentTags = document.getElementById("recent-tags");

// --- API Configuration ---
const API_KEY = "a96f3a1cd19a96254e480dee32ea994e";

// --- State Management ---
let recentCities = JSON.parse(localStorage.getItem("weather_recent")) || [];

// --- Event Listeners ---
searchBtn.addEventListener("click", () => handleSearch());
locationBtn.addEventListener("click", handleGeolocation);
themeToggle.addEventListener("click", toggleDarkMode);
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// --- Initial Load ---
updateRecentUI();

// Check saved theme preference on load
if (localStorage.getItem("weather_theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeToggle.textContent = "☀️ Light Mode";
}

// --- Core Search & Geolocation Handlers ---
function handleSearch(cityName) {
  const city = cityName || cityInput.value.trim();
  
  if (!city) {
    showError("Please enter a valid city name.");
    return;
  }

  if (!navigator.onLine) {
    showError("No internet connection. Please check your network.");
    return;
  }

  fetchWeatherData(`q=${encodeURIComponent(city)}`, city);
}

function handleGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  if (!navigator.onLine) {
    showError("No internet connection. Please check your network.");
    return;
  }

  showLoading("Detecting your location...");
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherData(`lat=${latitude}&lon=${longitude}`);
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          showError("Location permission denied. Please search manually.");
          break;
        case error.POSITION_UNAVAILABLE:
          showError("Location information is unavailable.");
          break;
        case error.TIMEOUT:
          showError("Location request timed out.");
          break;
        default:
          showError("Unable to retrieve your location.");
      }
    },
    { timeout: 10000 }
  );
}

// --- API Fetch Function ---
async function fetchWeatherData(queryParam, cityName = null) {
  showLoading("Fetching weather data...");
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${queryParam}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 404) throw new Error("City not found. Please check the spelling.");
      if (response.status === 401) throw new Error("Invalid API key configuration.");
      if (response.status === 429) throw new Error("API rate limit exceeded. Try again later.");
      throw new Error("Unable to fetch weather data. Please try again.");
    }

    const data = await response.json();
    displayWeatherData(data);

    const resolvedName = cityName || data.name;
    if (resolvedName) {
      saveRecentCity(resolvedName);
    }
  } catch (error) {
    showError(error.message);
  }
}

// --- Recent Searches Management ---
function saveRecentCity(city) {
  const formatted = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  
  recentCities = recentCities.filter(c => c.toLowerCase() !== formatted.toLowerCase());
  recentCities.unshift(formatted);
  
  if (recentCities.length > 5) recentCities.pop(); // Keep top 5 recent searches
  
  localStorage.setItem("weather_recent", JSON.stringify(recentCities));
  updateRecentUI();
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

// --- UI & Theme Toggles ---
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("weather_theme", isDark ? "dark" : "light");
}

function showLoading(message = "Loading...") {
  statusMessage.textContent = message;
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