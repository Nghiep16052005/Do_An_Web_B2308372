// Server-Sent Events (SSE) Manager
const clients = new Set();

const subscribe = (req, res) => {
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in reverse proxies
    res.flushHeaders();

    const role = req.query.role || "client"; // "admin" or "client"
    const readerId = req.query.readerId || null;

    const clientInfo = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        role,
        readerId,
        res
    };

    clients.add(clientInfo);

    // Initial connection message
    res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE connected successfully" })}\n\n`);

    // Keep connection alive with periodic comment pings
    const intervalId = setInterval(() => {
        try {
            res.write(": keep-alive\n\n");
        } catch {
            clearInterval(intervalId);
        }
    }, 25000);

    // Handle connection close
    req.on("close", () => {
        clearInterval(intervalId);
        clients.delete(clientInfo);
    });
};

const sendEvent = (res, eventType, data) => {
    try {
        res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
        console.error("SSE write error:", err);
    }
};

const sendToAdmins = (eventType, data) => {
    clients.forEach(client => {
        if (client.role === "admin") {
            sendEvent(client.res, eventType, data);
        }
    });
};

const sendToReader = (readerId, eventType, data) => {
    clients.forEach(client => {
        if (client.role === "client" && client.readerId === readerId) {
            sendEvent(client.res, eventType, data);
        }
    });
};

const broadcast = (eventType, data) => {
    clients.forEach(client => {
        sendEvent(client.res, eventType, data);
    });
};

module.exports = {
    subscribe,
    sendToAdmins,
    sendToReader,
    broadcast
};
