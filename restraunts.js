'use strict';

import {
    restaurantModal,
    restaurantRow,
    dailyModal_en as dailyModalEN,
    weeklyModal_en as weeklyModalEN
} from "./components.js";
import {
    fetchAPI,
    fetchCitiesFromAPI,
    fetchDailyMenuEN as fetchDailyMenuEN,
    fetchWeeklyMenuEN as fetchWeeklyMenuEN
} from "./utils.js";


let ravintolat;

const getAPI = async () => {
    try {
        ravintolat = await fetchAPI('restaurants');
        displayRestaurants(ravintolat);

        document.getElementById('filterCity').addEventListener('change', () => handleFilterChange(ravintolat));
        document.getElementById('filterCompany').addEventListener('change', () => handleFilterChange(ravintolat));
        populateCities();
    } catch (error) {
        handleError(error);
    }
};

// kartassa etäisyyden laskeminen
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// näytä ravintolat
function displayRestaurants(restaurants) {
    restaurants.sort((a, b) => a.name.localeCompare(b.name));

    const table = document.querySelector('table');
    table.innerHTML = '';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            map.setView([userLat, userLon], 13);

            const redIcon = L.icon({
                iconSize: [70, 60],
            });

            const defaultIcon = L.icon({
                iconSize: [45, 45],
            });

            L.marker([userLat, userLon], { icon: redIcon })
                .addTo(map)
                .bindPopup(selectedLanguage === 'FI' ? 'Oma sijainti' : 'My location')
                .openPopup();

            let nearestRestaurant = null;
            let minDistance = Infinity;

            ravintolat.forEach((restaurant) => {
                const distance = getDistance(
                    userLat,
                    userLon,
                    restaurant.location.coordinates[1],
                    restaurant.location.coordinates[0]
                );
                if (distance < minDistance) {
                    nearestRestaurant = restaurant;
                    minDistance = distance;
                }
            });

            ravintolat.forEach((restaurant) => {
                const marker = L.marker([restaurant.location.coordinates[1], restaurant.location.coordinates[0]], { icon: defaultIcon })
                    .addTo(map);

                marker.bindPopup(
                    `<h3>${restaurant.name}</h3><p>${restaurant.address}</p>`
                );

                if (restaurant === nearestRestaurant) {
                    marker.setOpacity(0.8);
                    setInterval(() => {
                        marker.setOpacity(marker.options.opacity === 1 ? 0.5 : 1);
                    }, 500);
                    marker.openPopup();
                }
            });
        },
        (error) => {
        }
    );

    // näytetään ravintolalista
    restaurants.forEach((restaurant) => {
        const row = restaurantRow(restaurant);

        row.addEventListener('click', async () => {
            document.querySelectorAll('tr').forEach((item) => item.classList.remove('highlight'));

            row.classList.add('highlight');

            try {
                openModal(restaurant);
            } catch (error) {
                handleError(error);
            }
        });

        table.appendChild(row);
    });
}

// modaalin avaaminen
const openModal = async (restaurant) => {
    const modal = document.createElement('dialog');
    const restaurantContent = restaurantModal(restaurant);

    modal.appendChild(restaurantContent);

    const selectMenu = document.createElement('select');
    selectMenu.id = 'menuType';

    const defaultOption = document.createElement('option');
    defaultOption.className = 'default-option';
    defaultOption.value = '';
    defaultOption.textContent = selectedLanguage === 'FI' ? 'Valitse menu' : 'Choose menu';
    selectMenu.appendChild(defaultOption);

    const dailyOption = document.createElement('option');
    defaultOption.className = 'default-option';
    dailyOption.value = 'daily';
    dailyOption.textContent = selectedLanguage === 'FI' ? 'Päivän Menu' : 'Daily Menu';
    selectMenu.appendChild(dailyOption);

    const weeklyOption = document.createElement('option');
    defaultOption.className = 'default-option';
    weeklyOption.value = 'weekly';
    weeklyOption.textContent = selectedLanguage === 'FI' ? 'Viikon Menu' : 'Weekly Menu';
    selectMenu.appendChild(weeklyOption);

    modal.appendChild(selectMenu);

    document.body.appendChild(modal);

    try {
        modal.showModal();
    } catch (error) {
        handleError(error);
    }

    const translations = {
        FI: {
            close: 'Sulje',
            invalidMenuType: "Virheellinen menu-tyyppi",
        },
        EN: {
            close: 'Close',
            invalidMenuType: "Invalid menu type",
        },
        SV: {
            close: 'Stäng',
            invalidMenuType: "Ogiltig menutyp",
        }
    };

    selectMenu.addEventListener('change', async () => {
        const menuType = selectMenu.value;
        try {
            let menuContent;

            //ruotsi tai englanti sivu valittu
            const SVEN = selectedLanguage === 'SV' || selectedLanguage === 'EN';

            if (menuType === 'daily') {
                const menu = await (SVEN ? fetchDailyMenuEN : fetchDailyMenuFI)(restaurant._id);
                menuContent = SVEN ? dailyModalEN(menu) : dailyModal(menu);
            } else if (menuType === 'weekly') {
                const menu = await (SVEN ? fetchWeeklyMenuEN : fetchWeeklyMenuFI)(restaurant._id);
                menuContent = SVEN ? weeklyModalEN(menu) : weeklyModal(menu);
            } else {
                const translation = translations[selectedLanguage].invalidMenuType;
                throw new Error(translation);
            }

            modal.innerHTML = menuContent;

            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.textContent = selectedLanguage === 'FI' ? 'Sulje' : 'Close';
            closeButton.addEventListener('click', () => modal.close());

            modal.appendChild(closeButton);
        } catch (error) {
            handleError(error);
        }
    });

    const closeButton = document.createElement('button');
    closeButton.id = 'closeButton';
    closeButton.textContent = translations[selectedLanguage].close;
    closeButton.addEventListener('click', () => modal.close());

    modal.appendChild(closeButton);
};


// käsittele virheet
const handleError = (error) => {
    const errorMessage = selectedLanguage === 'FI' ? 'Tietojen hakeminen epäonnistui. Yritä uudelleen.' : 'Failed to fetch data. Please try again later.';
    alert(errorMessage);
};

// suodata ravintolat
const handleFilterChange = (restaurants) => {
    const selectedCity = document.getElementById('filterCity').value;
    const selectedCompany = document.getElementById('filterCompany').value;

    const filteredRestaurants = restaurants.filter((restaurant) => {
        const cityMatch = !selectedCity || restaurant.city === selectedCity;
        const companyMatch = !selectedCompany || restaurant.company === selectedCompany;
        return cityMatch && companyMatch;
    });

    displayRestaurants(filteredRestaurants);
};

// näytä kaupungit valikossa
const populateCities = async () => {
    const select = document.getElementById('filterCity');
    const cities = await fetchCitiesFromAPI();

    cities.forEach((city) => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
};

// etsi ravintolat
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('input[type="search"]');

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredRestaurants = ravintolat.filter((restaurant) =>
                restaurant.name.toLowerCase().includes(searchTerm)
            );
            displayRestaurants(filteredRestaurants);
        });
    }
});


getAPI();
