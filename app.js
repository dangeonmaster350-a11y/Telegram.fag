// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#0f0f0f');
tg.setBackgroundColor('#0f0f0f');

// Конфигурация
const ADMIN_IDS = [8512807582, 8321703339]; // Замените на реальные ID админов
const GIFT_PRICES = {
    heart: 15,
    bear: 15,
    rose: 25,
    bouquet: 50,
    ring: 100
};

const GIFTS_CONFIG = {
    heart: { emoji: '❤️', name: 'Сердце', price: 15 },
    bear: { emoji: '🧸', name: 'Мишка', price: 15 },
    rose: { emoji: '🌹', name: 'Роза', price: 25 },
    bouquet: { emoji: '💐', name: 'Букет', price: 50 },
    ring: { emoji: '💍', name: 'Кольцо', price: 100 }
};

// Состояние приложения
let state = {
    stars: 10, // Стартовый баланс
    freeSpins: 1,
    lastSpinDate: null,
    gifts: {
        heart: 0,
        bear: 0,
        rose: 0,
        bouquet: 0,
        ring: 0
    }
};

// Данные пользователя
let userData = {
    id: null,
    firstName: '',
    lastName: '',
    username: ''
};

// Загрузка состояния
function loadState() {
    const saved = localStorage.getItem('giftCasinoState');
    if (saved) {
        state = JSON.parse(saved);
    }
    checkDailySpin();
}

// Сохранение состояния
function saveState() {
    localStorage.setItem('giftCasinoState', JSON.stringify(state));
    updateUI();
}

// Проверка ежедневного спина
function checkDailySpin() {
    const today = new Date().toDateString();
    if (state.lastSpinDate !== today) {
        state.freeSpins = 1;
        state.lastSpinDate = today;
        saveState();
    }
}

// Получение данных пользователя из Telegram
function loadUserData() {
    const tgUser = tg.initDataUnsafe?.user;
    if (tgUser) {
        userData = {
            id: tgUser.id,
            firstName: tgUser.first_name || '',
            lastName: tgUser.last_name || '',
            username: tgUser.username || ''
        };
        
        document.getElementById('profileName').textContent = 
            `${userData.firstName} ${userData.lastName}`.trim() || 'Игрок';
        
        const usernameDisplay = userData.username ? 
            `@${userData.username}` : 'нет username';
        document.getElementById('profileUsername').textContent = usernameDisplay;
        
        // Показываем админ-кнопки если пользователь админ
        if (ADMIN_IDS.includes(userData.id)) {
            document.getElementById('adminButton').style.display = 'block';
            document.getElementById('adminNavBtn').style.display = 'block';
        }
    }
}

// Обновление интерфейса
function updateUI() {
    // Баланс звезд
    document.getElementById('starBalance').textContent = state.stars;
    document.getElementById('profileStars').textContent = state.stars;
    
    // Общее количество подарков
    const totalGifts = Object.values(state.gifts).reduce((a, b) => a + b, 0);
    document.getElementById('profileGifts').textContent = totalGifts;
    
    // Стоимость коллекции
    const collectionValue = calculateCollectionValue();
    document.getElementById('collectionValue').textContent = collectionValue + '⭐';
    
    // Информация о спинах
    document.getElementById('freeSpinCount').textContent = state.freeSpins;
    
    // Кнопка спина
    const spinButton = document.getElementById('spinButton');
    if (state.freeSpins > 0) {
        spinButton.textContent = 'Крутить (Бесплатно)';
        spinButton.disabled = false;
    } else if (state.stars >= 5) {
        spinButton.textContent = 'Крутить (⭐5)';
        spinButton.disabled = false;
    } else {
        spinButton.textContent = 'Крутить (⭐5)';
        spinButton.disabled = true;
    }
    
    // Обновление сеток подарков
    updateGiftsGrid();
    updateProfileGiftsGrid();
}

// Расчет стоимости коллекции
function calculateCollectionValue() {
    let total = 0;
    for (const [gift, quantity] of Object.entries(state.gifts)) {
        total += quantity * GIFT_PRICES[gift];
    }
    return total;
}

// Обновление общей сетки подарков
function updateGiftsGrid() {
    const grid = document.getElementById('giftsGrid');
    grid.innerHTML = '';
    
    for (const [giftId, config] of Object.entries(GIFTS_CONFIG)) {
        const card = document.createElement('div');
        card.className = 'gift-card';
        card.innerHTML = `
            <div class="gift-emoji">${config.emoji}</div>
            <div class="gift-name">${config.name}</div>
            <div class="gift-price">⭐${config.price}</div>
            <div class="gift-quantity">У вас: ${state.gifts[giftId] || 0}</div>
        `;
        grid.appendChild(card);
    }
}

// Обновление сетки подарков в профиле (с кнопками продажи)
function updateProfileGiftsGrid() {
    const grid = document.getElementById('profileGiftsGrid');
    grid.innerHTML = '';
    
    let hasGifts = false;
    
    for (const [giftId, quantity] of Object.entries(state.gifts)) {
        if (quantity > 0) {
            hasGifts = true;
            const config = GIFTS_CONFIG[giftId];
            const card = document.createElement('div');
            card.className = 'gift-card';
            card.innerHTML = `
                <div class="gift-emoji">${config.emoji}</div>
                <div class="gift-name">${config.name}</div>
                <div class="gift-price">⭐${config.price}</div>
                <div class="gift-quantity">${quantity} шт.</div>
                <button class="sell-button" data-gift="${giftId}">Продать за ⭐${config.price}</button>
            `;
            
            // Обработчик продажи
            const sellBtn = card.querySelector('.sell-button');
            sellBtn.addEventListener('click', () => sellGift(giftId));
            
            grid.appendChild(card);
        }
    }
    
    if (!hasGifts) {
        grid.innerHTML = '<div class="empty-state">У вас пока нет подарков</div>';
    }
}

// Продажа подарка
function sellGift(giftId) {
    if (state.gifts[giftId] > 0) {
        const price = GIFT_PRICES[giftId];
        state.gifts[giftId]--;
        state.stars += price;
        saveState();
        showNotification(`🎉 Вы продали ${GIFTS_CONFIG[giftId].name} за ${price}⭐`);
    }
}

// Вращение рулетки
function spinRoulette() {
    // Проверка возможности вращения
    if (state.freeSpins > 0) {
        state.freeSpins = 0;
    } else if (state.stars >= 5) {
        state.stars -= 5;
    } else {
        showNotification('❌ Недостаточно звезд!', 'error');
        return;
    }
    
    // Анимация
    const wheel = document.getElementById('rouletteWheel');
    wheel.classList.add('spinning');
    
    // Определение выигрыша
    const gifts = ['heart', 'bear', 'rose', 'bouquet', 'ring'];
    const randomIndex = Math.floor(Math.random() * gifts.length);
    const wonGift = gifts[randomIndex];
    
    // Добавление подарка
    state.gifts[wonGift]++;
    
    // Остановка рулетки
    setTimeout(() => {
        wheel.classList.remove('spinning');
        const gift = GIFTS_CONFIG[wonGift];
        showNotification(`🎁 Вы выиграли: ${gift.emoji} ${gift.name}!`);
        saveState();
    }, 3000);
}

// Показ уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Админ-функции
function initAdmin() {
    document.getElementById('adminAddStars').addEventListener('click', () => {
        const amount = parseInt(document.getElementById('adminStarsAmount').value);
        if (amount > 0) {
            state.stars += amount;
            saveState();
            showNotification(`✅ Выдано ${amount}⭐`);
        }
    });
    
    document.getElementById('adminAddGift').addEventListener('click', () => {
        const gift = document.getElementById('adminGiftSelect').value;
        state.gifts[gift]++;
        saveState();
        showNotification(`✅ Выдан ${GIFTS_CONFIG[gift].name}`);
    });
    
    document.getElementById('adminReset').addEventListener('click', () => {
        if (confirm('Точно сбросить весь прогресс?')) {
            state = {
                stars: 10,
                freeSpins: 1,
                lastSpinDate: new Date().toDateString(),
                gifts: {
                    heart: 0,
                    bear: 0,
                    rose: 0,
                    bouquet: 0,
                    ring: 0
                }
            };
            saveState();
            showNotification('🔄 Прогресс сброшен');
        }
    });
}

// Навигация
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === pageId) {
                    page.classList.add('active');
                }
            });
        });
    });
    
    // Кнопка админки в топбаре
    document.getElementById('adminButton').addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('admin').classList.add('active');
        document.getElementById('adminNavBtn').classList.add('active');
    });
}

// Инициализация
function init() {
    loadState();
    loadUserData();
    initNavigation();
    initAdmin();
    
    document.getElementById('spinButton').addEventListener('click', spinRoulette);
    
    updateUI();
    
    // Сохранение при закрытии
    window.addEventListener('beforeunload', saveState);
}

// Запуск
document.addEventListener('DOMContentLoaded', init);