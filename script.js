document.addEventListener('DOMContentLoaded', function() {
    const plantsGrid = document.getElementById('plantsGrid');
    const addPlantBtn = document.getElementById('addPlantBtn');
    const addPlantModal = document.getElementById('addPlantModal');
    const plantHistoryModal = document.getElementById('plantHistoryModal');
    const settingsModal = document.getElementById('settingsModal');
    const addPlantForm = document.getElementById('addPlantForm');
    const closeButtons = document.querySelectorAll('.close-btn');
    const settingsBtn = document.getElementById('settingsBtn');
    const wateringHistory = document.getElementById('wateringHistory');
    const historyPlantName = document.getElementById('historyPlantName');
    const markWateredBtn = document.getElementById('markWateredBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const profilePics = document.querySelectorAll('.profile-pic');
    const notification = document.getElementById('notification');
    
    const deletePlantBtn = document.createElement('button');
    deletePlantBtn.textContent = 'Удалить растение';
    deletePlantBtn.className = 'btn btn-danger';
    deletePlantBtn.style.marginTop = '15px';
    markWateredBtn.parentNode.insertBefore(deletePlantBtn, markWateredBtn.nextSibling);

    let currentPlantId = null;
    let plants = JSON.parse(localStorage.getItem('plants')) || [];
    let profilePictureId = localStorage.getItem('profilePictureId') || '1';
    let lastWateringDates = JSON.parse(localStorage.getItem('lastWateringDates')) || {};
    
    function init() {
        // Очищаем данные о несуществующих растениях
        cleanupWateringDates();
        renderPlants();
        checkWateringTime();
        setProfilePicture(profilePictureId);
        setInterval(checkWateringTime, 6 * 60 * 60 * 1000);
    }
    
    // Функция для очистки данных о удаленных растениях
    function cleanupWateringDates() {
        const plantNames = plants.map(plant => plant.name);
        const cleanedDates = {};
        
        for (const plantName in lastWateringDates) {
            if (plantNames.includes(plantName)) {
                cleanedDates[plantName] = lastWateringDates[plantName];
            }
        }
        
        lastWateringDates = cleanedDates;
        saveWateringDates();
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
            
            const needsWatering = nextWatering && new Date() > nextWatering;
            const wateringCheck = canWaterPlant(plant);
            
            let statusText = '';
            
            if (!wateringCheck.canWater) {
                statusText = '<div class="plant-status">Недавно полито</div>';
            }
            
            plantCard.innerHTML = `
                <div class="plant-icon">🌼</div>
                <div class="plant-name">${plant.name}</div>
                <div class="watering-info">
                    ${lastWatered ? 
                        `Последний полив: ${formatDate(lastWatered)}<br>
                         Следующий полив: ${formatDate(nextWatering)}` : 
                        'Еще не поливалось'}
                </div>
                ${statusText}
            `;
            
            if (needsWatering) {
                plantCard.style.border = '2px solid #e74c3c';
                plantCard.style.background = '#ffebee';
            } else if (!wateringCheck.canWater) {
                plantCard.style.border = '2px solid #ff9800';
                plantCard.style.background = '#fff3e0';
            }
            
            plantCard.addEventListener('click', () => openPlantHistory(index));
            plantsGrid.appendChild(plantCard);
        });
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('ru-RU');
    }
    
    function openPlantHistory(plantId) {
        currentPlantId = plantId;
        const plant = plants[plantId];
        historyPlantName.textContent = `История поливов: ${plant.name}`;
        wateringHistory.innerHTML = '';
        
        if (plant.wateringHistory && plant.wateringHistory.length > 0) {
            plant.wateringHistory.forEach(record => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.textContent = formatDate(new Date(record));
                wateringHistory.appendChild(historyItem);
            });
        } else {
            wateringHistory.innerHTML = '<p>Нет записей о поливе</p>';
        }
        
        plantHistoryModal.style.display = 'flex';
    }
    
    deletePlantBtn.addEventListener('click', function() {
        if (currentPlantId !== null) {
            const plantName = plants[currentPlantId].name;
            if (confirm(`Вы уверены, что хотите удалить растение "${plantName}"?`)) {
                // Удаляем данные о поливе этого растения
                delete lastWateringDates[plantName];
                saveWateringDates();
                
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
        
        // Проверяем, есть ли запись о поливе для этого конкретного растения
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
    
    function saveWateringDates() {
        localStorage.setItem('lastWateringDates', JSON.stringify(lastWateringDates));
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
            
            // Сохраняем дату полива для этого конкретного растения
            lastWateringDates[plant.name] = now.toDateString();
            saveWateringDates();
            
            if (!plant.wateringHistory) {
                plant.wateringHistory = [];
            }
            
            plant.wateringHistory.push(now.toISOString());
            localStorage.setItem('plants', JSON.stringify(plants));
            renderPlants();
            plantHistoryModal.style.display = 'none';
            showNotification(`Растение "${plant.name}" полито!`);
        }
    });
    
    function checkWateringTime() {
        plants.forEach(plant => {
            if (plant.lastWatered) {
                const lastWatered = new Date(plant.lastWatered);
                const nextWatering = new Date(lastWatered.getTime() + plant.wateringInterval * 24 * 60 * 60 * 1000);
                if (new Date() > nextWatering) {
                    showNotification(`Растение "${plant.name}" нуждается в поливе!`);
                }
            }
        });
    }
    
    function showNotification(message, type = 'info') {
        notification.textContent = message;
        notification.style.display = 'block';
        
        if (type === 'warning') {
            notification.style.backgroundColor = '#ff9800';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#f44336';
        } else {
            notification.style.backgroundColor = '#4CAF50';
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
        });
    });
    
    addPlantForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const plantName = document.getElementById('plantName').value;
        const wateringInterval = parseInt(document.getElementById('wateringInterval').value);
        if (plantName && wateringInterval) {
            // Проверяем, нет ли уже растения с таким именем
            const existingPlantIndex = plants.findIndex(p => p.name === plantName);
            
            if (existingPlantIndex !== -1) {
                showNotification(`Растение с именем "${plantName}" уже существует!`, 'warning');
                return;
            }
            
            plants.push({
                name: plantName,
                wateringInterval: wateringInterval,
                lastWatered: null,
                wateringHistory: []
            });
            
            localStorage.setItem('plants', JSON.stringify(plants));
            renderPlants();
            addPlantForm.reset();
            addPlantModal.style.display = 'none';
            showNotification(`Растение "${plantName}" добавлено!`);
        }
    });
    
    profilePics.forEach(pic => {
        pic.addEventListener('click', function() {
            profilePics.forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
            profilePictureId = this.dataset.id;
        });
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
    });
    
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