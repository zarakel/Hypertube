const http = require('http');

function initServer(app, port) {
    const server = http.createServer(app);

    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    return server;
}

module.exports = { initServer };
