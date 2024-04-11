const { Schema, model } = require("mongoose");

const messagesSchema = new Schema({
    message: { type: String, required: true },
    date: { type: Date, required: true },
    _idUser: { type: Schema.Types.ObjectId, required: true, ref: 'Users' },
});

const Messages = model("Messages", messagesSchema);

module.exports = Messages;