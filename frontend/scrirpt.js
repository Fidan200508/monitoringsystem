// Data Modeli (Sadələşdirilmiş Simulyasiya)
const mockPlants = [
    {
        lot_id: 1,
        field_name: "Şimal Sahəsi 1",
        species: "Pomidor",
        planting_date: "2025-05-01",
        last_watered_date: "2025-12-08",
        watering_interval: 7, // gün
        current_status: "Sağlam",
    },
    {
        lot_id: 2,
        field_name: "Cənub Sahəsi 2",
        species: "Buğda",
        planting_date: "2025-10-15",
        last_watered_date: "2025-12-05",
        watering_interval: 10,
        current_status: "Xəstəlik", // Problem
    },
    {
        lot_id: 3,
        field_name: "Qərb Sahəsi 3",
        species: "Güləbətin",
        planting_date: "2025-09-20",
        last_watered_date: "2025-12-10",
        watering_interval: 3,
        current_status: "Sağlam",
    }
];

// Cari Tarix (Simulyasiya, məs: 2025-12-13)
const today = new Date('2025-12-13');
const CRITICAL_THRESHOLD = 3; // Kritik gecikmə həddi (gün)

// Tarix Funksiyaları
const dateToString = (date) => date.toISOString().split('T')[0];
const addDays = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
};

// Vəziyyətin Hesablanması Məntiqi (Tələb 3)
const calculateWateringStatus = (lastWateredDate, interval) => {
    const lastDate = new Date(lastWateredDate);
    const plannedDate = addDays(lastDate, interval);

    // Növbəti planlaşdırılmış tarixi hesablayır
    const plannedDateString = dateToString(plannedDate);

    if (plannedDate > today) {
        return { 
            status: "Normal", 
            text: plannedDateString 
        };
    }

    // Gecikmə Məntiqi
    const overdueDays = Math.ceil((today - plannedDate) / (1000 * 60 * 60 * 24));

    if (overdueDays > CRITICAL_THRESHOLD) {
        return { 
            status: "Critical Overdue", 
            text: `Kritik Gecikmə! (${overdueDays} gün)` 
        };
    } else if (overdueDays > 0) {
        return { 
            status: "Overdue", 
            text: `Gecikib (${overdueDays} gün)` 
        };
    }

    return { 
        status: "Normal", 
        text: plannedDateString 
    };
};

// Dashboard Məlumatlarını Yükləyir
const updateDashboard = () => {
    let overdueCount = 0;
    let problemCount = 0;

    mockPlants.forEach(plant => {
        const status = calculateWateringStatus(plant.last_watered_date, plant.watering_interval).status;

        if (status === "Overdue" || status === "Critical Overdue") {
            overdueCount++;
        }

        if (plant.current_status !== "Sağlam") {
            problemCount++;
        }
    });

    // Tələb 4 - Minimum Göstəricilər
    document.getElementById('total-lots').textContent = mockPlants.length;
    document.getElementById('overdue-lots').textContent = overdueCount;
    document.getElementById('problem-lots').textContent = problemCount;
};

// Bitki Siyahısını Doldurur
const renderPlantList = () => {
    const tbody = document.querySelector('#plant-table tbody');
    tbody.innerHTML = ''; // Cədvəli təmizləyir

    mockPlants.forEach(plant => {
        const wateringInfo = calculateWateringStatus(plant.last_watered_date, plant.watering_interval);

        const row = tbody.insertRow();
        row.insertCell().textContent = `${plant.field_name} / ${plant.species}`;
        row.insertCell().textContent = plant.planting_date;
        row.insertCell().textContent = plant.last_watered_date;
        
        // Növbəti Plan
        row.insertCell().textContent = wateringInfo.status === "Normal" 
                                     ? wateringInfo.text 
                                     : dateToString(addDays(new Date(plant.last_watered_date), plant.watering_interval));

        // Suvarma Vəziyyəti Sütunu
        const statusCell = row.insertCell();
        statusCell.textContent = wateringInfo.text;
        if (wateringInfo.status === "Critical Overdue") {
            statusCell.classList.add('status-critical');
        } else if (wateringInfo.status === "Overdue") {
            statusCell.classList.add('status-overdue');
        } else {
             statusCell.classList.add('status-normal');
        }

        // Aktiv Status Sütunu
        const activeStatusCell = row.insertCell();
        activeStatusCell.textContent = plant.current_status;
        if (plant.current_status !== "Sağlam") {
            activeStatusCell.classList.add('status-sick');
        } else {
             activeStatusCell.classList.add('status-healthy');
        }

        // Əməliyyatlar Sütunu (Suvarıldı əməliyyatı - Tələb 3)
        const actionCell = row.insertCell();
        const waterBtn = document.createElement('button');
        waterBtn.textContent = 'Suvarıldı';
        waterBtn.classList.add('action-btn');
        waterBtn.onclick = () => openWateringModal(plant); // Modalı açır
        actionCell.appendChild(waterBtn);
    });
};

// Suvarma Modalını Açır
const openWateringModal = (plant) => {
    const modal = document.getElementById('watering-modal');
    document.getElementById('modal-lot-name').textContent = `${plant.field_name} - ${plant.species}`;
    modal.style.display = 'block';

    // İcra düyməsinə klikləmə hadisəsi
    document.getElementById('execute-watering-btn').onclick = () => executeWatering(plant);
};

// Suvarma İcrası Məntiqi (Tələb 3: Hadisə kimi qəbul edilir)
const executeWatering = (plant) => {
    const volume = document.getElementById('volume').value;
    
    // 1. Yeni hadisə qeyd olunur (Bu, WateringEvent cədvəlinə yazılış olardı)
    console.log(`[EVENT LOG] Lot ID: ${plant.lot_id}, Suvarıldı! Həcm: ${volume}L. Tarix: ${dateToString(today)}`);

    // 2. Mock datada son suvarma tarixini yeniləyir (Simulyasiya)
    plant.last_watered_date = dateToString(today);

    // 3. UI yenilənir
    alert(`"${plant.species}" Lotu uğurla suvarıldı. Növbəti plan yenilənəcək.`);
    document.getElementById('watering-modal').style.display = 'none';
    
    // Dashboard və siyahını yenidən yükləyir
    updateDashboard();
    renderPlantList();
};

// Modal bağlama funksionallığı
const setupModal = () => {
    const modal = document.getElementById('watering-modal');
    const closeBtn = document.querySelector('.close-button');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
};


// Tətbiqi Başlatma
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderPlantList();
    setupModal();
});