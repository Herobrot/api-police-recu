const { Router } = require("express");
const Warnings = require("../models/warningSchema");
const signale = require("signale");

const warningRouter = Router();

warningRouter.get("/", async (req, res) => {
    try {
        const warnings = await Warnings.find();
        return res.status(200).json(warnings);
    } catch (error) {
        signale.fatal(new Error("Error al obtener los avisos:"));
        return res.status(500).json({ error: error.message });
    }
});

warningRouter.get("/:role", async (req, res) => {
    try{
        const warnings = await Warnings.find({roleUser: req.params.role});
        return res.status(200).json(warnings);
    } catch (error) {
        signale.fatal(new Error("Error al obtener los avisos:"));
        return res.status(500).json({ error: error.message });
    }
});

warningRouter.get("/warning/:_id", async (req, res) => {
    try {
        const aviso = await Warnings.findById({_id: req.params._id});
        if (aviso){
            return res.status(200).json(aviso);
        } else {
            return res.status(404).json({ message: "Aviso no encontrado" });
        }
    } catch (error){
        signale.fatal(new Error("Error al obtener el aviso " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

warningRouter.post("/", async (req, res) => {
    try {
        const aviso = new Warnings(req.body);
        await aviso.save();
        return res.status(201).json({ message: "Aviso creado exitosamente" });
    } catch (error) {
        signale.fatal(new Error("Error al crear el aviso:"));
        return res.status(500).json({ error: error.message });
    }
});

warningRouter.put("/message/:_id", async (req, res) => {
    try {
        const result = await Warnings.findByIdAndUpdate(req.params._id, req.body, {new: true});
        if(result){
            return res.status(200).json(result);
        } else{
            return res.status(404).json({ message: "Aviso no encontrado" });
        }
    } catch (error) {
        signale.fatal(new Error("Error al actualizar el aviso " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

warningRouter.delete("/:_id", async (req, res) => {
    try {
        const result = await Warnings.findByIdAndDelete(req.params._id);
        if(result){
            return res.status(204).json({ message: "Aviso eliminado exitosamente" });
        } else{
            return res.status(404).json({ message: "Aviso no encontrado" });
        }     
    } catch (error) {
        signale.fatal(new Error("Error al eliminar el aviso " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

module.exports = warningRouter;