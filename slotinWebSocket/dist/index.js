"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const redis_1 = require("redis");
require("dotenv").config();
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const httpServer = app.listen(8080, () => {
    console.log("Server is Running");
});
const prisma = new client_1.PrismaClient();
const Redis = (0, redis_1.createClient)({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 12761,
    },
});
Redis.on("error", (err) => {
    console.log("Redis Client Error : ", err);
});
const wss = new ws_1.WebSocketServer({ server: httpServer });
const clients = new Map();
wss.on("connection", (ws) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("New WebSocket Connection");
    ws.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
        const { event, data } = JSON.parse(message.toString());
        console.log(JSON.parse(message.toString()));
        if (event === "createUser") {
            createUser(data, ws);
        }
    }));
    const msg = {
        event: "connected",
        data: "Connected to Server",
    };
    ws.send(JSON.stringify(msg));
}));
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};
const MainSever = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Redis.connect();
        console.log("Redis is Up");
        while (true) {
            const appointment = yield Redis.brPop("appointments", 0);
            if (!appointment) {
                continue;
            }
            const appointmentdata = JSON.parse(appointment.element);
            console.log("Appointment Data : ", appointmentdata);
            const { SpaceId, userId, Time, appointments } = appointmentdata;
            const timeInMinutes = timeToMinutes(Time);
            for (let appointment of appointments) {
                const fromtime = timeToMinutes(appointment.fromtime);
                const totime = timeToMinutes(appointment.totime);
                // Check if the requested time falls within any already booked slots
                if (timeInMinutes >= fromtime && timeInMinutes < totime) {
                    console.log("Slot Already Booked");
                    notifyUser(userId, "Slot Already Booked", false, false);
                    return;
                }
            }
            // Create the new appointment
            const newappointment = yield prisma.appointments.create({
                data: {
                    spaceId: SpaceId,
                    fromtime: Time,
                    totime: parseInt(Time.split(":")[1]) + 15 >= 60
                        ? (parseInt(Time.split(":")[0]) + 1).toString().padStart(2, "0") +
                            ":00"
                        : Time.split(":")[0] +
                            ":" +
                            (parseInt(Time.split(":")[1]) + 15).toString().padStart(2, "0"),
                    userId: userId,
                },
            });
            console.log("Appointment Created : ", newappointment);
            notifyUser(userId, "Appointment Created", true, false);
            const SpaceOwner = yield prisma.spaceItems.findFirst({
                where: {
                    id: SpaceId,
                },
            });
            if (SpaceOwner) {
                notifyUser(SpaceOwner === null || SpaceOwner === void 0 ? void 0 : SpaceOwner.userId, "New Appointment Recieved", true, true);
            }
        }
    }
    catch (error) {
        console.log("Error in Main Server : ", error);
    }
});
MainSever();
// Function to create User
const createUser = (data, client) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Creating User");
        clients.set(data.id, client);
    }
    catch (error) {
        console.log("Error in Creating User : ", error);
    }
});
// Function to Notify User
function notifyUser(userId, message, status, isSpaceOwner) {
    const user = clients.get(userId);
    console.log("User : ", userId);
    if (clients.has(userId)) {
        user === null || user === void 0 ? void 0 : user.send(JSON.stringify({
            event: "appointment-status",
            data: {
                status,
                message,
                isSpaceOwner
            },
        }));
    }
}
