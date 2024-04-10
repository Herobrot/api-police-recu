import { Router } from "express";
import signale from "signale";
import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";
import bcrypt from "bcrypt";

const jwtSecretKey = process.env.SECRET_JWT;
const userRouter = Router();

function createToken(user) {
    const payload = {userId: user._id};

    const expiration = '1h';

    return jwt.sign(payload, jwtSecretKey, { expiresIn: expiration });
}

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Sin autorización' });
      }
    
    jwt.verify(token, jwtSecretKey, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'El token no es válido' });
      }
      req.user = user;
      next();
    });
}

userRouter.get("/:_id", authenticateToken, async (req, res) => {
    try {
        const usuario = await User.findById({_id: req.params._id});
        if (usuario){
            return res.status(200).json(usuario);
        } else {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error){
        signale.fatal(new Error("Error al obtener el usuario " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

userRouter.post("/user", async (req, res) => {
    try {
        const { badgeNumber, password } = req.body;
        const userFound = await User.findOne({badgeNumber: badgeNumber});

        if (!userFound) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const isCorrectPass = bcrypt.compareSync(password, userFound.password);

        if (!isCorrectPass) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = createToken(userFound);

        return res.status(201).json({ token, userFound });
    } catch (error) {
        signale.fatal(new Error('Error al iniciar sesión:'));
        return res.status(500).json({ error: error.message });
    }
})

userRouter.post("/", async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            lastName: req.body.lastName,
            badgeNumber: req.body.badgeNumber,
            password: bcrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS_BCRYPT)),
            role: req.body.role
        });

        const userExist = await User.findOne({badgeNumber: user.badgeNumber});

        if (userExist) {
            return res.status(400).json({ message: "Ya existe un usuario con ese numero de placa" });
        }

        const result = await user.save();
        if (result) {
            const token = createToken(result);
            return res.status(201).json({ token, result });
        } else {
          return res.status(500).json({ error: 'Error en la inserción de datos' });
        }
    } catch (error) {
        signale.fatal(new Error("Error al crear el usuario:"));
        return res.status(500).json({ error: error.message });
    }
});

userRouter.put("/user/:_id", async (req, res) => {
    try {
        const item = {
            name: req.body.name,
            lastName: req.body.lastName,
            badgeNumber: req.body.badgeNumber,
            password: bcrypt.hashSync(req.body.password, process.env.SALT_ROUNDS_BCRYPT),
            role: req.body.role
        }

        const result = await User.findByIdAndUpdate(req.params._id, item, {new: true});
        if(result){
            return res.status(200).json(result);
        } else{
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error) {
        signale.fatal(new Error("Error al actualizar el usuario " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

userRouter.delete("/user/:_id", async (req, res) => {
    try {
        const result = await User.findByIdAndDelete(req.params._id);
        if(result){
            return res.status(204).json({ message: "Usuario eliminado exitosamente" });
        } else{
            return res.status(404).json({ message: "Usuario no encontrado" });
        }     
    } catch (error) {
        signale.fatal(new Error("Error al eliminar el usuario " + req.params._id + ":"));
        return res.status(500).json({ error: error.message });
    }
});

export default userRouter;