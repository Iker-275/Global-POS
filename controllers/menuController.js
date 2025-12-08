const  Menu = require( "../models/menuModel");
const mongoose = require("mongoose");


// ============== ADD MENU ITEM ==================
const addMenuItem = async (req, res) => {
  try {
    const { menuItem, pricePerQty, currency, availableToday, category, imageUrl, bestSeller } = req.body;

    const item = await Menu.create({
      menuItem,
      pricePerQty,
      currency,
      availableToday,
      category,
      imageUrl,
      bestSeller,
    });

    return res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: item,
    });
  } catch (error) {
    console.log("error "+ error);

    return res.status(500).json({ success: false, message: error, error });
  }
};


// ============== UPDATE MENU ITEM ==================
 const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params; // menu item id
    const updates = req.body;  // any field

    const updated = await Menu.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    return res.json({
      success: true,
      message: "Menu item updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ============== DELETE MENU ITEM ==================
 const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Menu.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    return res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ============== FETCH + SEARCH + SORT + PAGINATION ==================
 const getMenuItems = async (req, res) => {
  try {
    let { page = 1, limit = 20, search = "", startDate, endDate, alphabetical = "asc" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // -------- SEARCH BY NAME ----------
    if (search) {
      query.menuItem = { $regex: search, $options: "i" }; // case-insensitive search
    }

    // -------- SEARCH BY DATE RANGE ----------
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // -------- SORT ALPHABETICALLY ----------
    const sortOption = { menuItem: alphabetical === "desc" ? -1 : 1 };

    // -------- PAGINATION ----------
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      Menu.find(query).sort(sortOption).skip(skip).limit(limit),
      Menu.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;

    return res.json({
      success: true,
      count: items.length,
      page,
      limit,
      next: hasNext,
      totalPages,
      data: items,
    });
  } catch (error) {
    console.log("error "+ error);
    
    return res.status(500).json({ success: false, message: "Server error", error });
  }
};

module.exports ={getMenuItems,deleteMenuItem,updateMenuItem,addMenuItem};