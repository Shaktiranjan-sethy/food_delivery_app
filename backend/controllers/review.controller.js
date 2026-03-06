import Item from "../models/item.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

// ✅ Submit rating & review
export const submitReview = async (req, res) => {
  try {
    const { itemId, rating, comment } = req.body;
    const userId = req.userId;

    // Check if user actually ordered this item
    const order = await Order.findOne({
      user: userId,
      "shopOrders.items.item": itemId,
      "shopOrders.status": "delivered",
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You can only review items you have ordered and received",
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Check if user already reviewed this item
    const alreadyReviewed = item.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this item",
      });
    }

    const user = await User.findById(userId);

    // Add review
    item.reviews.push({
      user: userId,
      userName: user.fullName,
      rating,
      comment,
    });

    // Recalculate average rating
    const totalRating = item.reviews.reduce((sum, r) => sum + r.rating, 0);
    item.rating.average = totalRating / item.reviews.length;
    item.rating.count = item.reviews.length;

    await item.save();

    return res.json({ success: true, message: "Review submitted!", item });
  } catch (err) {
    console.error("Review error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get reviews for an item
export const getItemReviews = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findById(itemId).select("reviews rating name");
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    return res.json({ success: true, reviews: item.reviews, rating: item.rating });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get items eligible for review (delivered but not yet reviewed)
export const getReviewableItems = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all delivered orders
    const orders = await Order.find({
      user: userId,
      "shopOrders.status": "delivered",
    }).populate("shopOrders.items.item");

    // Collect all delivered items
    const deliveredItems = [];
    orders.forEach((order) => {
      order.shopOrders.forEach((shopOrder) => {
        if (shopOrder.status === "delivered") {
          shopOrder.items.forEach((i) => {
            if (i.item) {
              deliveredItems.push({
                orderId: order._id,
                item: i.item,
              });
            }
          });
        }
      });
    });

    // Filter out already reviewed items
    const reviewableItems = [];
    for (const { orderId, item } of deliveredItems) {
      const alreadyReviewed = item.reviews?.find(
        (r) => r.user?.toString() === userId.toString()
      );
      if (!alreadyReviewed) {
        reviewableItems.push({ orderId, item });
      }
    }

    // Remove duplicates by item id
    const seen = new Set();
    const unique = reviewableItems.filter(({ item }) => {
      if (seen.has(item._id.toString())) return false;
      seen.add(item._id.toString());
      return true;
    });

    return res.json({ success: true, items: unique });
  } catch (err) {
    console.error("Reviewable items error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};