import { Schema, model } from "mongoose";

const ECategoryWarning ={
    "Robo" : "Robo",
    "Accidente" : "Accidente",
    "Avistamiento" : "Avistamiento",
    "Secuestro" : "Secuestro",
    "Vandalismo" : "Vandalismo",
    "Allanamiento de morada" : "Allanamiento de morada",
    "Trata de personas" : "Trata de personas",
    "Otros" : "Otros"
}

const EStatusWarning ={
    "Reciente" : "Reciente",
    "En curso" : "En curso",
    "Finalizado" : "Finalizado"
}

const warningsSchema = new Schema({
    message: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true, enum: ECategoryWarning },
    status: { type: String, required: true, enum: EStatusWarning },
    roleUser: { type: String, required: true }
});

const Warnings = model("Warnings", warningsSchema);

export default Warnings;