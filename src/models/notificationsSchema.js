const { Schema, model } = require("mongoose");

const ECategoryNotifications = {
    "Recordatorio" : "Recordatorio",
    "Registro" : "Registro",
    "Estatus" : "Estatus",
}

const notificationsSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true, enum: ECategoryNotifications },
    _idUser: { type: Schema.Types.ObjectId, ref: "User" }
});

const Notifications = model("Notifications", notificationsSchema);

module.exports = Notifications;