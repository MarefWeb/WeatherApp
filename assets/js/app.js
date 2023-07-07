'use strict';

import * as utils from './utils.js';
import {aqiText, getHours, getTime, monthNames, mps_to_kmh, weekDayNames} from './utils.js';
import {getAirPollution, getCoordinates, getCurrentWeather, getForecast, getLocation} from './api.js';


/* MOBILE SEARCH VIEW TOGGLE */
const searchView = document.querySelector('[data-search-view]');
const searchTogglers = document.querySelectorAll('[data-search-toggler]');

const toggleSearchView = () => searchView.classList.toggle('active');
utils.addEventOnElements(searchTogglers, 'click', toggleSearchView);


/* SEARCHING */
const searchField = document.querySelector('[data-search-field]');
const searchResult = document.querySelector('[data-search-result]');
const searchResultList = searchResult.querySelector('[data-search-list]');

let searchTimeoutId = null;
const searchTimeOutDuration = 500;

searchField.addEventListener('input', () => {
  searchResultList.innerHTML = '';

  if(searchTimeoutId != null)
    clearTimeout(searchTimeoutId);

  if(searchField.value) {
    searchField.classList.add('searching');
    searchTimeoutId = setTimeout(generateSearchResults, searchTimeOutDuration);
  }
  else {
    hideSearchResults();
  }
});

const generateSearchResults = () => {
  getCoordinates(searchField.value, locations => {
    searchField.classList.remove('searching');

    if(locations.length === 0) {
      searchResult.classList.remove('active');
      return;
    }

    searchResult.classList.add('active');

    const searchResults = [];

    for (const {country, lat, lon, name, state} of locations) {
      const searchResult = createSearchResult(name, lat, lon, country, state);
      searchResults.push(searchResult);
    }

    utils.addEventOnElements(searchResults, 'click', () => {
      toggleSearchView();
      searchResult.classList.remove('active');
    });
  });
}

const createSearchResult = (name, lat, lon, country, state) => {
  const newResult = document.createElement('li', );
  newResult.classList.add('view-item');
  newResult.innerHTML = `
    <span class="m-icon">location_on</span>

    <div>
      <p class="item-title">${name}</p>
      <p class="label-2 item-subtitle">${state ? state + ', ' : ''}${country}</p>
    </div>

    <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" data-search-toggler></a>
  `;

  searchResultList.appendChild(newResult);
  return newResult;
}

const hideSearchResults = () => {
  searchResult.classList.remove('active');
  searchField.classList.remove('searching');
}


/* UPDATING WEATHER INFORMATION ON PAGE */
const loading = document.querySelector('[data-loading]');
const container = document.querySelector('article.container');
const errorContent = document.querySelector('[data-error-content]');

const showLoading = () => {
  loading.style.display = 'grid';
  container.style.overflowY = 'hidden';
  container.classList.remove('fade-in')
  errorContent.style.display = 'none';
}

const hideLoading = () => {
  loading.style.display = 'none';
  container.style.overflowY = 'overlay';
  container.classList.add('fade-in')
}

const updateCurrentWeatherWithHighlights = (lat, lon, callback) => {
  getCurrentWeather(lat, lon, data => {
    const {
      weather,
      dt: dateUnix,
      sys: {sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC},
      main: {temp, feels_like, pressure, humidity},
      visibility,
      timezone
    } = data;

    const [{description, icon}] = weather;
    
    const currentWeatherSection = document.querySelector('[data-current-weather]');
    const currentWeatherCard = document.createElement('div');

    currentWeatherSection.innerHTML = '';

    currentWeatherCard.classList.add('card', 'card-lg', 'current-weather-card');
    currentWeatherCard.innerHTML = `
      <h2 class="title-2 card-title">Now</h2>

      <div class="weapper">
        <p class="heading">${parseInt(temp)}&deg;<sup>c</sup></p>

        <img src="./assets/images/weather_icons/${icon}.png"
             width="64" height="64" alt="${description}"
             class="weather-icon">
      </div>

      <p class="body-3">${description}</p>

      <ul class="meta-list">
        <li class="meta-item">
          <span class="m-icon">calendar_today</span>

          <p class="title-3 meta-text">${utils.getDate(dateUnix, timezone)}</p>
        </li>

        <li class="meta-item">
          <span class="m-icon">location_on</span>

          <p class="title-3 meta-text" data-location></p>
        </li>
      </ul>
    `;

    getLocation(lat, lon, location => {
      const {name, country} = location[0];
      const locationParagraph = currentWeatherSection.querySelector('[data-location]');
      locationParagraph.textContent = `${name}, ${country}`;

      callback();
    })

    currentWeatherSection.appendChild(currentWeatherCard);

    const sunriseSunsetCard = document.querySelector('[data-sunrise-sunset]');
    sunriseSunsetCard.innerHTML = `
      <h3 class="title-3">Sunrise & Sunset</h3>
  
      <div class="card-list">
  
        <div class="card-item">
          <span class="m-icon">clear_day</span>
  
          <div>
            <p class="label-1">Sunrise</p>
  
            <p class="title-1">${getTime(sunriseUnixUTC, timezone)}</p>
          </div>
        </div>
  
        <div class="card-item">
          <span class="m-icon">clear_night</span>
  
          <div>
            <p class="label-1">Sunset</p>
  
            <p class="title-1">${getTime(sunsetUnixUTC, timezone)}</p>
          </div>
        </div>
  
      </div>
    `;

    const humidityParagraph = document.querySelector('[data-humidity]');
    humidityParagraph.innerHTML = `${humidity}<sub>%</sub>`;

    const pressureParagraph = document.querySelector('[data-pressure]');
    pressureParagraph.innerHTML = `${pressure}<sub>hPa</sub>`;
    
    const visibilityParagraph = document.querySelector('[data-visibility]');
    visibilityParagraph.innerHTML = `${visibility / 1000}<sub>km</sub>`;
    
    const feelsLikeParagraph = document.querySelector('[data-feels-like]');
    feelsLikeParagraph.innerHTML = `${parseInt(feels_like)}&deg;<sup>c</sup>`;
  });
}

const updateForecast = (lat, lon) => {
  getForecast(lat, lon, forecast => {
    const {list: forecastList, city: {timezone}} = forecast;

    const dailyForecastSection = document.querySelector('[data-hourly-forecast]');
    const temperatureForecastList = dailyForecastSection.querySelector('[data-temp]');
    const windForecastList = dailyForecastSection.querySelector('[data-wind]');

    temperatureForecastList.innerHTML = '';
    windForecastList.innerHTML = '';

    for (const [index, data] of forecastList.entries()) {
      if(index > 7) break;

      const {
        dt: dateTimeUnix,
        main: {temp},
        weather: [{icon, description}],
        wind: {deg: windDirection, speed: windSpeed}
      } = data;

      const tempLi = `
        <li class="slider-item">
          <div class="card card-sm slider-card">
  
            <p class="body-3">${getHours(dateTimeUnix, timezone)}</p>
  
            <img src="./assets/images/weather_icons/${icon}.png" width="48"
                 height="48" loading="lazy" alt="${description}" class="weather-icon" title="${description}">
  
            <p class="body-3">${parseInt(temp)}&deg;</p>
  
          </div>
        </li>
      `;

      const winLi = `
        <li class="slider-item">
          <div class="card card-sm slider-card">
            <p class="body-3">${getHours(dateTimeUnix, timezone)}</p>

            <img src="./assets/images/weather_icons/direction.png"
                 width="48" height="48" loading="lazy" alt=""
                 class="weather-icon" style="transform: rotate(${windDirection - 180}deg)" title="">

            <p class="body-3">${parseInt(mps_to_kmh(windSpeed))} km/h</p>
          </div>
        </li>
      `;

      temperatureForecastList.insertAdjacentHTML('beforeend', tempLi);
      windForecastList.insertAdjacentHTML('beforeend', winLi);
    }
    
    const fiveDaysForecast = document.querySelector('[data-5-day-forecast]');
    const fiveDaysForecastList = document.createElement('ul');

    fiveDaysForecast.innerHTML = '';

    for (let i = 7, len = forecastList.length; i < len; i+=8) {
      const {
        weather: [{icon, description}],
        main: {temp_max: maxTemp},
        dt_txt
      } = forecastList[i];

      const date = new Date(dt_txt);

      const listItem = `
        <li class="card-item">
          <div class="icon-wrapper">
            <img src="./assets/images/weather_icons/${icon}.png"
                 width="36" height="36" alt="${description}"
                 class="weather-icon">
    
            <span class="span">
              <p class="title-2">${parseInt(maxTemp)}&deg;</p>
            </span>
          </div>
          
          <p class="label-1">${date.getDate()} ${monthNames[date.getUTCMonth()]}</p>
    
          <p class="label-1">${weekDayNames[date.getDay()]}</p>
        </li>
      `;

      fiveDaysForecastList.insertAdjacentHTML('beforeend', listItem);
    }

    fiveDaysForecast.appendChild(fiveDaysForecastList);
  });
}

const updateAirPollution = (lat, lon) => {
  getAirPollution(lat, lon, airPollution => {
    const [{
      main: {aqi},
      components: {no2, o3, so2, pm2_5}
    }] = airPollution.list;

    const airPollutionCard = document.querySelector('[data-air-pollution]');

    airPollutionCard.innerHTML = `
      <h3 class="title-3">Air Quality Index</h3>
  
      <div class="wrapper">
  
        <span class="m-icon">air</span>
  
        <ul class="card-list">
  
          <li class="card-item">
            <p class="title-1">${pm2_5.toPrecision(2)}</p>
  
            <p class="label-1">PM<sub>2.5</sub></p>
          </li>
  
          <li class="card-item">
            <p class="title-1">${so2.toPrecision(2)}</p>
  
            <p class="label-1">SO<sub>2</sub></p>
          </li>
  
          <li class="card-item">
            <p class="title-1">${no2.toPrecision(2)}</p>
  
            <p class="label-1">NO<sub>2</sub></p>
          </li>
  
          <li class="card-item">
            <p class="title-1">${o3.toPrecision(3)}</p>
  
            <p class="label-1">O<sub>3</sub></p>
          </li>
  
        </ul>
  
      </div>
  
      <span class="badge aqi-${aqi} label-${aqi}" title="${aqiText[aqi].message}">
        ${aqiText[aqi].level}
      </span>
    `;
  });
}

export const updateWeather = (lat, lon) => {
  const currentLocationBtn = document.querySelector('[data-current-location-btn]');

  showLoading();

  if(window.location.hash === '#/current-location')
    currentLocationBtn.setAttribute('disabled', '');
  else
    currentLocationBtn.removeAttribute('disabled');

  updateAirPollution(lat, lon);
  updateForecast(lat, lon);
  updateCurrentWeatherWithHighlights(lat, lon, hideLoading);
}

export const error404 = () => {
  errorContent.style.display = 'flex';
}