// Функция для получения токена из куки
function getToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
            return value;
        }
    }
    return null;
}

// Функция для установки токена в куки
function setToken(token) {
    document.cookie = `token=${token}; path=/`;
}

// Функция для удаления токена из куки
function removeToken() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

// Функция для проверки наличия токена
function hasToken() {
    return getToken() !== null;
}

// Функция для настройки AJAX запросов с токеном
function setupAjaxWithToken() {
    $.ajaxSetup({
        beforeSend: function(xhr) {
            const token = getToken();
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        }
    });
} 