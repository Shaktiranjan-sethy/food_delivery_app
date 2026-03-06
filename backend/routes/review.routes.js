import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getItemReviews, getReviewableItems, submitReview } from "../controllers/review.controller.js";

const reviewRouter = express.Router();

reviewRouter.post("/submit", isAuth, submitReview);
reviewRouter.get("/item/:itemId", isAuth, getItemReviews);
reviewRouter.get("/reviewable-items", isAuth, getReviewableItems);

export default reviewRouter;