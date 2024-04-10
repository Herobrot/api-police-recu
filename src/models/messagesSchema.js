import { Schema, model } from "mongoose";

const messagesSchema = new Schema({
    message: { type: String, required: true },
    date: { type: Date, required: true },
    _idUser: { type: Schema.Types.ObjectId, required: true, ref: 'Users' },
});

const Messages = model("Messages", messagesSchema);

export default Messages;