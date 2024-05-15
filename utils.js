'use strict';

// API pyynnöt 

import { baseUrl, menuURL, menuURL2 } from "./links.js";



const errorMessage = {
    Message: {
        fetchError: 'Failed to fetch restaurant data. Please try again later.',
        dailyMenuError: 'Failed to fetch daily menu data.',
        weeklyMenuError: 'Failed to fetch weekly menu data.',
    },
};

function showAlert(errorKey) {
    const message = errorMessage[errorKey];
    alert(message);
}

const fetchAPI = async () => {
    try {
        const response = await fetch(`${baseUrl}`);
        if (!response.ok) {
            throw new Error(errorMessage['fetchError']);
        }
        return await response.json();
    } catch (error) {
        showAlert('fetchError');
    }
};

const fetchDailyMenuEN = async (restaurantID) => {
    try {
        const response = await fetch(`${menuURL}/${restaurantID}/en`);
        if (!response.ok) {
            throw new Error(errorMessage['dailyMenuError']);
        }
        return await response.json();
    } catch (error) {
        showAlert('dailyMenuError');
        throw error;
    }
};



const fetchWeeklyMenuEN = async (restaurantID) => {
    try {
        const response = await fetch(`${menuURL2}/${restaurantID}/en`);
        if (!response.ok) {
            throw new Error(errorMessage['weeklyMenuError']);
        }
        return await response.json();
    } catch (error) {
        showAlert('weeklyMenuError');
        throw error;
    }
};

const fetchCitiesFromAPI = async () => {
    try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
            throw new Error(errorMessage['fetchError']);
        }
        const restaurants = await response.json();

        const cities = restaurants.map(restaurant => restaurant.city);
        const uniqueCities = [...new Set(cities)];
        return uniqueCities;
    } catch (error) {
        showAlert('fetchError');
        throw error;
    }
};

export {
    fetchAPI, fetchCitiesFromAPI, fetchDailyMenuEN, fetchWeeklyMenuEN
};