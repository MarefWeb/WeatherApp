'use strict';

const apiKey = 'cdc6817198eab29de486b52bfc83e865';

export const getCurrentWeather = (lat, lon, callback) => {
  fetchData(url.currentWeather(lat, lon), callback);
}

export const getForecast = (lat, lon, callback) => {
  fetchData(url.forecast(lat, lon), callback);
}

export const getAirPollution = (lat, lon, callback) => {
  fetchData(url.airPollution(lat, lon), callback)
}

export const getLocation = (lat, lon, callback) => {
  fetchData(url.location(lat, lon), callback);
}

export const getCoordinates = (location, callback) => {
  fetchData(url.coordinates(location), callback);
}

const fetchData = (URL, callback) => {
  fetch(`${URL}&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => callback(data));
}

const url = {
  currentWeather(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/weather?${lat}&${lon}&units=metric`;
  },
  forecast(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/forecast?${lat}&${lon}&units=metric`;
  },
  airPollution(lat, lon) {
    return `http://api.openweathermap.org/data/2.5/air_pollution?${lat}&${lon}`
  },
  location(lat, lon) {
    return `http://api.openweathermap.org/geo/1.0/reverse?${lat}&${lon}&limit=5`;
  },
  coordinates(location) {
    return `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=5`;
  }
}