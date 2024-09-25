import express from "express";
import { WebSocketServer } from "ws";
import { createClient } from "redis";
require("dotenv").config();
import { PrismaClient } from "@prisma/client";

const app = express();
const httpServer = app.listen(8080, () => {
  console.log("Server is Running");
});
const prisma = new PrismaClient();

const Redis = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: 12761,
  },
});

Redis.on("error", (err) => {
  console.log("Redis Client Error : ", err);
});

const wss = new WebSocketServer({ server: httpServer });
type Client = WebSocket & { id?: string };
const clients = new Map<string, Client>();

wss.on("connection", async (ws) => {
  console.log("New WebSocket Connection");
  ws.on("message", async (message) => {
    const { event, data } = JSON.parse(message.toString());
    console.log(JSON.parse(message.toString()));
    if (event === "createUser") {
      createUser(data , ws);
    }
  });
  const msg = {
    event: "connected",
    data: "Connected to Server",
  };
  ws.send(JSON.stringify(msg));
});

const timeToMinutes = (time: any) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const MainSever = async () => {
  try {
    await Redis.connect();
    console.log("Redis is Up");
    while (true) {
      const appointment = await Redis.brPop("appointments", 0);
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
          notifyUser(userId, "Slot Already Booked" , false , false);
          return;
        }
      }

      // Create the new appointment
      const newappointment = await prisma.appointments.create({
        data: {
          spaceId: SpaceId,
          fromtime: Time,
          totime:
            parseInt(Time.split(":")[1]) + 15 >= 60
              ? (parseInt(Time.split(":")[0]) + 1).toString().padStart(2, "0") +
                ":00"
              : Time.split(":")[0] +
                ":" +
                (parseInt(Time.split(":")[1]) + 15).toString().padStart(2, "0"),
          userId: userId,
        },
      });
      console.log("Appointment Created : ", newappointment);
      notifyUser(userId, "Appointment Created" , true , false);
      const SpaceOwner = await prisma.spaceItems.findFirst({
        where: {
          id: SpaceId,
        },
      });
      if(SpaceOwner){
        notifyUser(SpaceOwner?.userId, "New Appointment Recieved" , true , true);
      }
      
    }
  } catch (error) {
    console.log("Error in Main Server : ", error);
  }
};

MainSever();

// Function to create User

const createUser = async (data: any , client: any) => {
  try {
    console.log("Creating User");
    clients.set(data.id, client);
  } catch (error) {
    console.log("Error in Creating User : ", error);
  }
};

// Function to Notify User
function notifyUser(userId: string, message: string , status : boolean ,isSpaceOwner : boolean) {
  const user = clients.get(userId);
  console.log("User : ", userId);
  if (clients.has(userId)) {
    user?.send(
      JSON.stringify({
        event: "appointment-status",
        data: {
          status,
          message,
          isSpaceOwner
        },
      })
    );
  }
}
