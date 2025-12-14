class Plant {
  /**
   * Represents a single plant in the farm monitoring system.
   */
  constructor(field, plant, waterCycleDays, status = 'ok', lastWatered = new Date()) {
    this.id = Date.now() + Math.random(); 
    this.field = field;
    this.plant = plant;
    this.waterCycleDays = parseInt(waterCycleDays);
    this.status = status;
    this.lastWatered = new Date(lastWatered);
  }

  get daysSinceWatering() {
    const now = new Date();
    const diffTime = Math.abs(now - this.lastWatered);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  get needsWatering() {
    return this.daysSinceWatering > this.waterCycleDays;
  }

  get healthStatus() {
    if (this.status === "problem") return "problem";
    if (this.needsWatering) return "overdue";
    return "ok";
  }
}


class FarmApp {
  constructor() {
    // plants and history are loaded from storage
    this.plants = this.loadState('farmPlants', (p) => new Plant(p.field, p.plant, p.waterCycleDays, p.status, new Date(p.lastWatered)));
    this.plantHistory = this.loadState('farmHistory', (h) => h); // History is simple array of objects
    this.currentPlantId = null; // Track which plant is open in the modal
    
    this.initEventListeners();
    this.updateDashboard();
    this.renderPlants();
  }

  // --- State Management ---
  saveState() {
    localStorage.setItem('farmPlants', JSON.stringify(this.plants));
    localStorage.setItem('farmHistory', JSON.stringify(this.plantHistory));
  }

  loadState(key, transformer) {
    const state = localStorage.getItem(key);
    if (state) {
      return JSON.parse(state).map(transformer);
    }
    return key === 'farmPlants' ? [] : [];
  }
  
  logEvent(plantId, type, details = {}) {
    this.plantHistory.push({
      id: plantId,
      timestamp: new Date().toISOString(),
      type: type, // e.g., 'watered', 'problem', 'edited', 'imported'
      details: details 
    });
    this.saveState();
  }

  // --- UI Utilities ---
  initEventListeners() {
    // FIX APPLIED HERE: Use closest() to reliably find the button and its data-page attribute
    document.querySelectorAll(".nav-button").forEach(button => {
      button.onclick = (e) => {
        const targetButton = e.target.closest('.nav-button'); 
        if (targetButton) {
            this.showPage(targetButton.dataset.page);
        }
      };
    });
  }

  showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav-button").forEach(b => b.classList.remove("active"));
    // Ensure the correct button is highlighted, matching the data-page attribute
    const activeNavButton = document.querySelector(`.nav-button[data-page="${pageId}"]`);
    if (activeNavButton) {
        activeNavButton.classList.add("active");
    }

    if (pageId === 'fields') this.renderPlants(); 
    // This ensures the summary page is rendered when navigated to
    if (pageId === 'fieldSummary') this.renderFieldSummary();
  }

  // --- Plant Management ---
  addPlant() {
    const field = document.getElementById("fieldName").value.trim();
    const plantType = document.getElementById("plantName").value.trim();
    const waterCycleDays = document.getElementById("waterCycleDays").value;

    if (!field || !plantType) return;

    const newPlant = new Plant(field, plantType, waterCycleDays);
    this.plants.push(newPlant);
    this.logEvent(newPlant.id, 'added', { field, plantType, waterCycleDays });

    // Clear inputs
    document.getElementById("fieldName").value = "";
    document.getElementById("plantName").value = "";

    this.saveState();
    this.renderPlants();
    this.updateDashboard();
  }
  
  markWatered(plantId) {
    const plant = this.plants.find(p => p.id === plantId);
    if (plant) {
      plant.lastWatered = new Date();
      plant.status = 'ok';
      this.logEvent(plantId, 'watered', { by: 'manual' });
      this.saveState();
      this.renderPlants();
      this.updateDashboard();
      
      if (this.currentPlantId === plantId) {
          this.showDetailModal(plantId);
      }
    }
  }

  autoWaterOverdue() {
    const overduePlants = this.plants.filter(p => p.healthStatus === "overdue");
    let count = 0;
    
    overduePlants.forEach(plant => {
        plant.lastWatered = new Date();
        plant.status = 'ok';
        this.logEvent(plant.id, 'watered', { by: 'auto' });
        count++;
    });

    this.saveState();
    this.updateDashboard();
    this.renderPlants();
    
    const resultBox = document.getElementById("autoWaterResult");
    resultBox.textContent = `✅ Successfully watered ${count} overdue plants!`;
    resultBox.style.display = 'block';
    setTimeout(() => resultBox.style.display = 'none', 3000);
  }

  // --- Rendering Functions ---
  renderPlants() {
    const list = document.getElementById("plantList");
    const search = document.getElementById("searchPlants").value.toLowerCase();
    const sortValue = document.getElementById("sortPlants").value;

    let filteredPlants = this.plants.filter(p =>
      p.plant.toLowerCase().includes(search) || p.field.toLowerCase().includes(search)
    );

    // Sorting logic
    filteredPlants.sort((a, b) => {
      const [key, order] = sortValue.split('_');
      let comparison = 0;

      if (key === 'plant') comparison = a.plant.localeCompare(b.plant);
      else if (key === 'field') comparison = a.field.localeCompare(b.field);
      else if (key === 'lastWatered') comparison = a.lastWatered.getTime() - b.lastWatered.getTime();
      else if (key === 'status') comparison = this.getStatusWeight(b.healthStatus) - this.getStatusWeight(a.healthStatus);
      
      return order === 'asc' ? comparison : -comparison;
    });

    list.innerHTML = filteredPlants.length === 0 
      ? '<li class="empty-list">No plants found. Try adding one or adjusting filters.</li>'
      : filteredPlants.map(p => this.createPlantListItem(p)).join('');
  }
  
  getStatusWeight(status) {
      if (status === 'problem') return 3;
      if (status === 'overdue') return 2;
      return 1;
  }

  createPlantListItem(p) {
    const statusClass = p.healthStatus;
    const statusText = statusClass === 'problem' ? 'Problem' : (statusClass === 'overdue' ? 'Overdue' : 'OK');
    const daysText = statusClass === 'ok' 
      ? `Water in ${p.waterCycleDays - p.daysSinceWatering + 1} days (Cycle: ${p.waterCycleDays})` 
      : `${p.daysSinceWatering} days since last water (Cycle: ${p.waterCycleDays})`;
    const icon = statusClass === 'problem' ? 'exclamation-triangle' : (statusClass === 'overdue' ? 'hourglass-end' : 'check-circle');

    return `
      <li class="plant-item ${statusClass}">
        <div>
          <strong>${p.plant}</strong> in Field ${p.field}
          <span class="detail-text">(${daysText})</span>
        </div>
        <div class="status-container">
          <span class="status status-${statusClass}"><i class="fas fa-${icon}"></i> ${statusText}</span>
          <button class="water-button" onclick="farmApp.markWatered(${p.id})"><i class="fas fa-hand-holding-water"></i> Water</button>
          <button class="detail-button" onclick="farmApp.showDetailModal(${p.id})"><i class="fas fa-info-circle"></i> Details</button>
        </div>
      </li>
    `;
  }

  updateDashboard() {
    const problemPlants = this.plants.filter(p => p.healthStatus === "problem").length;
    const overduePlants = this.plants.filter(p => p.healthStatus === "overdue").length;

    document.getElementById("totalPlants").textContent = this.plants.length;
    document.getElementById("problemPlants").textContent = problemPlants;
    document.getElementById("overduePlants").textContent = overduePlants;

    const waterCard = document.querySelector('.stat-water');
    if (overduePlants > 0) {
        waterCard.classList.add('urgent');
    } else {
        waterCard.classList.remove('urgent');
    }
  }
  
  // --- Modal & Detail Functions ---
  showDetailModal(plantId) {
    const plant = this.plants.find(p => p.id === plantId);
    if (!plant) return;

    this.currentPlantId = plantId;
    const modalBody = document.getElementById("modalBody");
    const historyList = document.getElementById("historyList");
    
    // Plant Detail Form
    modalBody.innerHTML = `
        <form id="editPlantForm">
            <div class="modal-field">
                <label for="modalFieldName">Field Name:</label>
                <input id="modalFieldName" value="${plant.field}" required />
            </div>
            <div class="modal-field">
                <label for="modalPlantName">Plant Type:</label>
                <input id="modalPlantName" value="${plant.plant}" required />
            </div>
            <div class="modal-field">
                <label for="modalWaterCycleDays">Water Cycle (Days):</label>
                <select id="modalWaterCycleDays" required>
                    <option value="1">1 Day</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                </select>
            </div>
            <p><strong>Last Watered:</strong> ${new Date(plant.lastWatered).toLocaleString()}</p>
            <p><strong>Current Status:</strong> <span class="status status-${plant.healthStatus}">${plant.healthStatus.toUpperCase()}</span></p>
            <button type="button" onclick="farmApp.updatePlant(${plant.id})"><i class="fas fa-save"></i> Save Changes</button>
            <button type="button" class="problem-toggle-button" onclick="farmApp.toggleProblemStatus(${plant.id})">
                <i class="fas fa-biohazard"></i> ${plant.status === 'problem' ? 'Clear Problem' : 'Mark as Problem'}
            </button>
        </form>
    `;
    
    // Set the correct option in the select dropdown
    document.getElementById("modalWaterCycleDays").value = plant.waterCycleDays;

    // History Log
    const history = this.plantHistory
        .filter(h => h.id === plantId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Newest first

    historyList.innerHTML = history.length > 0 ? history.map(h => 
        `<li>[${new Date(h.timestamp).toLocaleTimeString()}] <strong>${h.type.toUpperCase()}</strong> ${h.details.by ? `(by ${h.details.by})` : ''}</li>`
    ).join('') : '<li>No recorded history for this plant.</li>';

    document.getElementById("plantDetailModal").style.display = "flex";
  }

  closeModal() {
    this.currentPlantId = null;
    document.getElementById("plantDetailModal").style.display = "none";
  }

  updatePlant(plantId) {
    const plant = this.plants.find(p => p.id === plantId);
    if (!plant) return;

    const newField = document.getElementById("modalFieldName").value.trim();
    const newType = document.getElementById("modalPlantName").value.trim();
    const newCycle = parseInt(document.getElementById("modalWaterCycleDays").value);

    // Track changes
    const changes = {};
    if (plant.field !== newField) changes.field = { old: plant.field, new: newField };
    if (plant.plant !== newType) changes.type = { old: plant.plant, new: newType };
    if (plant.waterCycleDays !== newCycle) changes.cycle = { old: plant.waterCycleDays, new: newCycle };

    if (Object.keys(changes).length > 0) {
        plant.field = newField;
        plant.plant = newType;
        plant.waterCycleDays = newCycle;
        this.logEvent(plantId, 'edited', { changes });
        this.saveState();
        this.renderPlants();
    }
    this.closeModal();
  }
  
  toggleProblemStatus(plantId) {
    const plant = this.plants.find(p => p.id === plantId);
    if (!plant) return;
    
    if (plant.status === 'problem') {
        plant.status = 'ok';
        this.logEvent(plantId, 'problem_cleared');
    } else {
        plant.status = 'problem';
        this.logEvent(plantId, 'problem_marked');
    }
    
    this.saveState();
    this.renderPlants();
    this.updateDashboard();
    this.closeModal();
  }


  // --- Field Summary Functions ---
  renderFieldSummary() {
    const container = document.getElementById("fieldSummaryContent");
    container.innerHTML = '';
    
    const fieldMap = this.plants.reduce((acc, plant) => {
        if (!acc[plant.field]) {
            acc[plant.field] = { total: 0, overdue: 0, problem: 0, lastWatered: null };
        }
        
        acc[plant.field].total++;
        if (plant.healthStatus === 'overdue') acc[plant.field].overdue++;
        if (plant.healthStatus === 'problem') acc[plant.field].problem++;
        
        // Track oldest water date for the field
        if (!acc[plant.field].lastWatered || plant.lastWatered.getTime() < acc[plant.field].lastWatered.getTime()) {
            acc[plant.field].lastWatered = plant.lastWatered;
        }
        
        return acc;
    }, {});
    
    if (Object.keys(fieldMap).length === 0) {
        container.innerHTML = '<p class="empty-list">No fields registered yet.</p>';
        return;
    }

    // Render summary cards
    for (const fieldName in fieldMap) {
        const data = fieldMap[fieldName];
        const status = data.problem > 0 ? 'problem' : (data.overdue > 0 ? 'overdue' : 'ok');
        
        container.innerHTML += `
            <div class="field-summary-card status-${status}">
                <h3><i class="fas fa-square-root-alt"></i> Field: ${fieldName}</h3>
                <p>Total Plants: <strong>${data.total}</strong></p>
                <p class="summary-overdue">Overdue Watering: <strong>${data.overdue}</strong></p>
                <p class="summary-problem">Problem Plants: <strong>${data.problem}</strong></p>
                <p class="detail-text">Oldest Plant Watered: ${new Date(data.lastWatered).toLocaleDateString()}</p>
            </div>
        `;
    }
  }


  // --- JSON Import (Slightly improved logging) ---
  importJSON() {
    const text = document.getElementById("jsonInput").value;
    const resultBox = document.getElementById("importResult");
    let successfulImports = 0;

    try {
      const data = JSON.parse(text);

      if (!Array.isArray(data)) throw new Error("JSON must be an array of event objects.");

      data.forEach(item => {
        if (!item.field || !item.plantType || !item.date) return;

        let existingPlant = this.plants.find(p => p.field === item.field && p.plant === item.plantType);
        
        if (existingPlant) {
          if (item.event === "problem") {
            existingPlant.status = "problem";
            this.logEvent(existingPlant.id, 'problem_reported', { source: 'import' });
          } else if (item.event === "water") {
            existingPlant.lastWatered = new Date(item.date);
            existingPlant.status = 'ok';
            this.logEvent(existingPlant.id, 'watered', { source: 'import', date: item.date });
          }
        } else {
          // New plant created during import
          const newPlant = new Plant(
            item.field,
            item.plantType,
            3, // Default cycle for imported unknown plants
            item.event === "problem" ? "problem" : "ok",
            new Date(item.date)
          );
          this.plants.push(newPlant);
          this.logEvent(newPlant.id, 'added', { source: 'import', initialDate: item.date });
        }
        successfulImports++;
      });

      this.saveState();
      this.renderPlants();
      this.updateDashboard();
      resultBox.textContent = `✅ Import successful: Processed ${successfulImports} records.`;

    } catch (e) {
      resultBox.textContent = `❌ Import Error: ${e.message || "Invalid JSON format"}`;
    }
  }
}

// Initialize the application when the script loads
const farmApp = new FarmApp();

// Global listener for modal closure (using escape key)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        farmApp.closeModal();
    }
});