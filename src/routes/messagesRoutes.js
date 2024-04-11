const { Router } = require("express");
const Messages = require("../models/messagesSchema");
const signale = require("signale");

const messagesRouter = Router();

messagesRouter.get("/", async (req, res) => {
    try {
        const messages = await Messages.find();
        return res.status(200).json(messages);
    } catch (error) {
        signale.fatal(new Error("Error al obtener los mensajes:"));
        return res.status(500).json({ error: error.message });
    }
});

messagesRouter.get("/user/:_id", async (req, res) => {
    try {
        const messages = await Messages.aggregate([ 
            {
              $lookup: {
                from: "Users",
                localField: "_idUser",
                foreignField: "_id",
                as: "mensajesPorUsuario"
                }
            },
            {
              $match : {"_idUser": req.params._id }
            },
            ]);
        return res.status(200).json(messages);
    } catch (error) {
        signale.fatal(new Error("Error al obtener los mensajes:"));
        return res.status(500).json({ error: error.message });
    }
})

messagesRouter.get("/message/:_id", async (req, res) => {
    try {
        const message = await Messages.findById({_id: req.params._id});
        if (message){
            return res.status(200).json(message);
        } else {
            return res.status(404).json({ message: "Mensaje no encontrado" });
        }
    } catch (error){
        signale.fatal(new Error("Error al obtener el mensaje " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

messagesRouter.post("/", async (req, res) => {
    try {
        const message = new Messages(req.body);
        await message.save();
        return res.status(201).json({ message: "Mensaje creado exitosamente" });
    } catch (error) {
        signale.fatal(new Error("Error al crear el mensaje:"));
        return res.status(500).json({ error: error.message });
    }
});

messagesRouter.put("/message/:_id", async (req, res) => {
    try {
        const result = await Messages.findByIdAndUpdate(req.params._id, req.body, {new: true});
        if(result){
            return res.status(200).json(result);
        } else{
            return res.status(404).json({ message: "Mensaje no encontrado" });
        }
    } catch (error) {
        signale.fatal(new Error("Error al actualizar el mensaje " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

messagesRouter.delete("/message/:_id", async (req, res) => {
    try {
        const result = await Messages.findByIdAndDelete(req.params._id);
        if(result){
            return res.status(204).json({ message: "Mensaje eliminado exitosamente" });
        } else{
            return res.status(404).json({ message: "Mensaje no encontrado" });
        }     
    } catch (error) {
        signale.fatal(new Error("Error al eliminar el mensaje " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

module.exports = messagesRouter;