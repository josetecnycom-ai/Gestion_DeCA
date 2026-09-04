geotab.addin.dcdtGenerator = function (api, state) {
  
  // Variables to hold Geotab data
  let currentUser;
  
  return {
    /**
     * initialize() is called only once when the Add-In is first loaded.
     * @param {object} api The GeotabApi object for making calls to MyGeotab.
     * @param {object} state The Initial state of the Add-In.
     * @param {function} initializeCallback Call this when your initialize route is complete.
     */
    initialize: function (api, state, initializeCallback) {
      // Setup the event listener for the generate button
      document.getElementById('generateBtn').addEventListener('click', function() {
        generateDCDT(api);
      });

      // Get current user info to pre-fill or just to test API
      api.getSession(function(session) {
        currentUser = session.userName;
      });

      initializeCallback();
    },

    /**
     * focus() is called whenever the Add-In receives focus.
     * @param {object} api The GeotabApi object for making calls to MyGeotab.
     * @param {object} state The state of the Add-In.
     */
    focus: function (api, state) {
      // Set today's date as default
      document.getElementById('transportDate').valueAsDate = new Date();
    },

    /**
     * blur() is called whenever the user navigates away from the Add-In.
     * @param {object} api The GeotabApi object for making calls to MyGeotab.
     * @param {object} state The state of the Add-In.
     */
    blur: function (api, state) {
    }
  };
};

function generateDCDT(api) {
  const apiKey = document.getElementById('apiKey').value;
  const transportDate = document.getElementById('transportDate').value;
  const originCity = document.getElementById('originCity').value;
  const destinationCity = document.getElementById('destinationCity').value;

  if (!apiKey) {
    alert("Por favor, introduce tu API Key de DCDT.");
    return;
  }

  // Example payload based on DCDT API documentation
  const payload = {
    "loader": {
      "name": "Empresa Cargadora Ej",
      "taxId": "B12345678",
      "city": originCity,
      "country": "ES"
    },
    "carrier": {
      "name": "Transportes Geotab S.L.",
      "taxId": "A87654321",
      "city": "Madrid",
      "country": "ES"
    },
    "vehicle": {
      "transportSetType": 1,
      "plateNumber": "1234ABC"
    },
    "driver": {
      "fullName": "Conductor Principal",
      "idNumber": "12345678A"
    },
    "origin": {
      "city": originCity,
      "country": "ES"
    },
    "destination": {
      "city": destinationCity,
      "country": "ES"
    },
    "transport": {
      "transportDate": transportDate
    },
    "cargo": {
      "description": "Mercancía general",
      "weight": 1000,
      "weightUnit": "kg"
    },
    "leaveAsDraft": true // true para pruebas sin emitir notificaciones
  };

  const resultBox = document.getElementById('resultBox');
  const resultStatus = document.getElementById('resultStatus');
  const resultDetails = document.getElementById('resultDetails');
  const resultPdf = document.getElementById('resultPdf');

  resultStatus.innerText = "Generando...";
  resultDetails.innerText = "";
  resultPdf.style.display = 'none';
  resultBox.style.display = 'block';

  fetch('https://dcdt.davinchi.es/api/v1/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success || (data.success === false && data.documentId)) {
       // Si success es false pero hay documentId, puede ser un borrador creado.
       // Según la doc, si leaveAsDraft=true o incomplete=true.
       if (data.publicUrl || data.pdfUrl) {
         resultStatus.innerText = "¡DCDT Generado!";
         resultDetails.innerText = "Documento ID: " + data.documentId;
         
         if (data.pdfUrl) {
           resultPdf.href = data.pdfUrl;
           resultPdf.style.display = 'inline-block';
         }
       } else {
         resultStatus.innerText = "Borrador Creado";
         resultDetails.innerText = "Documento ID: " + data.documentId + "\nIncompleto: " + data.incomplete;
       }
    } else {
      resultStatus.innerText = "Error";
      resultDetails.innerText = JSON.stringify(data.errors || data, null, 2);
    }
  })
  .catch(error => {
    resultStatus.innerText = "Error de red";
    resultDetails.innerText = error.message;
  });
}
