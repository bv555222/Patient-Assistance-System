
// WebSocket connection
const socket = window.sharedSocket;

// MQTT broker details
const broker = 'ws://broker.hivemq.com:8000/mqtt'; // Public MQTT broker WebSocket
const topic = 'test/charan'; // Topic to subscribe to and publish to

// Create an MQTT client
const client = mqtt.connect(broker);

// Page-specific configuration
const pageType = document.title.split(' ')[0].toUpperCase(); // Get the page type (e.g., "NURSE")
const recordsDiv = document.getElementById("records");

// Load records from localStorage
loadRecordsFromLocalStorage(pageType);

// MQTT connection
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe(topic, (err) => {
        if (err) {
            console.error('Subscription error:', err);
        } else {
            console.log(`Subscribed to topic '${topic}'`);
        }
    });
});

// Handle incoming MQTT messages
client.on('message', (topic, message) => {
    const msg = message.toString();
    console.log(`MQTT received: ${msg}`);
    handleIncomingMessage(msg);
    socket.emit('mqtt-message', msg); // Send to WebSocket for other pages
});

// Global WebSocket message handler
document.addEventListener('mqtt-message', (event) => {
    const message = event.detail;
    handleIncomingMessage(message);
});



// Function to process messages
function handleIncomingMessage(msg) {
    console.log("ht:",msg);

    if(msg.startsWith('KILL'))

    {
        console.log("delete",msg.split('-')[1],msg.split('-')[2]);
        deleteRecord(msg.split('-')[1],msg.split('-')[2]);
        return;

    }
        const [bedNumber, type] = msg.split('-');
        console.log(pageType,type,bedNumber);
        
            
    if (type === pageType) {
        createRecord(bedNumber, type);
     
    } 
    else{
        saveRecordToLocalStorage(bedNumber,type)
    }

}


// Function to create a record (optimized)
function createRecord(bedNumber, type) {
    if (document.getElementById(`record-${type}-${bedNumber}`)) return; // Avoid duplicates

    const record = document.createElement('div');
    record.id = `record-${type}-${bedNumber}`;
    record.className = 'record';

    // Using a single reflow-efficient string for content
    record.innerHTML = `
        <p> ${bedNumber}</p>
        <button onclick="acknowledgeRecord('${bedNumber}','${type}')">Acknowledge</button>
    `;

    recordsDiv.appendChild(record);
    saveRecordToLocalStorage(bedNumber, type);
  
}

// Function to acknowledge a record
function acknowledgeRecord(bedNumber,type) {
    const button = document.querySelector(`#record-${type}-${bedNumber} button`);
   console.log(button);
    
     if (button) {
         button.disabled = true;
         button.style.backgroundColor = 'green';
    }
    client.publish(topic, `ACK-${bedNumber}-${pageType}`);
    //removeRecordFromLocalStorage(bedNumber);
}

// Function to delete a record
function deleteRecord(bedNumber,type) {
   
    removeRecordFromLocalStorage(bedNumber,type);
    
     const record = document.getElementById(`record-${type}-${bedNumber}`);
     if(record)
  { 
     record.remove();
    }
}

// Efficient localStorage helpers
function saveRecordToLocalStorage(bedNumber, type) {
    const records = JSON.parse(localStorage.getItem(`records-${type}`)) || [];
    if (!records.some(record => record.bedNumber === bedNumber)) {
        records.push({ bedNumber, type });
        localStorage.setItem(`records-${type}`, JSON.stringify(records));
    }
}

function removeRecordFromLocalStorage(bedNumber,type) {
    let records = JSON.parse(localStorage.getItem(`records-${type}`)) || [];
    records = records.filter(record => record.bedNumber !== bedNumber);
    localStorage.setItem(`records-${type}`, JSON.stringify(records));
}


function loadRecordsFromLocalStorage(type) {
    const recordsDiv = document.getElementById('records');
    console.log('recordsDiv:', recordsDiv);  // Debugging line to check if the element exists
    if (!recordsDiv) {
        console.error('Element with id "records" not found!');
        return;
    }

    const records = JSON.parse(localStorage.getItem(`records-${type}`)) || [];
    const fragment = document.createDocumentFragment(); // Batch DOM operations

    // Loop through the stored records
    records.forEach(({ bedNumber, type }) => {
        if (type === pageType && !document.getElementById(`record-${bedNumber}`)) {  // Avoid duplicates
            // Create the record container element
            const record = document.createElement('div');
            record.id = `record-${type}-${bedNumber}`;
            record.className = 'record';

            // Create the paragraph element for bed number and type
            const paragraph = document.createElement('p');
            paragraph.textContent = `${bedNumber}`;
            record.appendChild(paragraph);

            // Create the acknowledge button
            const button = document.createElement('button');
            button.textContent = 'Acknowledge';
            button.addEventListener('click', function() {
                acknowledgeRecord(bedNumber);
            });
            record.appendChild(button);

            // Append the record to the document fragment
            fragment.appendChild(record);
        }
    });

    // Append all records to the DOM at once to minimize reflows
    recordsDiv.appendChild(fragment);
}
