'use strict';

const addToFavorites = (restaurant) => {
    const selectedLanguage = getSelectedLanguage();

    const token = localStorage.getItem("authToken");
    if (!token) {
        alert(translations[selectedLanguage].alertLogin);
        return;
    }

    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    const parsedPayload = JSON.parse(payload);

    const userId = parsedPayload.user_id;

    const favoritesKey = `favorites_${userId}`;
    const favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
    const isFavorite = favorites.some((fav) => fav.name === restaurant.name);

    if (!isFavorite) {
        favorites.push(restaurant);
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
        alert(translations[selectedLanguage].added(restaurant.name));
    } else {
        alert(translations[selectedLanguage].alreadyFavorite(restaurant.name));
    }
};

const restaurantRow = (restaurant) => {
    const { name, address } = restaurant;

    const row = document.createElement('tr');

    row.innerHTML = `<td>${name}</td><td>${address}</td>`;

    const favoriteButton = document.createElement('button');
    favoriteButton.id = 'favoriteButton';
    favoriteButton.textContent = '♥︎';
    favoriteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        addToFavorites(restaurant);
    });

    const actionCell = document.createElement('td');
    actionCell.appendChild(favoriteButton);
    row.appendChild(actionCell);

    return row;
};

const restaurantModal = (restaurant) => {
    const { name, address, postalCode, city, phone, company } = restaurant;

    const modalContent = document.createElement('div');
    modalContent.innerHTML = `<p>Nimi: ${name}</p><p>Osoite: ${address}</p><p>Postinumero: ${postalCode}</p>
    <p>Kaupunki: ${city}</p><p>Puhelinnumero: ${phone}</p><p>Yritys: ${company}</p>`;

    return modalContent;
};




const dailyModal_en = (menuDaily) => {
    let menuHTML;
    const { courses } = menuDaily;
    const dailyMenuHTML = courses.map(course => {
        const name = course.name !== undefined ? course.name : "No name";
        const price = course.price !== undefined ? course.price : "-";
        const diets = course.diets !== undefined ? course.diets : "-";
        return `<li class="menu-item">${name}: ${price} ${diets}</li>`;
    }).join('');
    menuHTML = `<h4>Daily Menu</h4><ul class="menu-list">${dailyMenuHTML}</ul>`;

    return menuHTML;
};



const weeklyModal_en = (menuWeekly) => {
    let menuHTML;

    const { days } = menuWeekly;
    const weeklyMenuHTML = days.map(day => {
        const coursesHTML = day.courses.map(course => {
            const name = course.name !== undefined ? course.name : "No name";
            const price = course.price !== undefined ? course.price : "-";
            const diets = course.diets !== undefined ? course.diets : "-";
            return `<li class="menu-item">${name}: ${price} ${diets}</li>`;
        }).join('');
        return `<li class="menu-day">${day.date}: <ul class="menu-list">${coursesHTML}</ul></li>`;
    }).join('');
    menuHTML = `<h4>Viikon Menu</h4><ul class="menu-list">${weeklyMenuHTML}</ul>`;

    return menuHTML;
};

export { weeklyModal_en, dailyModal_en, restaurantModal, restaurantRow };