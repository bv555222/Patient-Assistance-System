
// Create or reuse a shared WebSocket connection
if (!window.sharedSocket) {
    const socket = io(); // Initialize WebSocket (adjust URL if required)
    window.sharedSocket = socket; // Store the WebSocket connection globally

    socket.on('connect', () => {
        console.log('WebSocket client connected');
    });

    socket.on('disconnect', () => {
        console.log('WebSocket client disconnected');
    });

    socket.on('mqtt-message', (message) => {
        console.log('WebSocket received:', message);
        // Dispatch a custom event to notify all pages about the message
        document.dispatchEvent(new CustomEvent('mqtt-message', { detail: message }));
    });
}