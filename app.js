// Maestros guardados localmente
let savedData = {
  loaders: [],
  carriers: [],
  recipients: [],
  locations: []
};

// Cargar maestros de localStorage
function loadSavedData() {
  ['loaders', 'carriers', 'recipients', 'locations'].forEach(key => {
    const data = localStorage.getItem('dcdt_' + key);
    if (data) {
      try { savedData[key] = JSON.parse(data); } catch(e){}
    }
  });
  renderDatalists();
}

function saveToLocalStorage(key) {
  localStorage.setItem('dcdt_' + key, JSON.stringify(savedData[key]));
}

// Renderizar datalists de partes
function renderDatalists() {
  const mapList = (arr) => arr.map(item => `<option value="${item.name}">${item.taxId ? item.taxId : ''} - ${item.city || ''}</option>`).join('');
  const mapLocs = (arr) => arr.map(item => `<option value="${item.name}">${item.city || ''} (${item.province || ''})</option>`).join('');

  document.getElementById('list-loaders').innerHTML = mapList(savedData.loaders);
  document.getElementById('list-carriers').innerHTML = mapList(savedData.carriers);
  document.getElementById('list-recipients').innerHTML = mapList(savedData.recipients);
  
  const locHTML = mapLocs(savedData.locations);
  document.getElementById('list-locations').innerHTML = locHTML; 
  // (mismo datalist para origen y destino o usar separados si se prefiere)
}

// --- Lógica de Modales ---
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function openPartyModal(type, isNew) {
  const typeMap = { 'loader': 'Cargador', 'carrier': 'Transportista', 'recipient': 'Destinatario' };
  document.getElementById('partyModalTitle').innerText = (isNew ? 'Nuevo ' : 'Editar ') + typeMap[type];
  document.getElementById('modalPartyType').value = type;
  
  const searchInput = document.getElementById(type + 'Search').value;
  let data = {};

  if (!isNew && searchInput) {
    const list = savedData[type + 's'];
    data = list.find(x => x.name === searchInput) || {};
    document.getElementById('modalPartyOldName').value = data.name || '';
  } else {
    document.getElementById('modalPartyOldName').value = '';
    data.name = searchInput; // autocompletar con lo que haya escrito
  }

  document.getElementById('modalPartyName').value = data.name || '';
  document.getElementById('modalPartyTaxId').value = data.taxId || '';
  document.getElementById('modalPartyAddress').value = data.address || '';
  document.getElementById('modalPartyCity').value = data.city || '';
  document.getElementById('modalPartyProvince').value = data.province || '';
  document.getElementById('modalPartyCP').value = data.postalCode || '';
  document.getElementById('modalPartyCountry').value = data.country || 'ES';

  document.getElementById('partyModal').style.display = 'flex';
}

function savePartyModal() {
  const type = document.getElementById('modalPartyType').value;
  const oldName = document.getElementById('modalPartyOldName').value;
  
  const newData = {
    name: document.getElementById('modalPartyName').value.trim(),
    taxId: document.getElementById('modalPartyTaxId').value.trim(),
    address: document.getElementById('modalPartyAddress').value.trim(),
    city: document.getElementById('modalPartyCity').value.trim(),
    province: document.getElementById('modalPartyProvince').value.trim(),
    postalCode: document.getElementById('modalPartyCP').value.trim(),
    country: document.getElementById('modalPartyCountry').value.trim() || 'ES'
  };

  if (!newData.name) { alert("La Razón Social es obligatoria."); return; }
  if (!newData.city) { alert("La Ciudad es obligatoria."); return; }

  const list = savedData[type + 's'];
  if (oldName) {
    const idx = list.findIndex(x => x.name === oldName);
    if (idx >= 0) list[idx] = newData;
    else list.push(newData);
  } else {
    // Evitar duplicados por nombre
    const idx = list.findIndex(x => x.name === newData.name);
    if (idx >= 0) list[idx] = newData;
    else list.push(newData);
  }

  saveToLocalStorage(type + 's');
  renderDatalists();
  
  // Autoseleccionar en el input
  document.getElementById(type + 'Search').value = newData.name;
  fillHiddenPartyFields(type, newData.name);

  closeModal('partyModal');
}

function openLocationModal(type, isNew) {
  document.getElementById('locationModalTitle').innerText = (isNew ? 'Nueva ' : 'Editar ') + 'Dirección';
  document.getElementById('modalLocationType').value = type;
  
  const searchInput = document.getElementById(type + 'Search').value;
  let data = {};

  if (!isNew && searchInput) {
    data = savedData.locations.find(x => x.name === searchInput) || {};
    document.getElementById('modalLocationOldName').value = data.name || '';
  } else {
    document.getElementById('modalLocationOldName').value = '';
    data.name = searchInput;
  }

  document.getElementById('modalLocationName').value = data.name || '';
  document.getElementById('modalLocationAddress').value = data.address || '';
  document.getElementById('modalLocationCity').value = data.city || '';
  document.getElementById('modalLocationProvince').value = data.province || '';
  document.getElementById('modalLocationCP').value = data.postalCode || '';
  document.getElementById('modalLocationCountry').value = data.country || 'ES';

  document.getElementById('locationModal').style.display = 'flex';
}

function saveLocationModal() {
  const type = document.getElementById('modalLocationType').value;
  const oldName = document.getElementById('modalLocationOldName').value;
  
  const newData = {
    name: document.getElementById('modalLocationName').value.trim(),
    address: document.getElementById('modalLocationAddress').value.trim(),
    city: document.getElementById('modalLocationCity').value.trim(),
    province: document.getElementById('modalLocationProvince').value.trim(),
    postalCode: document.getElementById('modalLocationCP').value.trim(),
    country: document.getElementById('modalLocationCountry').value.trim() || 'ES'
  };

  if (!newData.name) { alert("El nombre es obligatorio."); return; }
  if (!newData.city) { alert("La Ciudad es obligatoria."); return; }

  const list = savedData.locations;
  if (oldName) {
    const idx = list.findIndex(x => x.name === oldName);
    if (idx >= 0) list[idx] = newData;
    else list.push(newData);
  } else {
    const idx = list.findIndex(x => x.name === newData.name);
    if (idx >= 0) list[idx] = newData;
    else list.push(newData);
  }

  saveToLocalStorage('locations');
  renderDatalists();
  
  document.getElementById(type + 'Search').value = newData.name;
  fillHiddenLocationFields(type, newData.name);

  closeModal('locationModal');
}

// Llenar campos ocultos al escribir/seleccionar en los datalists
function fillHiddenPartyFields(type, searchName) {
  const item = savedData[type + 's'].find(x => x.name === searchName);
  if(item) {
    document.getElementById(type + '_name').value = item.name;
    document.getElementById(type + '_taxId').value = item.taxId || '';
    document.getElementById(type + '_address').value = item.address || '';
    document.getElementById(type + '_city').value = item.city || '';
    document.getElementById(type + '_province').value = item.province || '';
    document.getElementById(type + '_postalCode').value = item.postalCode || '';
    document.getElementById(type + '_country').value = item.country || 'ES';
  }
}

function fillHiddenLocationFields(type, searchName) {
  const item = savedData.locations.find(x => x.name === searchName);
  if(item) {
    document.getElementById(type + '_name').value = item.name;
    document.getElementById(type + '_address').value = item.address || '';
    document.getElementById(type + '_city').value = item.city || '';
    document.getElementById(type + '_province').value = item.province || '';
    document.getElementById(type + '_postalCode').value = item.postalCode || '';
    document.getElementById(type + '_country').value = item.country || 'ES';
  }
}

// Escuchar cambios en los inputs de búsqueda
['loader', 'carrier', 'recipient'].forEach(type => {
  const el = document.getElementById(type + 'Search');
  if(el) el.addEventListener('change', (e) => fillHiddenPartyFields(type, e.target.value));
});
['origin', 'destination'].forEach(type => {
  const el = document.getElementById(type + 'Search');
  if(el) el.addEventListener('change', (e) => fillHiddenLocationFields(type, e.target.value));
});


geotab.addin.dcdtGenerator = function (api, state) {
  return {
    initialize: function (api, state, initializeCallback) {
      // Inyectar CSS dinámicamente para evitar que Geotab borre los estilos
      const css = `
        :root { --primary: #2563eb; --primary-hover: #1d4ed8; --bg: #f8fafc; --border: #e2e8f0; --text: #1e293b; --text-muted: #64748b; }
        #dcdt-addin-container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 16px; color: var(--text); background: var(--bg); }
        #dcdt-addin-container .header-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid var(--primary); }
        #dcdt-addin-container .section { background: #fff; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }
        #dcdt-addin-container .section-header { padding: 12px 16px; background: #f1f5f9; font-weight: 600; border-bottom: 1px solid var(--border); font-size: 1.05em; display: flex; align-items: center; gap: 8px; }
        #dcdt-addin-container .section-content { padding: 16px; }
        #dcdt-addin-container .row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
        #dcdt-addin-container .col { flex: 1; min-width: 250px; }
        #dcdt-addin-container .col-half { flex: 0 0 calc(50% - 8px); }
        #dcdt-addin-container .form-group { display: flex; flex-direction: column; margin-bottom: 12px; }
        #dcdt-addin-container label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; }
        #dcdt-addin-container input[type="text"], #dcdt-addin-container input[type="date"], #dcdt-addin-container input[type="number"], #dcdt-addin-container select { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95em; width: 100%; box-sizing: border-box; }
        #dcdt-addin-container input:focus, #dcdt-addin-container select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        #dcdt-addin-container .search-group { position: relative; display: flex; gap: 8px; }
        #dcdt-addin-container .search-group input { flex: 1; }
        #dcdt-addin-container .btn { padding: 8px 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85em; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
        #dcdt-addin-container .btn-primary { background: var(--primary); color: white; }
        #dcdt-addin-container .btn-primary:hover { background: var(--primary-hover); }
        #dcdt-addin-container .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
        #dcdt-addin-container .btn-outline:hover { background: #f1f5f9; }
        #dcdt-addin-container .btn-large { padding: 14px 24px; font-size: 1.1em; width: 100%; margin-top: 10px; }
        
        /* Modals */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 99999; }
        .modal { background: #fff; width: 90%; max-width: 600px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); display: flex; flex-direction: column; max-height: 90vh; }
        .modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 1.2em; font-weight: 700; display: flex; justify-content: space-between; }
        .modal-body { padding: 20px; overflow-y: auto; }
        .modal-body .row { display: flex; gap: 16px; margin-bottom: 12px; }
        .modal-body .col { flex: 1; }
        .modal-body .form-group { display: flex; flex-direction: column; margin-bottom: 12px; }
        .modal-body label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; }
        .modal-body input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95em; width: 100%; box-sizing: border-box; }
        .modal-footer { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
        .close-btn { cursor: pointer; color: var(--text-muted); font-size: 1.5em; line-height: 1; }
        
        #dcdt-addin-container .req { color: #ef4444; }
        #dcdt-addin-container .dcdt-result { margin-top: 16px; padding: 16px; border-radius: 8px; display: none; }
        #dcdt-addin-container .dcdt-result.success { background: #dcfce7; border: 1px solid #bbf7d0; color: #166534; }
        #dcdt-addin-container .dcdt-result.error { background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; }
      `;
      const styleNode = document.createElement('style');
      styleNode.innerHTML = css;
      document.head.appendChild(styleNode);

      loadSavedData();

      document.getElementById('generateBtn').addEventListener('click', function() {
        generateDCDT(api);
      });

      // Descargar Vehículos, Usuarios y Zonas
      api.multiCall([
        ["Get", { typeName: "Device" }],
        ["Get", { typeName: "User", search: { isDriver: true } }],
        ["Get", { typeName: "Zone" }]
      ], function(results) {
        const devices = results[0];
        const users = results[1];
        const zones = results[2];

        // Vehículos
        let vehHtml = '';
        devices.forEach(d => {
          if(d.serialNumber !== "000-000-0000" && d.licensePlate) {
            vehHtml += `<option value="${d.licensePlate}">${d.name}</option>`;
          }
        });
        document.getElementById('list-vehicles').innerHTML = vehHtml;

        // Conductores
        let driverHtml = '';
        users.forEach(u => {
          let fullName = (u.firstName || '') + ' ' + (u.lastName || '');
          if(!fullName.trim()) fullName = u.name;
          // El DNI se guarda en "Número de licencia de conducir" en Geotab (licenseNumber)
          const idnum = u.licenseNumber || '';
          driverHtml += `<option value="${fullName.trim()}" data-idnum="${idnum}">${idnum ? 'DNI/NIE: '+idnum : ''}</option>`;
        });
        document.getElementById('list-drivers').innerHTML = driverHtml;

        // Añadir Zonas a la lista de localizaciones (solo si no existen en memoria para no machacar)
        zones.forEach(z => {
           if(z.name && !savedData.locations.find(x => x.name === z.name)) {
              savedData.locations.push({
                name: z.name,
                city: '', // Geotab Zones don't have direct city text, user must edit them later
                country: 'ES' 
              });
           }
        });
        renderDatalists();

        // Autocompletar DNI de los conductores al seleccionarlos
        const fillDriverId = (inputId, idInputId) => {
          document.getElementById(inputId).addEventListener('change', function(e) {
            const selectedOpt = Array.from(document.getElementById('list-drivers').options).find(opt => opt.value === e.target.value);
            if (selectedOpt && selectedOpt.dataset.idnum) {
              document.getElementById(idInputId).value = selectedOpt.dataset.idnum;
            }
          });
        };
        fillDriverId('driver1Name', 'driver1Id');
        fillDriverId('driver2Name', 'driver2Id');

      }, function(e) {
         console.error("Error cargando datos de Geotab:", e);
      });

      initializeCallback();
    },

    focus: function (api, state) {
      if (!document.getElementById('transportDate').value) {
        document.getElementById('transportDate').valueAsDate = new Date();
      }
    },
    blur: function (api, state) { }
  };
};

function generateDCDT(api) {
  const val = (id) => { 
    const el = document.getElementById(id); 
    if (!el) return undefined;
    const v = el.value.trim(); 
    return v === "" ? undefined : v; 
  };
  const num = (id) => { 
    const el = document.getElementById(id); 
    if (!el) return undefined;
    const v = el.value.trim(); 
    return v === "" ? undefined : Number(v); 
  };

  // Helper para construir objetos Party
  const buildParty = (type) => {
    // Si escribió algo pero no está guardado ni autocompletó los ocultos, forzamos usar el search box como nombre y alertamos si falta ciudad.
    let name = val(type + '_name') || val(type + 'Search');
    if (!name) return undefined;
    return {
      name: name,
      taxId: val(type + '_taxId'),
      address: val(type + '_address'),
      city: val(type + '_city') || 'No Especificada', // API exige city
      province: val(type + '_province'),
      postalCode: val(type + '_postalCode'),
      country: val(type + '_country') || 'ES'
    };
  };

  const payload = {
    loader: buildParty('loader'),
    carrier: buildParty('carrier'),
    vehicle: {
      transportSetType: num('transportSetType'),
      plateNumber: val('plateNumber'),
      trailerPlateNumber: val('trailerPlateNumber')
    },
    driver: {
      fullName: val('driver1Name'),
      idNumber: val('driver1Id')
    },
    origin: buildParty('origin'),
    destination: buildParty('destination'),
    transport: {
      transportDate: val('transportDate')
    },
    cargo: {
      description: val('cargoDesc'),
      weight: num('cargoWeight'),
      weightUnit: val('cargoWeightUnit'),
      packagesCount: num('cargoPackages'),
      packagingType: val('cargoPackageType'),
      notes: val('cargoNotes')
    },
    leaveAsDraft: document.getElementById('leaveAsDraft').checked
  };

  // Validaciones mínimas
  if(!payload.loader || !payload.loader.name) { alert("Falta el Cargador"); return; }
  if(!payload.carrier || !payload.carrier.name) { alert("Falta el Transportista"); return; }
  if(!payload.origin || !payload.origin.name) { alert("Falta el Origen"); return; }
  if(!payload.destination || !payload.destination.name) { alert("Falta el Destino"); return; }
  if(!payload.vehicle.plateNumber) { alert("Falta la Matrícula del vehículo"); return; }
  if(!payload.driver.fullName) { alert("Falta el nombre del conductor principal"); return; }

  if (val('recipientSearch')) payload.recipient = buildParty('recipient');
  if (val('driver2Name')) payload.secondDriver = { fullName: val('driver2Name'), idNumber: val('driver2Id') };
  if (val('loadingDate')) payload.transport.loadingDate = val('loadingDate');
  
  if (val('notifyEmail')) {
    payload.notifications = [{ channel: "email", recipient: val('notifyEmail') }];
    payload.sendEmailNotifications = true;
  }
  
  if (val('referenceCode')) payload.references = { reference: val('referenceCode') };

  const cleanPayload = JSON.parse(JSON.stringify(payload));

  const resultBox = document.getElementById('resultBox');
  const resultStatus = document.getElementById('resultStatus');
  const resultDetails = document.getElementById('resultDetails');
  const resultPdf = document.getElementById('resultPdf');

  resultStatus.innerText = "Enviando datos...";
  resultDetails.innerText = JSON.stringify(cleanPayload, null, 2);
  resultPdf.style.display = 'none';
  resultBox.style.display = 'block';
  resultBox.className = 'dcdt-result'; 

  fetch('https://proxy-dcdt-geotab.jose-tecnycom.workers.dev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success || (data.success === false && data.documentId)) {
       resultBox.classList.add('success');
       if (data.publicUrl || data.pdfUrl) {
         resultStatus.innerText = "¡DCDT Generado Correctamente!";
         resultDetails.innerText = "Documento ID: " + data.documentId + "\nMatrícula: " + cleanPayload.vehicle.plateNumber;
         if (data.pdfUrl) {
           resultPdf.href = data.pdfUrl;
           resultPdf.style.display = 'inline-block';
         }
       } else {
         resultStatus.innerText = "Borrador Creado";
         resultDetails.innerText = "Se creó como borrador (ID: " + data.documentId + ").\n\n" + (data.errors ? JSON.stringify(data.errors, null, 2) : "");
       }
    } else {
      resultBox.classList.add('error');
      resultStatus.innerText = "Error (422/500)";
      resultDetails.innerText = JSON.stringify(data.errors || data, null, 2);
    }
  })
  .catch(error => {
    resultBox.classList.add('error');
    resultStatus.innerText = "Error de conexión";
    resultDetails.innerText = "Fallo de red: " + error.message;
  });
}
