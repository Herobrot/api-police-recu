import { Router } from "express";
import Notifications from "../models/notificationsSchema";
import signale from "signale";

const notificationRouter = Router();

notificationRouter.get("/", async (req, res) => {
    try {
        const notifications = await Notifications.find();
        return res.status(200).json(notifications);
    } catch (error) {
        signale.fatal(new Error("Error al obtener las notificaciones:"));
        return res.status(500).json({ error: error.message });
    }
});

notificationRouter.get("/notification/:_id", async (req, res) => {
    try {
        const notificacion = await Notifications.findById({_id: req.params._id});
        if (notificacion){
            return res.status(200).json(notificacion);
        } else {
            return res.status(404).json({ message: "Notificacion no encontrada" });
        }
    } catch (error){
        signale.fatal(new Error("Error al obtener la notificacion " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

notificationRouter.get("/user/:_id", async (req, res) => {
    try {
        const notifications = await Notifications.find({user: req.params._id});
        if (notifications){
            return res.status(200).json(notifications);
        } else {
            return res.status(404).json({ message: "Notificacion no encontrada" });
        }
    } catch (error){
        signale.fatal(new Error("Error al obtener la notificacion " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }    
})

notificationRouter.post("/", async (req, res) => {
    try {
        const notification = new Notifications(req.body);
        await notification.save();
        return res.status(201).json({ message: "Notificacion creada exitosamente" });
    } catch (error) {
        signale.fatal(new Error("Error al crear la notificacion:"));
        return res.status(500).json({ error: error.message });
    }
});

notificationRouter.put("/notification/:_id", async (req, res) => {
    try {
        const result = await Notifications.findByIdAndUpdate(req.params._id, req.body, {new: true});
        if(result){
            return res.status(200).json(result);
        } else{
            return res.status(404).json({ message: "Notificacion no encontrada" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

notificationRouter.delete("/notification/:_id", async (req, res) => {
    try {
        const result = await Notifications.findByIdAndDelete(req.params._id);
        if(result){
            return res.json({ message: "Notificacion eliminada exitosamente" });
        } else{
            return res.status(404).json({ message: "Notificacion no encontrada" });
        }     
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default notificationRouter;