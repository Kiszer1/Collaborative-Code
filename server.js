const { createServer } = require("http");
const next =  require("next");
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({dev, hostname, port})
const handler = app.getRequestHandler();


app.prepare().then(() => {
    const httpServer = createServer(handler);
    
    const io = new Server(httpServer);

    io.on('connection', (socket) => {
        socket.on('disconnect', () => {
            console.log('User left the session');
        })

        socket.on('codeEdit', (text, expected, room) => {
            if (text === expected)
                io.emit('smiley');
            io.to(room).except(socket.id).emit('codeEdit', text);
        });

        socket.on("roomName", async (room) => {
            socket.join(room);
            console.log("User joined room: " + room);
            const userType = io.sockets.adapter.rooms.get(room).size == 1 ? "Mentor" : "Student";
            socket.emit("userType", userType);
            console.log(userType);
        })
    
    })

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
    
        .listen(port, () => {
            console.log(`>Ready on http://${hostname}:${port}`);
        })
})