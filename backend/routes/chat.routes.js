import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getChatHistory, getSuggestedQueries, sendMessage } from "../controllers/chat.controller.js";

const chatRouter = express.Router();

chatRouter.get("/suggestions", isAuth, getSuggestedQueries);
chatRouter.get("/history/:orderId", isAuth, getChatHistory);
chatRouter.post("/send", isAuth, sendMessage);

export default chatRouter;