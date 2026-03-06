import { sendOtpToUser } from "../config/mail.js";
import dotenv from "dotenv"
dotenv.config()
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import Razorpay from "razorpay"

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ✅ Place order controller (fixed)


export const placeOrder = async (req, res) => {
  try {
    const { cartItems, address, paymentMethod } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    if (!address || !address.text || !address.latitude || !address.longitude) {
      return res.status(400).json({
        success: false,
        message: "Address (text, latitude, longitude) is required",
      });
    }

    // 🟢 Group items by shop
    const groupedByShop = {};
    cartItems.forEach((item) => {
      const shopId = item.shop;
      if (!groupedByShop[shopId]) groupedByShop[shopId] = [];
      groupedByShop[shopId].push(item);
    });

    // 🟢 Shop Orders banao
    const shopOrders = await Promise.all(
      Object.keys(groupedByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");
        if (!shop) throw new Error(`Shop not found: ${shopId}`);

        const items = groupedByShop[shopId];
        const subtotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0
        );

        return {
          shop: shop._id,
          owner: shop.owner._id,
          items: items.map((i) => ({
            item: i.id,
            name: i.name,
            price: Number(i.price),
            quantity: Number(i.quantity),
          })),
          subtotal,
          status: "pending",
        };
      })
    );


    // 🟢 Total + Delivery Fee
    let totalAmount = shopOrders.reduce((sum, so) => sum + so.subtotal, 0);


    console.log("✅ Total Amount to charge:", totalAmount);

    // 🟢 Online Payment (Razorpay)
    if (paymentMethod === "online") {
      const razorOrder = await instance.orders.create({
        amount: Math.round(totalAmount * 100), // paise me (integer hona chahiye)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      let newOrder = await Order.create({
        user: req.userId,
        address,
        paymentMethod,
        totalAmount,
        shopOrders,
        razorpayOrderId: razorOrder.id,
        payment: false,
      });

      return res.status(200).json({
        success: true,
        razorOrder,
        orderId: newOrder._id,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    // 🟢 COD Order
    let newOrder = await Order.create({
      user: req.userId,
      address,
      paymentMethod,
      totalAmount,
      shopOrders,
      payment: false,
    });

    const user = await User.findById(req.userId);
    user.orders.push(newOrder._id);
    await user.save();

    const io = req.app.get("io");
    const order = await Order.findById(newOrder._id)
      .sort({ createdAt: -1 })
      .populate("user");

    if (io) {
      order.shopOrders.forEach(shopOrder => {
        io.emit("orders:new", {
          ownerId: shopOrder.owner.toString(),
          order: {
            _id: order._id,
            user: order.user,
            address: order.address,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            shopOrder,
          },
        });
      });
    }

    return res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    console.error("❌ Place order error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



export const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_payment_id, orderId } = req.body;

    // 🔹 Razorpay payment fetch
    const payment = await instance.payments.fetch(razorpay_payment_id);

    if (!payment || payment.status !== "captured") {
      return res.status(400).json({ success: false, message: "Payment failed or not captured" });
    }

    // 🔹 Update order
    const order = await Order.findById(orderId)
      .sort({ createdAt: -1 })
      .populate("user");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.payment = true;
    order.razorpayPaymentId = razorpay_payment_id;

    order.shopOrders.forEach(shopOrder => {
      shopOrder.status = "pending";
    });

    await order.save();
    const io = req.app.get("io");

    if (io) {
      order.shopOrders.forEach(shopOrder => {
        io.emit("orders:new", {
          ownerId: shopOrder.owner.toString(),
          order: {
            _id: order._id,
            user: order.user,
            address: order.address,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            shopOrder,
          },
        });
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Verify Razorpay Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate("shopOrders.shop", "name")
      .populate("shopOrders.owner", "name email mobile")
      .populate("shopOrders.items.item", "name price image");

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching my orders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOwnerOrders = async (req, res) => {
  try {
    const ownerId = req.userId; // Auth middleware se aayega

    // Sabhi orders find karo jisme shopOrders me owner match karta ho
    const orders = await Order.find({ "shopOrders.owner": ownerId })
      .sort({ createdAt: -1 })
      .populate("user") // Customer info
      .populate("shopOrders.shop", "name")  // Shop name
      .populate("shopOrders.items.item", "name image")
      .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");  // Item info

    // Filter karke sirf owner ke relevant shopOrders bhejna
    const filteredOrders = orders.map(order => ({
      _id: order._id,
      user: order.user,
      address: order.address,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      shopOrder: order.shopOrders.find(
        so => so.owner.toString() === ownerId.toString()
      )
    }));

    return res.json({ success: true, orders: filteredOrders });

  } catch (error) {
    console.error("Get owner orders error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const updateOwnerOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;

    let order = await Order.findById(orderId)
      .populate("shopOrders.shop", "name")
      .populate("shopOrders.assignedDeliveryBoy", "fullName name mobile");

    // console.log("orderz:",order);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const shopOrder = order.shopOrders.find(so => so.shop._id.toString() === shopId);
    if (!shopOrder) {
      return res.status(404).json({ success: false, message: "Shop order not found" });
    }

    shopOrder.status = status;

    let deliveryBoysPayload = [];
    let assignment = null;

    if (status === "out of delivery" && !shopOrder.assignedDeliveryBoy) {
      const { longitude, latitude } = order.address || {};

      if (Number.isFinite(Number(longitude)) && Number.isFinite(Number(latitude))) {
        // nearby online riders
        const nearby = await User.find({
          role: "deliveryBoy",
          isOnline: true,
          socketId: { $ne: null },
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
              $maxDistance: 5000
            }
          }
        }).select("_id fullName mobile socketId location");

        // busy riders in ONE query
        const nearbyIds = nearby.map(b => b._id);
        const busyIds = await DeliveryAssignment.find({
          assignedTo: { $in: nearbyIds },
          status: { $nin: ["delivered", "completed", "cancelled", "expired"] }
        }).distinct("assignedTo");

        const busySet = new Set(busyIds.map(id => String(id)));
        const availableBoys = nearby.filter(b => !busySet.has(String(b._id)));

        const candidates = availableBoys.map(d => d._id);

        // clear stale deliveryBoyLocation before broadcasting
        shopOrder.deliveryBoyLocation = undefined;

        if (candidates.length === 0) {
          await order.save();
          return res.json({
            success: true,
            message: "Order status updated, but no available delivery boys nearby",
            shopOrder,
            assignmentId: null,
            deliveryBoys: [],
            deliveryBoy: null,
          });
        }

        // create assignment
        assignment = await DeliveryAssignment.create({
          order: order._id,
          shop: shopOrder.shop,
          shopOrderId: shopOrder._id,
          broadcastedTo: candidates,
          status: "broadcasted"
        });

        shopOrder.assignment = assignment._id;

        // payload
        deliveryBoysPayload = availableBoys.map(b => ({
          id: b._id,
          name: b.fullName,
          mobile: b.mobile,
          socketId: b.socketId,
          latitude: b.location?.coordinates?.[1] ?? null,
          longitude: b.location?.coordinates?.[0] ?? null
        }));

        // notify
        const io = req.app.get("io");
        availableBoys.forEach(b => {
          if (b.socketId && io) {
            io.to(b.socketId).emit("delivery:newAssignment", {
              sentTo: b._id,
              assignmentId: assignment._id,
              orderId: order._id,
              shopId,
              shopName: shopOrder.shop?.name,
              address: order.address,
              items: shopOrder.items.map(i => ({
                name: i.name,
                qty: i.quantity,
                price: i.price,
                image: i.item?.image
              })),
              subtotal: shopOrder.subtotal,
            });
          }
        });
      }
    }

    await order.save();

    // repopulate

    order = await Order.findById(orderId)
      .populate("shopOrders.shop", "name")
      .populate("shopOrders.assignedDeliveryBoy", "fullName name mobile");

    const updatedShopOrder = order.shopOrders.find(
      so => so.shop._id.toString() === shopId
    );

    // 🔹 Yahi emit karna hai
    const io = req.app.get("io");
    if (io) {
      io.emit("orders:statusUpdated", {
        shopOrder: updatedShopOrder,
        orderId: order._id
      });
    }

    return res.json({
      success: true,
      message: "Order status updated",
      shopOrder: updatedShopOrder,
      assignmentId: assignment?._id || updatedShopOrder.assignment || null,
      deliveryBoys: deliveryBoysPayload,
      deliveryBoy: updatedShopOrder.assignedDeliveryBoy || null,
    });
  }


  catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};






export const getDeliveryBoyAssignments = async (req, res) => {
  try {
    const deliveryBoyId = req.userId; // token se niklega

    const assignments = await DeliveryAssignment.find({
      broadcastedTo: deliveryBoyId,
      status: "broadcasted",
    })
      .populate("order")
      .populate("shop");

    // filter only useful info
    const formatted = assignments.map(a => ({
      assignmentId: a._id,
      orderId: a.order._id,
      shopName: a.shop?.name || "Unknown Shop",
      address: a.order.address,
      items: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId))?.items || [],
      subtotal: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId))?.subtotal || 0
    }));

    return res.json({ success: true, assignments: formatted });
  } catch (error) {
    console.error("Get delivery boy assignments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const acceptAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.userId;

    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (assignment.status !== "broadcasted") {
      return res.status(400).json({ success: false, message: "Assignment already taken/expired" });
    }

    // Do not allow accepting if rider already has an active assignment
    const alreadyActive = await DeliveryAssignment.findOne({
      assignedTo: userId,
      status: { $nin: ["delivered", "completed", "cancelled"] }
    });
    if (alreadyActive) {
      return res.status(400).json({ success: false, message: "You already have an active order" });
    }

    // update assignment
    assignment.status = "assigned";
    assignment.assignedTo = userId;
    assignment.acceptedAt = new Date();
    await assignment.save();

    // update order shopOrder
    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    if (!shopOrder) {
      return res.status(404).json({ success: false, message: "ShopOrder not found" });
    }

    shopOrder.assignedDeliveryBoy = userId;
    shopOrder.status = "out of delivery";

    // seed initial deliveryBoyLocation from rider's last known user.location (if exists)
    const boy = await User.findById(userId).select("fullName mobile location");
    if (boy?.location?.coordinates?.length === 2) {
      shopOrder.deliveryBoyLocation = {
        lat: Number(boy.location.coordinates[1]),
        lng: Number(boy.location.coordinates[0]),
      };
    } else {
      // leave undefined/null – don't put 0,0
      shopOrder.deliveryBoyLocation = undefined;
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order assigned successfully",
      assignmentId,
      orderId: order._id,
      shopId: assignment.shop,
      deliveryBoy: { fullName: boy?.fullName, mobile: boy?.mobile },
    });
  } catch (err) {
    console.error("Accept assignment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $in: ["assigned", "enroute"] }
    })
      .populate({
        path: "order",
        populate: [{ path: "user", select: "fullName name mobile email" }],
      })
      .populate("shop")
      .populate("assignedTo", "fullName name mobile location");

    // case 1: deliveryAssignment hi nahi mila
    if (!assignment) {
      return res.json({ success: true, order: null });
    }

    // case 2: assignment me order null aa gaya
    if (!assignment.order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // case 3: order me shopOrders missing hai
    if (!Array.isArray(assignment.order.shopOrders)) {
      return res.status(404).json({ success: false, message: "No shopOrders found in order" });
    }

    const shopOrder = assignment.order.shopOrders.find(
      so => String(so._id) === String(assignment.shopOrderId)
    );

    if (!shopOrder) {
      return res.json({ success: false, message: "Shop order not found" });
    }

    shopOrder.assignedDeliveryBoy = assignment.assignedTo;

    // delivery boy coords
    let deliveryBoyLocation = null;
    if (assignment.assignedTo?.location?.coordinates?.length === 2) {
      const [lng, lat] = assignment.assignedTo.location.coordinates.map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        deliveryBoyLocation = { lat, lng };
      }
    } else if (shopOrder.deliveryBoyLocation) {
      const lat = Number(shopOrder.deliveryBoyLocation.lat);
      const lng = Number(shopOrder.deliveryBoyLocation.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        deliveryBoyLocation = { lat, lng };
      }
    }

    // customer location
    const customer = (assignment.order.address &&
      Number.isFinite(Number(assignment.order.address.latitude)) &&
      Number.isFinite(Number(assignment.order.address.longitude)))
      ? {
        lat: Number(assignment.order.address.latitude),
        lng: Number(assignment.order.address.longitude),
      }
      : null;

    return res.json({
      success: true,
      order: {
        _id: assignment.order._id,
        user: assignment.order.user,
        address: assignment.order.address,
        shopOrder,
        deliveryBoyLocation,
        customer,
      },
    });

  } catch (error) {
    console.error("Get current order error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




export const updateDeliveryBoyLocation = async (req, res) => {
  try {
    const { longitude, latitude, orderId, shopOrderId } = req.body;

    const lon = Number(longitude);
    const lat = Number(latitude);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return res.status(400).json({ success: false, message: "Valid longitude & latitude required" });
    }

    // 1) Update rider's user doc
    await User.findByIdAndUpdate(req.userId, {
      location: { type: "Point", coordinates: [lon, lat] },
    });

    // 2) Also update in the specific shopOrder (if IDs present)
    if (orderId && shopOrderId) {
      const order = await Order.findById(orderId);
      if (order) {
        const shopOrder = order.shopOrders.id(shopOrderId);
        if (shopOrder) {
          shopOrder.deliveryBoyLocation = { lat, lng: lon };
          await order.save();
        }
      }
    }

    // 3) Emit live update
    const io = req.app.get("io");
    if (io) {
      io.emit("delivery:locationUpdate", {
        deliveryBoyId: req.userId,
        longitude: lon,
        latitude: lat,
        orderId,
        shopOrderId
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};







export const myLocation = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.location) {
      return res.json({ success: false, message: "Location not found" });
    }
    res.json({ success: true, location: user.location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate("user") // customer
      .populate({
        path: "shopOrders.shop",
        model: "Shop",
      })
      .populate({
        path: "shopOrders.assignedDeliveryBoy",
        model: "User",
      })
      .populate({
        path: "shopOrders.items.item",
        model: "Item",
      })
      .lean();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getDeliveryBoyLocation = async (req, res) => {
  const { orderId, shopOrderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate("shopOrders.assignedDeliveryBoy", "fullName mobile location")
      .exec();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const shopOrder = order.shopOrders.id(shopOrderId);
    if (!shopOrder) {
      return res.status(404).json({ success: false, message: "Shop order not found" });
    }

    const dest =
      order.address && Number.isFinite(Number(order.address.latitude)) && Number.isFinite(Number(order.address.longitude))
        ? { latitude: Number(order.address.latitude), longitude: Number(order.address.longitude) }
        : null;

    // Prefer shopOrder.deliveryBoyLocation, else user's last known location
    let deliveryBoyLocation = null;
    if (shopOrder.deliveryBoyLocation) {
      const lat = Number(shopOrder.deliveryBoyLocation.lat);
      const lng = Number(shopOrder.deliveryBoyLocation.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        deliveryBoyLocation = { lat, lng };
      }
    } else if (shopOrder.assignedDeliveryBoy?.location?.coordinates?.length === 2) {
      const [lng, lat] = shopOrder.assignedDeliveryBoy.location.coordinates.map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        deliveryBoyLocation = { lat, lng };
      }
    }

    return res.json({
      success: true,
      deliveryBoyLocation, // may be null (frontend handles this)
      destination: dest,   // { latitude, longitude } or null
      deliveryBoyAvailable: Boolean(deliveryBoyLocation)
    });
  } catch (err) {
    console.error("Error fetching delivery boy location:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// 🔹 Step 1: Send OTP
export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;
    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order?.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }


    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP in DB temporarily
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry
    await order.save();   // ✅ parent ko save karo
    // console.log(order.user);
    // console.log(otp);
    // Send OTP to user (SMS / Email)
    await sendOtpToUser(order.user, otp);

    return res.json({
      success: true,
      message: `OTP sent to ${order.user.fullName}`,
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// 🔹 Step 2: Verify OTP
export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;
    const order = await Order.findById(orderId);
    const shopOrder = order?.shopOrders.id(shopOrderId);

    if (!shopOrder) {
      return res.status(404).json({ success: false, message: "Shop Order not found" });
    }

    if (
      shopOrder.deliveryOtp != otp ||
      !shopOrder.otpExpiresAt ||
      shopOrder.otpExpiresAt < Date.now()
    ) {
      return res.json({ success: false, message: "Invalid or expired OTP" });
    }

    // Mark delivered
    shopOrder.status = "delivered";
    shopOrder.deliveryOtp = null;
    shopOrder.otpExpiresAt = null;
    shopOrder.deliveredAt = new Date();
    await order.save();   // ✅ parent ko save karo
    const assignment = await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignedDeliveryBoy
    })

    return res.json({ success: true, message: "Order delivered successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};


// GET /api/delivery/my-orders
export const getMyDeliveredOrders = async (req, res) => {
  try {
    const deliveryBoyId = req.userId; // login user
    const orders = await Order.find({
      "shopOrders.assignedDeliveryBoy": deliveryBoyId,
      "shopOrders.status": "delivered"
    })
      .populate("shopOrders.shop")
      .populate("user")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (err) {
    console.error("Get My Orders Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getTodayStats = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // ✅ सारे orders निकालो जिनमें ये deliveryBoy assigned है और status delivered है
    const orders = await Order.find({
      "shopOrders.assignedDeliveryBoy": deliveryBoyId,
      "shopOrders.status": "delivered",
      "shopOrders.deliveredAt": { $gte: startOfDay }
    }).lean();

    // ✅ अब shopOrders को flatten करके सिर्फ आज के delivered निकालो
    let todayDelivered = [];
    orders.forEach(order => {
      order.shopOrders.forEach(shopOrder => {
        if (
          String(shopOrder.assignedDeliveryBoy) === String(deliveryBoyId) &&
          shopOrder.status === "delivered" &&
          shopOrder.deliveredAt &&
          shopOrder.deliveredAt >= startOfDay
        ) {
          todayDelivered.push(shopOrder);
        }
      });
    });

    // ✅ hour wise group manually
    let stats = {};
    todayDelivered.forEach(shopOrder => {
      const hour = new Date(shopOrder.deliveredAt).getHours();
      stats[hour] = (stats[hour] || 0) + 1;
    });

    // ✅ object → array convert
    const formattedStats = Object.keys(stats).map(hour => ({
      hour: parseInt(hour),
      count: stats[hour]
    }));

    formattedStats.sort((a, b) => a.hour - b.hour);

    res.json({ success: true, stats: formattedStats });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

export const getMonthStats = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;

    // ✅ महीने की शुरुआत (1 तारीख से)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // ✅ अभी का time
    const now = new Date();

    // ✅ सारे delivered shopOrders fetch
    const orders = await Order.find({
      "shopOrders.assignedDeliveryBoy": deliveryBoyId,
      "shopOrders.status": "delivered",
      "shopOrders.deliveredAt": { $gte: startOfMonth, $lte: now }
    }).lean();

    // ✅ Flatten करके सिर्फ delivered निकालना
    let monthDelivered = [];
    orders.forEach(order => {
      order.shopOrders.forEach(shopOrder => {
        if (
          String(shopOrder.assignedDeliveryBoy) === String(deliveryBoyId) &&
          shopOrder.status === "delivered" &&
          shopOrder.deliveredAt &&
          shopOrder.deliveredAt >= startOfMonth
        ) {
          monthDelivered.push(shopOrder);
        }
      });
    });

    // ✅ Day-wise group बनाना
    let stats = {};
    monthDelivered.forEach(shopOrder => {
      const date = new Date(shopOrder.deliveredAt);
      const day = date.getDate(); // सिर्फ दिन चाहिए (1-31)
      stats[day] = (stats[day] || 0) + 1;
    });

    // ✅ object → array convert
    const formattedStats = Object.keys(stats).map(day => ({
      day: parseInt(day),
      count: stats[day]
    }));

    // sort by day
    formattedStats.sort((a, b) => a.day - b.day);

    res.json({ success: true, stats: formattedStats });
  } catch (err) {
    console.error("Month Stats Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch monthly stats" });
  }
};
