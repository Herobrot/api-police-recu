import { Schema, model } from "mongoose";

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
    categoryUser: { type: [String], required: true },
    _idUser: { type: Schema.Types.ObjectId, ref: "User" }
});

const Notifications = model("Notifications", notificationsSchema);

export default Notifications;