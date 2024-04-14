const { Router } = require("express");
const signale = require("signale");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema.js");
const bcrypt = require("bcrypt");
const { Types } = require("mongoose");

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const userRouter = Router();

function createToken(user) {
    const payload = {_id: user._id};

    const expiration = '1h';
    return jwt.sign(payload, jwtSecretKey, { expiresIn: expiration });
}

function authenticateToken(req, res, next) {
    const token = req.headers['Authorization'];

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

userRouter.get("/:_id", async(req, res) => {
    try {
        const user = await User.findById(req.params._id);
        if(user){
            return res.status(200).json(user);
        } else {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error) {
        
    }    
})

userRouter.get("/roles/:role", async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const users = await User.find({role: req.params.role}).nor({_id: req.query._id}).skip(skip).limit(limit);
        if (users){
            return res.status(200).json(users);
        } else {
            return res.status(404).json({ message: "No existen usuarios" });
        }
    } catch (error){
        signale.fatal(new Error("Error al obtener los usuarios:"));
        return res.status(500).json({ error: error.message });
    }
})

userRouter.get("/messages/user/:_id", async(req, res) => {
    try {
        const _idUser = new Types.ObjectId(req.params._id);
        const messages = await User.aggregate([
            {
                $lookup: {
                    from: "messages",
                    localField: "_id",
                    foreignField: "_idUser",
                    as: "messages"
                }
            },
            {
                $match: {
                    _id: _idUser
                }
            },
            {
                $unwind: {
                    path: "$messages",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    message: "$messages.message",
                    date: "$messages.date"
                }
            },
            {
                $sort: {
                    "messages.date": -1
                }
            }
        ]);
        if(messages && messages.length > 0 || messages[0].messages != null){
            return res.status(200).json(messages);
        } else {
            return res.status(404).json({ message: "No existen mensajes" });
        }
    } catch (error) {
        signale.fatal(new Error("Error al obtener los mensajes:"));
        return res.status(500).json({ error: error.message });
    }
});

userRouter.get("/notifications/user/:_id", async (req, res) => {
    try {
        const _idUser = new Types.ObjectId(req.params._id);
        const notifications = await User.aggregate([
            {
                $lookup: {
                    from: "notifications",
                    localField: "_id",
                    foreignField: "_idUser",
                    as: "notifications"
                }
            },
            {
                $match: {
                    _id: _idUser
                }
            },
            {
                $unwind: {
                    path: "$notifications",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    title: "$notifications.title",
                    body: "$notifications.body",
                    date: "$notifications.date",
                    category: "$notifications.category",
                    categoryUser: "$notifications.categoryUser"
                }
            },
            {
                $sort: {
                    "notifications.date": -1
                }
            }
        ]);

        if(notifications && notifications.length > 0){
            return res.status(200).json(notifications);
        }
        else{
            return res.status(404).json({ message: "No existen notificaciones" });
        }
    } catch (error) {
        signale.fatal(new Error("Error al obtener las notificaciones:"));
        return res.status(500).json({ error: error.message });
    }
})

userRouter.get("/user/:_id", authenticateToken, async (req, res) => {
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
        signale.warn("Contraseña: " + password, "Placa: " + badgeNumber);
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
            signale.warn("Ya existe un usuario con ese numero de placa");
            return res.status(400).json({ message: "Ya existe un usuario con ese numero de placa" });
        }

        const result = await user.save();
        if (result) {
            const token = createToken(user);
            signale.warn("Token creado");
            return res.status(201).json({ token, user });
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

module.exports = userRouter;