import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null = AI
  senderRole: { type: String, enum: ["user", "deliveryBoy", "ai"] },
  message: { type: String, required: true },
  isAiHandled: { type: Boolean, default: false },
  needsHumanHandoff: { type: Boolean, default: false },
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;