document.addEventListener('DOMContentLoaded', function() {
    const plantsGrid = document.getElementById('plantsGrid');
    const addPlantBtn = document.getElementById('addPlantBtn');
    const addPlantModal = document.getElementById('addPlantModal');
    const plantHistoryModal = document.getElementById('plantHistoryModal');
    const settingsModal = document.getElementById('settingsModal');
    const premiumModal = document.getElementById('premiumModal');
    const addPlantForm = document.getElementById('addPlantForm');
    const closeButtons = document.querySelectorAll('.close-btn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsAvatar = document.getElementById('settingsAvatar');
    const wateringHistory = document.getElementById('wateringHistory');
    const fertilizingHistory = document.getElementById('fertilizingHistory');
    const historyPlantName = document.getElementById('historyPlantName');
    const markWateredBtn = document.getElementById('markWateredBtn');
    const markFertilizedBtn = document.getElementById('markFertilizedBtn');
    const deletePlantBtn = document.getElementById('deletePlantBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const buyPremiumBtn = document.getElementById('buyPremiumBtn');
    const confirmPremiumBtn = document.getElementById('confirmPremiumBtn');
    const profilePics = document.querySelectorAll('.profile-pic');
    const notification = document.getElementById('notification');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    let currentPlantId = null;
    let plants = JSON.parse(localStorage.getItem('plants')) || [];
    let profilePictureId = localStorage.getItem('profilePictureId') || '1';
    let lastWateringDates = JSON.parse(localStorage.getItem('lastWateringDates')) || {};
    let lastFertilizingDates = JSON.parse(localStorage.getItem('lastFertilizingDates')) || {};
    let isPremium = localStorage.getItem('isPremium') === 'true';
    
    function init() {
        cleanupCareDates();
        renderPlants();
        checkCareTime();
        setProfilePicture(profilePictureId);
        updatePremiumUI();
        setInterval(checkCareTime, 6 * 60 * 60 * 1000);
    }
    
    function updatePremiumUI() {
        if (isPremium) {
            document.body.classList.add('premium');
            document.querySelectorAll('.premium-avatar').forEach(avatar => {
                avatar.style.opacity = '1';
                avatar.style.cursor = 'pointer';
            });
        } else {
            document.body.classList.remove('premium');
            document.querySelectorAll('.premium-avatar').forEach(avatar => {
                avatar.style.opacity = '0.5';
                avatar.style.cursor = 'not-allowed';
            });
        }
    }
    
    function activatePremium() {
        isPremium = true;
        localStorage.setItem('isPremium', 'true');
        updatePremiumUI();
        showNotification('🎉 Премиум подписка активирована!', 'info');
        settingsModal.style.display = 'none';
        premiumModal.style.display = 'none';
    }
    
    buyPremiumBtn.addEventListener('click', function() {
        premiumModal.style.display = 'flex';
    });
    
    confirmPremiumBtn.addEventListener('click', function() {
        activatePremium();
    });
    
    profilePics.forEach(pic => {
        pic.addEventListener('click', function() {
            if (this.classList.contains('premium-avatar') && !isPremium) {
                showNotification('Эта аватарка доступна только для премиум пользователей!', 'warning');
                premiumModal.style.display = 'flex';
                return;
            }
            
            profilePics.forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
            profilePictureId = this.dataset.id;
        });
    });
    
    function cleanupCareDates() {
        const plantNames = plants.map(plant => plant.name);
        const cleanedWateringDates = {};
        const cleanedFertilizingDates = {};
        
        for (const plantName in lastWateringDates) {
            if (plantNames.includes(plantName)) {
                cleanedWateringDates[plantName] = lastWateringDates[plantName];
            }
        }
        
        for (const plantName in lastFertilizingDates) {
            if (plantNames.includes(plantName)) {
                cleanedFertilizingDates[plantName] = lastFertilizingDates[plantName];
            }
        }
        
        lastWateringDates = cleanedWateringDates;
        lastFertilizingDates = cleanedFertilizingDates;
        saveCareDates();
    }
    
    function renderPlants() {
        plantsGrid.innerHTML = '';
        
        plants.forEach((plant, index) => {
            const plantCard = document.createElement('div');
            plantCard.className = 'plant-card';
            plantCard.dataset.id = index;
            
            const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;
            const nextWatering = lastWatered ? 
                new Date(lastWatered.getTime() + plant.wateringInterval * 24 * 60 * 60 * 1000) : 
                null;
            
            const lastFertilized = plant.lastFertilized ? new Date(plant.lastFertilized) : null;
            const nextFertilizing = lastFertilized ? 
                new Date(lastFertilized.getTime() + plant.fertilizingInterval * 24 * 60 * 60 * 1000) : 
                null;
            
            const needsWatering = nextWatering && new Date() > nextWatering;
            const needsFertilizing = nextFertilizing && new Date() > nextFertilizing;
            const wateringCheck = canWaterPlant(plant);
            const fertilizingCheck = canFertilizePlant(plant);
            
            let statusText = '';
            
            if (needsWatering) {
                statusText += '<div class="plant-status status-watering">💧 Нужен полив</div>';
            }
            if (needsFertilizing) {
                statusText += '<div class="plant-status status-fertilizing">🌱 Нужно удобрение</div>';
            }
            if (!wateringCheck.canWater && !needsWatering) {
                statusText += '<div class="plant-status status-recent">💧 Недавно полито</div>';
            }
            if (!fertilizingCheck.canWater && !needsFertilizing) {
                statusText += '<div class="plant-status status-recent">🌱 Недавно удобрено</div>';
            }
            
            plantCard.innerHTML = `
                <div class="plant-icon">🌼</div>
                <div class="plant-name">${plant.name}</div>
                <div class="watering-info">
                    ${lastWatered ? 
                        `Полив: ${formatDate(lastWatered)} → ${formatDate(nextWatering)}` : 
                        'Еще не поливалось'}<br>
                    ${lastFertilized ? 
                        `Удобрение: ${formatDate(lastFertilized)} → ${formatDate(nextFertilizing)}` : 
                        'Еще не удобрялось'}
                </div>
                ${statusText}
            `;
            
            if (needsWatering) {
                plantCard.style.border = '2px solid #e74c3c';
                plantCard.style.background = '#ffebee';
            } else if (needsFertilizing) {
                plantCard.style.border = '2px solid #FF9800';
                plantCard.style.background = '#fff3e0';
            } else if (!wateringCheck.canWater || !fertilizingCheck.canWater) {
                plantCard.style.border = '2px solid #2196F3';
                plantCard.style.background = '#e3f2fd';
            }
            
            plantCard.addEventListener('click', () => openPlantHistory(index));
            plantsGrid.appendChild(plantCard);
        });
        
        plantsGrid.appendChild(addPlantBtn);
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('ru-RU');
    }
    
    function openPlantHistory(plantId) {
        currentPlantId = plantId;
        const plant = plants[plantId];
        historyPlantName.textContent = `Уход за растением: ${plant.name}`;
        
        wateringHistory.innerHTML = '';
        if (plant.wateringHistory && plant.wateringHistory.length > 0) {
            plant.wateringHistory.forEach(record => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.textContent = `💧 ${formatDate(new Date(record))}`;
                wateringHistory.appendChild(historyItem);
            });
        } else {
            wateringHistory.innerHTML = '<p>Нет записей о поливе</p>';
        }
        
        fertilizingHistory.innerHTML = '';
        if (plant.fertilizingHistory && plant.fertilizingHistory.length > 0) {
            plant.fertilizingHistory.forEach(record => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.textContent = `🌱 ${formatDate(new Date(record))}`;
                fertilizingHistory.appendChild(historyItem);
            });
        } else {
            fertilizingHistory.innerHTML = '<p>Нет записей об удобрении</p>';
        }
        
        updateCareButtons();
        plantHistoryModal.style.display = 'flex';
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${tabName}History`).classList.add('active');
        });
    });
    
    function updateCareButtons() {
        if (currentPlantId !== null) {
            const plant = plants[currentPlantId];
            const wateringCheck = canWaterPlant(plant);
            const fertilizingCheck = canFertilizePlant(plant);
            
            markWateredBtn.disabled = !wateringCheck.canWater;
            markFertilizedBtn.disabled = !fertilizingCheck.canWater;
        }
    }
    
    deletePlantBtn.addEventListener('click', function() {
        if (currentPlantId !== null) {
            const plantName = plants[currentPlantId].name;
            if (confirm(`Вы уверены, что хотите удалить растение "${plantName}"?`)) {
                delete lastWateringDates[plantName];
                delete lastFertilizingDates[plantName];
                saveCareDates();
                
                plants.splice(currentPlantId, 1);
                localStorage.setItem('plants', JSON.stringify(plants));
                renderPlants();
                plantHistoryModal.style.display = 'none';
                showNotification(`Растение "${plantName}" удалено!`);
            }
        }
    });
    
    function canWaterPlant(plant) {
        const now = new Date();
        const today = now.toDateString();
        
        if (lastWateringDates[plant.name] === today) {
            return { canWater: false, reason: 'already_watered_today' };
        }
        
        if (plant.lastWatered) {
            const lastWatered = new Date(plant.lastWatered);
            const hoursSinceLastWatering = Math.floor((now - lastWatered) / (1000 * 60 * 60));
            
            if (hoursSinceLastWatering < 12) {
                return { canWater: false, reason: 'too_soon' };
            }
        }
        
        return { canWater: true };
    }
    
    function canFertilizePlant(plant) {
        const now = new Date();
        const today = now.toDateString();
        
        if (lastFertilizingDates[plant.name] === today) {
            return { canWater: false, reason: 'already_fertilized_today' };
        }
        
        if (plant.lastFertilized) {
            const lastFertilized = new Date(plant.lastFertilized);
            const hoursSinceLastFertilizing = Math.floor((now - lastFertilized) / (1000 * 60 * 60));
            
            if (hoursSinceLastFertilizing < 24) {
                return { canWater: false, reason: 'too_soon' };
            }
        }
        
        return { canWater: true };
    }
    
    function saveCareDates() {
        localStorage.setItem('lastWateringDates', JSON.stringify(lastWateringDates));
        localStorage.setItem('lastFertilizingDates', JSON.stringify(lastFertilizingDates));
    }
    
    markWateredBtn.addEventListener('click', function() {
        if (currentPlantId !== null) {
            const plant = plants[currentPlantId];
            const wateringCheck = canWaterPlant(plant);
            
            if (!wateringCheck.canWater) {
                if (wateringCheck.reason === 'already_watered_today') {
                    showNotification(`Растение "${plant.name}" уже полито сегодня!`, 'warning');
                } else if (wateringCheck.reason === 'too_soon') {
                    showNotification(`Растение "${plant.name}" поливали слишком недавно!`, 'warning');
                }
                return;
            }
            
            const now = new Date();
            plant.lastWatered = now.toISOString();
            
            lastWateringDates[plant.name] = now.toDateString();
            
            if (!plant.wateringHistory) {
                plant.wateringHistory = [];
            }
            
            plant.wateringHistory.push(now.toISOString());
            localStorage.setItem('plants', JSON.stringify(plants));
            saveCareDates();
            renderPlants();
            updateCareButtons();
            showNotification(`Растение "${plant.name}" полито!`);
        }
    });
    
    markFertilizedBtn.addEventListener('click', function() {
        if (currentPlantId !== null) {
            const plant = plants[currentPlantId];
            const fertilizingCheck = canFertilizePlant(plant);
            
            if (!fertilizingCheck.canWater) {
                if (fertilizingCheck.reason === 'already_fertilized_today') {
                    showNotification(`Растение "${plant.name}" уже удобрено сегодня!`, 'warning');
                } else if (fertilizingCheck.reason === 'too_soon') {
                    showNotification(`Растение "${plant.name}" удобряли слишком недавно!`, 'warning');
                }
                return;
            }
            
            const now = new Date();
            plant.lastFertilized = now.toISOString();
            
            lastFertilizingDates[plant.name] = now.toDateString();
            
            if (!plant.fertilizingHistory) {
                plant.fertilizingHistory = [];
            }
            
            plant.fertilizingHistory.push(now.toISOString());
            localStorage.setItem('plants', JSON.stringify(plants));
            saveCareDates();
            renderPlants();
            updateCareButtons();
            showNotification(`Растение "${plant.name}" удобрено!`, 'fertilizing');
        }
    });
    
    function checkCareTime() {
        plants.forEach(plant => {
            if (plant.lastWatered) {
                const lastWatered = new Date(plant.lastWatered);
                const nextWatering = new Date(lastWatered.getTime() + plant.wateringInterval * 24 * 60 * 60 * 1000);
                if (new Date() > nextWatering) {
                    showNotification(`Растение "${plant.name}" нуждается в поливе!`);
                }
            }
            
            if (plant.lastFertilized) {
                const lastFertilized = new Date(plant.lastFertilized);
                const nextFertilizing = new Date(lastFertilized.getTime() + plant.fertilizingInterval * 24 * 60 * 60 * 1000);
                if (new Date() > nextFertilizing) {
                    showNotification(`Растение "${plant.name}" нуждается в удобрении!`, 'fertilizing');
                }
            }
        });
    }
    
    function showNotification(message, type = 'info') {
        notification.textContent = message;
        notification.style.display = 'block';
        notification.className = 'notification';
        
        if (type === 'warning') {
            notification.classList.add('warning');
        } else if (type === 'error') {
            notification.classList.add('error');
        } else if (type === 'fertilizing') {
            notification.classList.add('fertilizing');
        } else {
            notification.classList.add('info');
        }
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
    
    addPlantBtn.addEventListener('click', function() {
        addPlantModal.style.display = 'flex';
    });
    
    settingsBtn.addEventListener('click', function() {
        settingsModal.style.display = 'flex';
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            addPlantModal.style.display = 'none';
            plantHistoryModal.style.display = 'none';
            settingsModal.style.display = 'none';
            premiumModal.style.display = 'none';
        });
    });
    
    addPlantForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const plantName = document.getElementById('plantName').value;
        const wateringInterval = parseInt(document.getElementById('wateringInterval').value);
        const fertilizingInterval = parseInt(document.getElementById('fertilizingInterval').value);
        
        if (plantName && wateringInterval && fertilizingInterval) {
            const existingPlantIndex = plants.findIndex(p => p.name === plantName);
            
            if (existingPlantIndex !== -1) {
                showNotification(`Растение с именем "${plantName}" уже существует!`, 'warning');
                return;
            }
            
            plants.push({
                name: plantName,
                wateringInterval: wateringInterval,
                fertilizingInterval: fertilizingInterval,
                lastWatered: null,
                lastFertilized: null,
                wateringHistory: [],
                fertilizingHistory: []
            });
            
            localStorage.setItem('plants', JSON.stringify(plants));
            renderPlants();
            addPlantForm.reset();
            addPlantModal.style.display = 'none';
            showNotification(`Растение "${plantName}" добавлено!`);
        }
    });
    
    saveSettingsBtn.addEventListener('click', function() {
        localStorage.setItem('profilePictureId', profilePictureId);
        setProfilePicture(profilePictureId);
        settingsModal.style.display = 'none';
        showNotification('Настройки сохранены!');
    });
    
    function setProfilePicture(id) {
        const selectedPic = document.querySelector(`.profile-pic[data-id="${id}"]`);
        if (selectedPic) {
            profilePics.forEach(p => p.classList.remove('selected'));
            selectedPic.classList.add('selected');
            settingsAvatar.src = selectedPic.src;
        }
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === addPlantModal) {
            addPlantModal.style.display = 'none';
        }
        if (e.target === plantHistoryModal) {
            plantHistoryModal.style.display = 'none';
        }
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        if (e.target === premiumModal) {
            premiumModal.style.display = 'none';
        }
    });
    
    const initialAvatar = document.querySelector(`.profile-pic[data-id="${profilePictureId}"]`);
    if (initialAvatar) {
        settingsAvatar.src = initialAvatar.src;
    }
    
    init();
    
    window.showNotification = function(plantId = 0) {
        if (plants[plantId]) {
            const plant = plants[plantId];
            showNotification(`Растение "${plant.name}" нуждается в поливе!`);
        } else {
            console.error(`Растение с ID ${plantId} не найдено`);
        }
    };
});
