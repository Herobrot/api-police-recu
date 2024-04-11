const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const signale = require("signale");
const http = require("http");
const WebSocket = require("ws");
require("dotenv/config");
const mongoose = require("mongoose");

const userRouter = require("./routes/userRoutes");
const messagesRouter = require("./routes/messagesRoutes");
const notificationRouter = require("./routes/notificationRoutes");
const warningRouter = require("./routes/warningRoutes");

const Messages = require("./models/messagesSchema");
const User = require("./models/userSchema");


const app = express();
const uri = process.env.MONGODB_URI;
const server = http.createServer(app);
const port = process.env.PORT
const wss = new WebSocket.Server({ noServer: true });

signale.warn("Conectando a MongoDB...");
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const db = mongoose.connection;

db.on('error', (error) => {
    signale.fatal(new Error("Error de conexión a la base de datos: "));
});

db.once('open', () => {
    signale.success("Conexión exitosa a la base de datos MongoDB");
})

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use("/messages", messagesRouter);
app.use("/notifications", notificationRouter);
app.use("/users", userRouter);
app.use("/warnings", warningRouter);

const pendingRequests = new Map();
const connections = new Map();

//long polling
app.get("/users/", async (req, res) => {
    try{
        await Promise.all(Array.from(connections.keys()).map(async (_idUser) => {
            const user = await User.findById(_idUser);
            return {
                _idUser,
                name: user ? user.name : 'Desconocido',
                lastName: user ? user.lastName : 'Desconocido',
                role: user ? user.role : 'Desconocido',
                connected: true
            };
        }));

    } catch (error) {
        signale.fatal(new Error("Error al obtener los usuarios:"));
        return res.status(500).json({ error: error.message });
    }
})

//short polling
app.get("/users/:_id", async (req, res) => {
    try{
        const _idUser = req.params._id;
        console.log(_idUser);

        if(connections.has(_idUser)) {
            res.status(200).json({ connected: false })
        } else {
            if (!pendingRequests.has(_idUser)) {
                pendingRequests.set(_idUser, res);
            }
        }
    } catch (error) {
        signale.fatal(new Error("Error al obtener el usuario:"));
        return res.status(500).json({ error: error.message });
    }
})

wss.on('connection', async (ws) => {
    let currentUserId = null;

    try{
        const messages = await Messages.find();
        messages.forEach((message) => {
            ws.send(JSON.stringify(message));
        })
    } catch (error) {
        signale.fatal(new Error("Error al crear el usuario:"));
        return res.status(500).json({ error: error.message });
    }

    ws.on('message', async (message) => {
        try{
            const data = JSON.parse(message);
            console.log(data);
    
            if(data._idUser) {
                currentUserId = data._idUser;
                connections.set(currentUserId, ws);
                
                await new Messages(data.message).save();
    
                connections.forEach((client, clientId) => {
                    if(client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            }
        } catch (error) {
            signale.error(new Error("Error al procesar el mensaje para los clientes (WS):"));
        }
    });

    ws.on('close', () => {
        if(currentUserId) {
            connections.delete(currentUserId);
            console.log(currentUserId);
            console.log(pendingRequests);
            const userRequests = pendingRequests.get(currentUserId);
            if(userRequests) {
                userRequests.json({ connected: false });
                pendingRequests.delete(currentUserId);
            }
        }
    });
});

server.listen(port, () => {
    signale.success(`Servidor iniciado en el puerto ${port}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
})