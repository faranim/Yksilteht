const map = L.map('map');
map.locate({setView: true, maxZoom: 16});
map.on('locationfound', function (e) {
    map.setView(e.latlng, 10);
    const myIcon = L.icon({
        iconUrl: 'Resources/UserLocationIcon.png',
        iconSize: [41, 41],
        iconAnchor: [12, 41],
        popupAnchor: [8, -41]
    });
    L.marker(e.latlng, {icon: myIcon}).addTo(map).bindPopup("Your location");
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright"></a>',
}).addTo(map);

const loginButton = document.getElementById("login-link");
const returnButtonLogin = document.getElementById("submitlogin");
const registerButton = document.getElementById("register-link");
const returnButtonRegister = document.getElementById("submitregister");
const logoutButton = document.getElementById("logoutbutton");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const headerElement = document.querySelector("header");
const bodyElement = document.querySelector("body");
const htmlElement = document.querySelector("html");
const boxElement = document.querySelectorAll(".box");
const logo = document.getElementById("logo");
const info = document.getElementsByClassName('userinfo');
const dialog = document.querySelector('dialog');

document.addEventListener('DOMContentLoaded', async function () {
    await getUserLocation();
    await getRestaurants();
    await userCheck();
});

loginForm.addEventListener('submit', async function (event) {
    await login(event);
});

registerForm.addEventListener('submit', async function (event) {
    await register(event);
});

logoutButton.addEventListener('click', function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        loginButton.style.display = 'block';
        registerButton.style.display = 'block';
        logoutButton.style.display = 'none';
    }
);


loginButton.onclick = function () {
    loginForm.style.display = 'block';
    loginButton.style.display = 'none';
    registerButton.style.display = 'none';
};

registerButton.onclick = function () {
    registerForm.style.display = 'block';
    loginButton.style.display = 'none';
    registerButton.style.display = 'none';
};

returnButtonRegister.onclick = function () {
    registerForm.style.display = 'none';
    loginButton.style.display = 'block';
    registerButton.style.display = 'block';
    info.style.display = 'none';
    registerForm.reset();
};

returnButtonLogin.onclick = function () {
    loginForm.style.display = 'none';
    loginButton.style.display = 'block';
    registerButton.style.display = 'block';
    info.style.display = 'none';
    loginForm.reset();
};

async function getUserLocation() {
    if ("geolocation" in navigator) {
        await navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeather(lat, lon);
        });
    }
}

function markerClick(item, id,) {
    dialog.innerHTML = `
    <h1>${item.name}</h1>
    <p>${item.address}, ${item.postalCode}, ${item.city}</p>
    <form method="dialog">
    <button class="button">Sulje</button>
    <button class="button" id="menuButtonDay">Päivän menu</button>
    <button class="button" id="menuButtonWeek">Viikon menu</button>
    <button class="button" id="favoriteRes">Aseta suosikiksi</button>
    </form>`;
    dialog.showModal();
    const menuButtonDay = document.querySelector('#menuButtonDay');
    const menuButtonWeek = document.querySelector('#menuButtonWeek');
    const favorite = document.querySelector('#favoriteRes');

    menuButtonDay.addEventListener('click', function (){
        dayOrWeek = 'daily';
        getMenu(id, dayOrWeek);
    });

    menuButtonWeek.addEventListener('click', function (){
        dayOrWeek = 'weekly';
        getMenu(id, dayOrWeek);
    });

    favorite.addEventListener('click', async function() {
        console.log(id);
        await setFavoriteRestaurant(id);
        location.reload();
    });
}

async function getRestaurants() {
    const url = "https://10.120.32.94/restaurant/api/v1/restaurants/";
    try {
        const response = await fetch(url);
        const data = await response.json();
        data.forEach(item => {
            const coordinates = item.location.coordinates;
            const latitude = coordinates[0];
            const longitude = coordinates[1];
            const id = item._id;
            const marker = L.marker([longitude, latitude], {restaurantId: id}).addTo(map);
            marker.on('click', () => markerClick(item, id));
        });
    } catch (error) {
        console.log(error);
    }
}
async function getMenu(id, dayOrWeek) {
    const url = `https://10.120.32.94/restaurant/api/v1/restaurants/${dayOrWeek}/${id}/}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const menuDiv = document.getElementById("restaurantMenu");
        menuDiv.innerHTML = '';
        if (data.days && Array.isArray(data.days) && data.days.length > 0) {
            data.days.forEach(day => {
                const dayElement = document.createElement('h3');
                dayElement.style.color = 'white';
                dayElement.style.fontWeight = 'bold';
                dayElement.style.textDecoration = 'underline';
                dayElement.textContent = day.date;
                menuDiv.appendChild(dayElement);
                day.courses.forEach(course => {
                    const courseElement = document.createElement('p');
                    const priceText = course.price ? `: ${course.price}` : '';
                    courseElement.textContent = `${course.name}${priceText}`;
                    if (!isLight) {
                        courseElement.style.color = 'white';
                    } else {
                        courseElement.style.color = 'black';
                    }
                    menuDiv.appendChild(courseElement);
                });
            });
        } else if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
            data.courses.forEach(item => {
                const menuItem = document.createElement('p');
                const priceText = item.price ? `: ${item.price}` : '';
                menuItem.textContent = `${item.name}${priceText}`;
                if (!isLight) {
                    menuItem.style.color = 'white';
                } else {
                    menuItem.style.color = 'black';
                }
                menuDiv.appendChild(menuItem);
            });
        }
    } catch (error) {
        console.log(error);
    }
}

async function login(event) {
    event.preventDefault();
    const loginInput = document.getElementById("loginusername");
    const loginInputPassword = document.getElementById("loginpassword");
    const loginValue = loginInput.value;
    const loginValuePassword = loginInputPassword.value;
    const userDetails = {
        username: loginValue,
        password: loginValuePassword,
    };

    try {
        const response = await fetch("https://10.120.32.94/restaurant/api/v1/auth/login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userDetails)
        });

        if (!response.ok) {
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        loginButton.style.display = 'none';
        registerButton.style.display = 'none';
        loginForm.style.display = 'none';
        logoutButton.style.display = 'block';
        const userDiv = document.getElementById("userInfo");
        const userData = document.createElement('p');
        const fRes = document.createElement('p');
        if (data && data.data) {
            userData.textContent = `Tervetuloa, ${data.data.username}`;
            userData.style.color = 'white';
            const fId = data.data.favouriteRestaurant;
            const suosikki =  await getSuosikki(fId);
            console.log(suosikki);
            fRes.textContent = 'Suosikki ravintola: ' + suosikki.name;
            fRes.style.color = 'white';
        }
        userDiv.textContent = '';
        userDiv.appendChild(userData);
        userDiv.appendChild(fRes);
    } catch (error) {
        const userDiv = document.getElementById("userInfo");
        const userData = document.createElement('p');
        userData.textContent = 'Virheellinen käyttäjänimi tai salasana!';
        userData.style.color = 'red';
        userDiv.textContent = '';
        userDiv.appendChild(userData);
    }
}

async function register(event) {
    event.preventDefault();
    const registerInputUsername = document.getElementById("registerusername");
    const registerValueUsername = registerInputUsername.value;
    const registerInputPassword = document.getElementById("registerpassword");
    const registerValuePassword = registerInputPassword.value;
    const registerInputEmail = document.getElementById("registeremail");
    const registerValueEmail = registerInputEmail.value;

    const data = {
        body: JSON.stringify({
            username: registerValueUsername,
            password: registerValuePassword,
            email: registerValueEmail,
        }),
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
    }

    try {
        const response = await fetch("https://10.120.32.94/restaurant/api/v1/users", data);
        console.log(response);
        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        loginButton.style.display = 'none';
        registerButton.style.display = 'none';
        registerForm.style.display = 'none';
        logoutButton.style.display = 'block';
        const userDiv = document.getElementById("userInfo");
        const userData = document.createElement('p');
        if (data && data.data) {
            userData.textContent = `Tervetuloa, ${registerValueUsername}`;
            userData.style.color = 'white';
        }
        userDiv.textContent = '';
        userDiv.appendChild(userData);
    } catch (error) {
        console.log(error);
        const userDiv = document.getElementById("userInfo");
        const userData = document.createElement('p');
        userData.textContent = 'Rekisteröityminen epäonnistui!';
        userData.style.color = 'red';
        userDiv.textContent = '';
        userDiv.appendChild(userData);
    }
}

async function userCheck() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
        loginButton.style.display = 'none';
        registerButton.style.display = 'none';
        const userData = document.createElement('p');
        const fRes = document.createElement('p');
        userData.textContent = `Tervetuloa, ${user.username}`;
        userData.style.color = 'white';
        const fId = user.favouriteRestaurant;
        const suosikki =  await getSuosikki(fId);
        console.log(suosikki);
        fRes.textContent = 'Suosikki ravintola: ' + suosikki.name;
        fRes.style.color = 'white';
        info.appendChild(userData);
        info.appendChild(fRes);
        logoutButton.style.display = 'block';
    }
}