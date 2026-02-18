import uploadOnCloudinary from "../config/cloudinary.js"
import Shop from "../models/shop.model.js"

export const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find({}).populate("owner")
        if (shops.length > 0) {
            return res.status(200).json(shops)
        }
        return
    } catch (error) {
        return res.status(500).json({ message: `get all shops error ${error}` })
    }
}

export const addShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;
        let image;

        if (req.file) {
            console.log("image file: ", req.file);
            image = await uploadOnCloudinary(req.file.path);
        }

        let shop = await Shop.findOne({ owner: req.userId });

        if (!shop) {
            shop = await Shop.create({
                name,
                city,
                state,
                address,
                image: image,
                owner: req.userId
            });
        } else {
            shop.name = name;
            shop.city = city;
            shop.state = state;
            shop.address = address;

            if (image) {
                shop.image = image;
            }

            await shop.save();
        }

        await shop.populate("owner");
        await shop.populate({
            path: "items",
            options: { sort: { createdAt: -1 } }
        });

        return res.status(200).json(shop);

    } catch (error) {
        return res.status(500).json({ message: `add shop error ${error}` });
    }
};

export const getCurrentShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.userId }).populate("owner").populate({
            path: "items",
            options: { sort: { createdAt: -1 } }
        });
        if (shop) {
            return res.status(200).json(shop)
        }
        return null
    } catch (error) {
        return res.status(500).json({ message: `get shop error ${error}` })
    }
}

export const getShopsByCity = async (req, res) => {
    try {
        const { city } = req.params;

        if (!city) {
            return res.status(400).json({ message: "City parameter is required" });
        }

        // Case-insensitive search
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") }
        });

        return res.status(200).json(shops);
    } catch (error) {
        return res.status(500).json({ message: `get shop by city error ${error}` })
    }
}

export const getShopById = async (req, res) => {
    try {
        const { shopId } = req.params
        const shop = await Shop.findById(shopId)
        if (!shop) {
            return res.status(400).json({ message: "shop not found" });
        }
        return res.status(200).json(shop);

    } catch (error) {
        return res.status(500).json({ message: `get shop by id error ${error}` })
    }
}