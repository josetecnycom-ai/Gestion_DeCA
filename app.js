geotab.addin.dcdtGenerator = function (api, state) {
  
  // Lista de IDs de los campos que queremos recordar en el navegador (API Key removida por seguridad)
  const camposParaGuardar = [
    'loaderName', 'loaderTaxId', 'loaderAddress', 'loaderCity', 'loaderPostalCode', 'loaderCountry',
    'carrierName', 'carrierTaxId', 'carrierCity', 'carrierCountry',
    'recipientName', 'recipientTaxId', 'recipientCity', 'recipientCountry',
    'notifyEmail', 'originCity', 'originCountry', 'destinationCity', 'destinationCountry',
    'cargoDesc', 'cargoWeight', 'cargoWeightUnit', 'cargoPackageType'
  ];

  return {
    initialize: function (api, state, initializeCallback) {
      document.getElementById('generateBtn').addEventListener('click', function() {
        generateDCDT(api, camposParaGuardar);
      });
      initializeCallback();
    },

    focus: function (api, state) {
      // 1. Poner fecha de hoy por defecto si está vacía
      if (!document.getElementById('transportDate').value) {
        document.getElementById('transportDate').valueAsDate = new Date();
      }

      // 2. Recuperar todos los datos guardados previamente de localStorage
      camposParaGuardar.forEach(id => {
        const savedValue = localStorage.getItem('dcdt_addin_' + id);
        if (savedValue !== null && savedValue !== "") {
          document.getElementById(id).value = savedValue;
        }
      });
    },

    blur: function (api, state) {
    }
  };
};

function generateDCDT(api, camposParaGuardar) {
  // Guardar automáticamente los valores actuales en la memoria del navegador (localStorage)
  camposParaGuardar.forEach(id => {
    const currentValue = document.getElementById(id).value;
    localStorage.setItem('dcdt_addin_' + id, currentValue);
  });

  // Helper to get value or undefined if empty
  const val = (id) => {
    const v = document.getElementById(id).value.trim();
    return v === "" ? undefined : v;
  };
  
  // Helper to get numbers
  const num = (id) => {
    const v = document.getElementById(id).value.trim();
    return v === "" ? undefined : Number(v);
  };

  const payload = {
    loader: {
      name: val('loaderName'),
      taxId: val('loaderTaxId'),
      address: val('loaderAddress'),
      city: val('loaderCity'),
      postalCode: val('loaderPostalCode'),
      country: val('loaderCountry') || 'ES'
    },
    carrier: {
      name: val('carrierName'),
      taxId: val('carrierTaxId'),
      city: val('carrierCity'),
      country: val('carrierCountry') || 'ES'
    },
    vehicle: {
      transportSetType: num('transportSetType'),
      plateNumber: val('plateNumber'),
      trailerPlateNumber: val('trailerPlateNumber')
    },
    driver: {
      fullName: val('driverName'),
      idNumber: val('driverId'),
      phone: val('driverPhone')
    },
    origin: {
      city: val('originCity'),
      country: val('originCountry') || 'ES'
    },
    destination: {
      city: val('destinationCity'),
      country: val('destinationCountry') || 'ES'
    },
    transport: {
      transportDate: val('transportDate')
    },
    cargo: {
      description: val('cargoDesc'),
      weight: num('cargoWeight'),
      weightUnit: val('cargoWeightUnit'),
      packagesCount: num('cargoPackages'),
      packagingType: val('cargoPackageType')
    },
    leaveAsDraft: document.getElementById('leaveAsDraft').checked
  };

  // Optional objects
  if (val('recipientName')) {
    payload.recipient = {
      name: val('recipientName'),
      taxId: val('recipientTaxId'),
      city: val('recipientCity'),
      country: val('recipientCountry') || 'ES'
    };
  }
  
  if (val('transportDate') && val('loadingDate')) {
    payload.transport.loadingDate = val('loadingDate');
  }

  if (val('notifyEmail')) {
    payload.notifications = [
      { channel: "email", recipient: val('notifyEmail') }
    ];
  }

  if (val('referenceCode')) {
    payload.references = {
      reference: val('referenceCode')
    };
  }

  // Cleanup undefined values to keep JSON clean
  const cleanPayload = JSON.parse(JSON.stringify(payload));

  const resultBox = document.getElementById('resultBox');
  const resultStatus = document.getElementById('resultStatus');
  const resultDetails = document.getElementById('resultDetails');
  const resultPdf = document.getElementById('resultPdf');

  resultStatus.innerText = "Enviando datos al Proxy Seguro...";
  resultDetails.innerText = JSON.stringify(cleanPayload, null, 2);
  resultPdf.style.display = 'none';
  resultBox.style.display = 'block';
  resultBox.className = 'dcdt-result'; // remove success/error classes

  // IMPORTANTE: Ahora la petición viaja a tu servidor Proxy de Cloudflare
  fetch('https://proxy-dcdt-geotab.jose-tecnycom.workers.dev', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cleanPayload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success || (data.success === false && data.documentId)) {
       resultBox.classList.add('success');
       if (data.publicUrl || data.pdfUrl) {
         resultStatus.innerText = "¡DCDT Generado Correctamente!";
         resultDetails.innerText = "Documento DCDT ID: " + data.documentId + "\nMatrícula: " + cleanPayload.vehicle.plateNumber;
         
         if (data.pdfUrl) {
           resultPdf.href = data.pdfUrl;
           resultPdf.style.display = 'inline-block';
         }
       } else {
         resultStatus.innerText = "Borrador Creado en Davinchi";
         resultDetails.innerText = "Se creó como borrador (DCDT ID: " + data.documentId + "). \nFaltan datos obligatorios o 'leaveAsDraft' está activo.\n\n" + (data.errors ? JSON.stringify(data.errors, null, 2) : "");
       }
    } else {
      resultBox.classList.add('error');
      resultStatus.innerText = "Error en la validación de Davinchi (422/500)";
      resultDetails.innerText = JSON.stringify(data.errors || data, null, 2);
    }
  })
  .catch(error => {
    resultBox.classList.add('error');
    resultStatus.innerText = "Error de red";
    resultDetails.innerText = "Fallo de comunicación con el Proxy.\nError exacto: " + error.message;
  });
}
