import Chat from "../models/chat.model.js";
import Order from "../models/order.model.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ 1. Suggested queries based on role
export const getSuggestedQueries = async (req, res) => {
  const { role } = req.query;

  const userSuggestions = [
    "Where is my order?",
    "How long will delivery take?",
    "Can you call me when you arrive?",
    "Please leave at the door",
    "Is my order on the way?",
  ];

  const deliverySuggestions = [
    "I'm 5 minutes away",
    "I'm at your location",
    "I can't find your address",
    "Your order will be slightly delayed",
    "Please come downstairs to receive",
  ];

  return res.json({
    success: true,
    suggestions: role === "deliveryBoy" ? deliverySuggestions : userSuggestions,
  });
};

// ✅ 2. Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const chats = await Chat.find({ orderId })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName role");
    return res.json({ success: true, chats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 3. Send message with AI check
export const sendMessage = async (req, res) => {
  try {
    const { orderId, message } = req.body;
    const userId = req.userId;

    const order = await Order.findById(orderId)
      .populate("user")
      .populate("shopOrders.assignedDeliveryBoy"); // ← delivery boy data comes from here

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isUser = order.user._id.toString() === userId.toString();
    const senderRole = isUser ? "user" : "deliveryBoy";

    // Save sender message
    await Chat.create({ orderId, sender: userId, senderRole, message });

    // Emit to room
    const io = req.app.get("io");
    io?.to(`order_${orderId}`).emit("chat:newMessage", {
      sender: userId,
      senderRole,
      message,
      createdAt: new Date(),
    });

    // Get recent chat history
    const history = await Chat.find({ orderId }).sort({ createdAt: -1 }).limit(10);
    const historyText = history.reverse().map((c) => `${c.senderRole}: ${c.message}`).join("\n");

    // ✅ Get delivery boy full data
    const shopOrder = order.shopOrders?.[0];
    const deliveryBoy = shopOrder?.assignedDeliveryBoy;

    // ✅ Get delivery boy live location
    let deliveryBoyLocation = null;
    if (shopOrder?.deliveryBoyLocation?.lat && shopOrder?.deliveryBoyLocation?.lng) {
      deliveryBoyLocation = shopOrder.deliveryBoyLocation;
    } else if (deliveryBoy?.location?.coordinates?.length === 2) {
      deliveryBoyLocation = {
        lat: deliveryBoy.location.coordinates[1],
        lng: deliveryBoy.location.coordinates[0],
      };
    }

    // ✅ Calculate rough distance if both locations available
    let distanceInfo = "unknown";
    if (
      deliveryBoyLocation &&
      order.address?.latitude &&
      order.address?.longitude
    ) {
      const R = 6371; // km
      const dLat = ((order.address.latitude - deliveryBoyLocation.lat) * Math.PI) / 180;
      const dLon = ((order.address.longitude - deliveryBoyLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((deliveryBoyLocation.lat * Math.PI) / 180) *
        Math.cos((order.address.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;
      const etaMinutes = Math.round((distKm / 20) * 60); // assuming 20km/h avg speed
      distanceInfo = `${distKm.toFixed(2)} km away, estimated ${etaMinutes} minutes`;
    }

    // ✅ Build delivery boy context string
    const deliveryBoyContext = deliveryBoy
      ? `
DELIVERY BOY INFORMATION:
- Name: ${deliveryBoy.fullName || "N/A"}
- Mobile: ${deliveryBoy.mobile || "N/A"}
- Status: ${shopOrder?.status || "N/A"}
- Current Location: ${deliveryBoyLocation ? `Lat ${deliveryBoyLocation.lat}, Lng ${deliveryBoyLocation.lng}` : "Location not available"}
- Distance from customer: ${distanceInfo}
- Is Online: ${deliveryBoy.isOnline ? "Yes" : "No"}
`
      : `DELIVERY BOY INFORMATION: Not yet assigned to this order`;

    // ✅ Build customer context string  
    const customerContext = `
CUSTOMER INFORMATION:
- Name: ${order.user?.fullName || "N/A"}
- Delivery Address: ${order.address?.text || "N/A"}
- Address Coordinates: Lat ${order.address?.latitude || "N/A"}, Lng ${order.address?.longitude || "N/A"}
- Payment Method: ${order.paymentMethod || "N/A"}
- Order Total: ₹${order.totalAmount || "N/A"}
`;

    // ✅ Build order items context
    const itemsContext = shopOrder?.items?.length
      ? `ORDER ITEMS: ${shopOrder.items.map((i) => `${i.name} x${i.quantity} (₹${i.price})`).join(", ")}`
      : "ORDER ITEMS: Not available";

    // ✅ AI call with full context
    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a food delivery app. You have full information about the order, delivery boy, and customer.

${customerContext}
${deliveryBoyContext}
${itemsContext}
ORDER STATUS: ${shopOrder?.status || "N/A"}

Your behavior rules:
- ALWAYS reply helpfully to every message — never say you don't know if you have the data above
- If customer asks "where is delivery boy" or "how long" → use the distance/ETA info above to answer
- If customer asks about delivery boy name/contact → provide it from the info above
- If delivery boy sends a message → relay it clearly to the customer and acknowledge it
- If something needs real human action (e.g "I cant find your building", "please come down") → start with HANDOFF: 
- Speak naturally and friendly, like a helpful support agent
- Keep responses under 2-3 sentences`,
        },
        {
          role: "user",
          content: `Chat history:\n${historyText}\n\nNew message from ${senderRole}: "${message}"\n\nReply as the AI assistant.`,
        },
      ],
    });

    const aiText = aiResponse.choices[0].message.content;
    const needsHandoff = aiText.startsWith("HANDOFF:");
    const aiMessage = needsHandoff ? aiText.replace("HANDOFF:", "").trim() : aiText;

    // Save AI message
    await Chat.create({
      orderId,
      sender: null,
      senderRole: "ai",
      message: aiMessage,
      isAiHandled: !needsHandoff,
      needsHumanHandoff: needsHandoff,
    });

    // Emit AI response
    io?.to(`order_${orderId}`).emit("chat:newMessage", {
      sender: null,
      senderRole: "ai",
      message: aiMessage,
      needsHandoff,
      createdAt: new Date(),
    });

    return res.json({ success: true, aiMessage, needsHandoff });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};