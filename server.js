import aedes from "aedes";
import express from "express";
import http from "http";
import { Server } from "socket.io"; // Correct import for Socket.IO
import mqtt from "mqtt";

// ================== Aedes MQTT Broker Setup ==================
const mqttBroker = aedes();  // Create an Aedes MQTT broker
const mqttServer = http.createServer(); // HTTP server for the MQTT broker

// Start Aedes broker on port 1883
mqttServer.listen(1883, () => {
    console.log("Aedes MQTT broker is running on port 1883");
});

// Handle incoming MQTT messages from clients
mqttBroker.on("client", (client) => {
    console.log(`Client connected: ${client.id}`);
});

mqttBroker.on("publish", (packet, client) => {
    console.log(`Message received: Topic - ${packet.topic}, Payload - ${packet.payload.toString()}`);
});

mqttBroker.on("clientDisconnect", (client) => {
    console.log(`Client disconnected: ${client.id}`);
});

// ================== Express + Socket.IO Setup ==================
const app = express();
const webSocketServer = http.createServer(app); // Separate HTTP server for WebSocket

// Create a Socket.IO server
const io = new Server(webSocketServer); // Create a Socket.IO server

// MQTT broker details (external broker for this part)
const externalBroker = "tcp://broker.hivemq.com"; // Public broker
const topic = "test/charan"; // Topic to subscribe to

// Create MQTT client for external broker
const mqttClient = mqtt.connect(externalBroker);

// Serve the static HTML page
app.use(express.static("public"));

// Handle MQTT connection
mqttClient.on("connect", () => {
    console.log("Connected to the external MQTT broker");
    mqttClient.subscribe(topic, (err) => {
        if (err) {
            console.error("Subscription error:", err);
        } else {
            console.log(`Subscribed to topic '${topic}'`);
        }
    });
});

// Handle incoming MQTT messages from the external broker
mqttClient.on("message", (topic, message) => {
    console.log(`External MQTT: Received message: ${message.toString()} from topic: ${topic}`);
    io.emit("mqtt-message", message.toString()); // Emit message to WebSocket clients
});

// Handle WebSocket connections
io.on("connection", (socket) => {
    console.log("A WebSocket client connected");

    socket.on("disconnect", () => {
        console.log("A WebSocket client disconnected");
    });
});

// Start the Express + WebSocket server on port 8080
const port = process.env.PORT || 8080;
webSocketServer.listen(port, () => {
    console.log(`Express + WebSocket server is running on http://127.0.0.1:${port}`);
});
