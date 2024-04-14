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
const Warnings = require("./models/warningSchema");

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
let ids = [];

//long polling
app.get("/warnings/users/:_id", async (req, res) => {
    try{
        const _idUser = req.params._id;

        if(connections.has(_idUser)) {
            res.status(200).json({ connected: false })
        } else {
            ids.push(_idUser);
            console.log(ids);
            if (!pendingRequests.has(_idUser)) {
                pendingRequests.set(_idUser, res);
            }
        }
    } catch (error) {
        signale.fatal(new Error("Error al guardar el usuario de manera colgada:"));
        return res.status(500).json({ message: "No se pudo colgar el usuario", error: error.message });
    }
});

app.get("/warnings/:role", async (req, res) => {
    try{
        const warnings = await Warnings.find({roleUser: req.params.role});
        ids.forEach((_id) => {
            pendingRequests.get(_id).status(200).json(warnings);
            pendingRequests.delete(_id);
        });
        ids = [];
        return res.status(200).json({ message: "Respuestas enviadas"});
    } catch (error) {
        signale.fatal(new Error("Error al obtener los avisos:"));
        return res.status(500).json({ error: error.message });
    }    
})

wss.on('connection', async (ws) => {
    let currentUserId;


    ws.on('message', async (message) => {
        try{
            const data = JSON.parse(message);
            console.log(data);
    
            if(data._idUser) {
                currentUserId = data._idUser;
                connections.set(currentUserId, ws);
                signale.warn("Conectado => " + currentUserId);
                await new Messages(data).save();
    
                connections.forEach((client, clientId) => {
                    if(client.readyState === WebSocket.OPEN && clientId !== currentUserId) {
                        client.send(JSON.stringify(message));
                    }
                });
            }
        } catch (error) {
            signale.error(new Error("Error al procesar el mensaje para los clientes (WS):"));
        }
    });

    ws.on('close', () => {
        if(currentUserId) {            
            console.log(currentUserId);
            console.log(pendingRequests);
            connections.delete(currentUserId);
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