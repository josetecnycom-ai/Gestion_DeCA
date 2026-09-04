geotab.addin.dcdtGenerator = function (api, state) {
  return {
    initialize: function (api, state, initializeCallback) {
      document.getElementById('generateBtn').addEventListener('click', function() {
        generateDCDT(api);
      });
      initializeCallback();
    },

    focus: function (api, state) {
      if (!document.getElementById('transportDate').value) {
        document.getElementById('transportDate').valueAsDate = new Date();
      }
    },

    blur: function (api, state) {
    }
  };
};

function generateDCDT(api) {
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!apiKey) {
    alert("Por favor, introduce tu API Key de DCDT.");
    return;
  }

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

  resultStatus.innerText = "Enviando datos a Davinchi...";
  resultDetails.innerText = JSON.stringify(cleanPayload, null, 2);
  resultPdf.style.display = 'none';
  resultBox.style.display = 'block';
  resultBox.className = 'result'; // remove success/error classes

  fetch('https://dcdt.davinchi.es/api/v1/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(cleanPayload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success || (data.success === false && data.documentId)) {
       resultBox.classList.add(data.success ? 'success' : 'success'); // using green even for drafts
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
      resultStatus.innerText = "Error en la validación (422/500)";
      resultDetails.innerText = JSON.stringify(data.errors || data, null, 2);
    }
  })
  .catch(error => {
    resultBox.classList.add('error');
    resultStatus.innerText = "Error de red / CORS";
    resultDetails.innerText = "La petición fue bloqueada por el navegador o hubo un fallo de red.\nError exacto: " + error.message;
  });
}
