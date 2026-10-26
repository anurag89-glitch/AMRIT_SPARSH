// js/patient-TraceNet.js
const API_BASE = "http://127.0.0.1:8000";

// Search DOM
const input = document.getElementById("search-input");
const list = document.getElementById("patient-list");
const empty = document.getElementById("empty-state");

// Visitor DOM
const visitorSection = document.getElementById("visitor-section");
const visitorList = document.getElementById("visitor-list");

const addVisitorBtn = document.getElementById("add-visitor-btn");
const visitorModal = document.getElementById("visitor-modal");
const visitorModalClose = document.getElementById("visitor-modal-close");

const vName = document.getElementById("v-name");
const vRole = document.getElementById("v-role");
const vDate = document.getElementById("v-date");
const vTime = document.getElementById("v-time");
const vDuration = document.getElementById("v-duration");
const vSaveBtn = document.getElementById("save-visitor");

let currentSelectedPatientId = null;

/* ============================================
   SEARCH PATIENTS
============================================ */
async function searchPatients(query) {
    query = query.trim();

    if (!query) {
        list.innerHTML = "";
        empty.style.display = "flex";

        // hide visitor section
        visitorSection.classList.add("hidden");
        return;
    }

    const res = await fetch(`${API_BASE}/patients/search?query=${query}`);
    const data = await res.json();

    if (!data.results.length) {
        list.innerHTML = "";
        empty.style.display = "flex";

        // hide visitor section
        visitorSection.classList.add("hidden");
        return;
    }

    empty.style.display = "none";
    renderPatients(data.results);
}

function renderPatients(items) {
    list.innerHTML = "";

    items.forEach(p => {
        const card = document.createElement("div");
        card.className = "patient-card bg-white rounded-lg shadow p-4 mb-6";

        card.innerHTML = `
            <h3 class="text-lg font-semibold">${p.full_name}</h3>
            <p class="text-sm">Age: ${p.age} | Gender: ${p.gender}</p>
            <p class="text-sm">Ward: ${p.ward}</p>
            <p class="text-sm">Doctor: ${p.assigned_doctor}</p>
            <p class="text-sm mt-2">MDR: <strong>${p.mdr_status}</strong></p>

            <button class="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
                    onclick="openPatient(${p.id})">
                View Details
            </button>
        `;

        list.appendChild(card);
    });
}

input.addEventListener("input", e => searchPatients(e.target.value));

/* ============================================
   SELECT PATIENT (SHOW PATIENT + VISITOR PANEL)
============================================ */
window.openPatient = async function (id) {
    currentSelectedPatientId = id;

    // Fetch patient details
    const res = await fetch(`${API_BASE}/patients/${id}`);
    const patient = await res.json();

    // Render compact patient card
    list.innerHTML = `
        <div class="bg-white p-6 shadow rounded-lg mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">${patient.full_name}</h2>
                    <p class="text-sm text-slate-600">
                        ${patient.age} yrs | ${patient.gender} | ${patient.assigned_doctor}
                    </p>
                </div>

                <button class="px-4 py-2 bg-blue-600 text-white rounded"
                        onclick="visitorModal.style.display='flex'">
                    + Add Visitors
                </button>
            </div>
        </div>
    `;

    // Show visitor section
    visitorSection.classList.remove("hidden");

    // Load contacts
    loadVisitorContacts();
};

/* ============================================
   LOAD VISITOR CONTACTS
============================================ */
async function loadVisitorContacts() {
    const res = await fetch(`${API_BASE}/patients/${currentSelectedPatientId}/contacts`);
    const contacts = await res.json();

    renderVisitorContacts(contacts);
}

function renderVisitorContacts(contacts) {
    visitorList.innerHTML = `
        <h3 class="text-lg font-bold mb-3">Visitor Contacts (${contacts.length})</h3>
    `;

    contacts.forEach(c => {
        const item = document.createElement("div");
        item.className = "bg-white p-4 shadow rounded mb-3";

        item.innerHTML = `
            <div class="flex justify-between">
                <div>
                    <strong>${c.visitor_name}</strong>
                    <p class="text-sm text-slate-500">${c.visitor_role}</p>
                </div>

                <div class="text-right">
                    <p>${new Date(c.visit_datetime).toLocaleString()}</p>
                    <div class="mt-1 text-xs bg-blue-100 px-2 py-1 rounded">
                        ${c.duration_minutes} mins
                    </div>
                </div>
            </div>
        `;

        visitorList.appendChild(item);
    });
}

/* ============================================
   ADD VISITOR MODAL
============================================ */
addVisitorBtn.addEventListener("click", () => {
    if (!currentSelectedPatientId) return alert("Select patient first");
    visitorModal.style.display = "flex";
});

visitorModalClose.addEventListener("click", () => {
    visitorModal.style.display = "none";
});

// Save visitor
vSaveBtn.addEventListener("click", async () => {

  // Full validation
  if (!vName.value.trim()) {
      alert("Visitor Name is required.");
      return;
  }

  if (!vRole.value.trim()) {
      alert("Please select a Relation / Role.");
      return;
  }

  if (!vDate.value) {
      alert("Please enter a Date.");
      return;
  }

  if (!vTime.value) {
      alert("Please enter a Time.");
      return;
  }

  if (!vDuration.value.trim()) {
      alert("Duration (minutes) is required.");
      return;
  }

  if (isNaN(vDuration.value) || vDuration.value <= 0) {
      alert("Duration must be a positive number.");
      return;
  }

  const visit_datetime = new Date(`${vDate.value}T${vTime.value}`).toISOString();

  const payload = {
      visitor_name: vName.value.trim(),
      visitor_role: vRole.value.trim(),
      visit_datetime,
      duration_minutes: parseInt(vDuration.value),
  };

  await fetch(`${API_BASE}/patients/${currentSelectedPatientId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
  });

  visitorModal.style.display = "none";

  // Reload the list
  loadVisitorContacts();

  // Clear form
  vName.value = "";
  vRole.value = "";
  vDate.value = "";
  vTime.value = "";
  vDuration.value = "";
});
