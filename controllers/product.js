const Product = require("../models/product");
const { incrementClicks } = require("../utils/product_utils");

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json({
      status: "success",
      message: "Products fetched successfully",
      products: products,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching products",
      error: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  const productData = req.body;

  try {
    const product = new Product(productData);
    await product.validate();
    const savedProduct = await product.save();
    return res.status(200).json({
      status: "success",
      message: "Product created successfully",
      data: savedProduct,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Get product by id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    // Increment clicks
    await incrementClicks(id);

    return res.status(200).json({
      status: "success",
      product: product,
      message: "Product fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching product",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }
    return res.status(200).json({
      product: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Error updating product",
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    return res.status(200).json({
      status: "success",
      product: product,
      message: "Product deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error deleting product",
      error: error.message,
    });
  }
};

const getProductsByFilters = async (req, res) => {
  const {
    category,
    subcategory,
    brands,
    minPrice,
    maxPrice,
    shop,
    stockStatus,
    limit = 12,
    page = 1,
    sortBy,
    search,
  } = req.query;

  // Prepare the base aggregation pipeline
  const pipeline = [];

  // 1. Add match stage for filters
  const matchStage = {
    $match: {},
  };

  if (category) matchStage.$match.category = category;
  if (subcategory) matchStage.$match.subcategory = subcategory;
  if (shop) matchStage.$match.shop = shop;
  if (stockStatus) {
    matchStage.$match.stockStatus = { $regex: stockStatus, $options: "i" };
  }
  if (brands) {
    const brandArray = Array.isArray(brands) ? brands : brands.split(",");
    matchStage.$match.brand = { $in: brandArray };
  }
  if (minPrice || maxPrice) {
    matchStage.$match.price = {};
    if (minPrice) matchStage.$match.price.$gte = Number(minPrice);
    if (maxPrice) matchStage.$match.price.$lte = Number(maxPrice);
  }
  console.log("--------------------------------");

  // // Handle search
  // if (search && search.trim()) {
  //   const searchTerms = search
  //     .trim()
  //     .split(" ")
  //     .map((term) => term.trim())
  //     .filter(Boolean);

  //   const regexPattern = searchTerms.map((term) => `(?=.*${term})`).join("");
  //   console.log("regexPattern:", regexPattern);
  //   matchStage.$match.name = { $regex: new RegExp(regexPattern, "i") };
  // }

  // // Handle search
  // if (search && search.trim()) {
  //   const searchTerms = search
  //     .trim()
  //     .split(" ")
  //     .map((term) => term.trim())
  //     .filter(Boolean);

  //   // Modify regexPattern to prioritize matches that start with "apple watch"
  //   const startWithPattern = `^(${searchTerms.join(".*")})`; // This ensures it starts with the search terms

  //   console.log("startWithPattern:", startWithPattern);

  //   // Main regex pattern with the start match
  //   const regexPattern = searchTerms.map((term) => `(?=.*${term})`).join(""); // Partial match for all terms

  //   // Match products starting with the search term or matching any of the terms in the name
  //   matchStage.$match.name = {
  //     $regex: new RegExp(regexPattern, "i"), // This regex will prioritize products starting with the search term
  //   };

  //   // Push the match stage with the updated regex
  //   pipeline.push(matchStage);
  // }

  // Push match stage to pipeline
  pipeline.push(matchStage);

  // 4. Add sorting stage
  const sortStage = { $sort: {} };

  switch (sortBy) {
    case "date-high":
      sortStage.$sort.updatedAt = -1;
      break;
    case "date-low":
      sortStage.$sort.updatedAt = 1;
      break;
    case "price-high":
      sortStage.$sort.price = -1;
      break;
    case "price-low":
      sortStage.$sort.price = 1;
      break;
    case "popularity-high":
      sortStage.$sort.totalFavorites = -1;
      break;
    case "popularity-low":
      sortStage.$sort.totalFavorites = 1;
      break;
    case "views-high":
      sortStage.$sort.totalClicks = -1;
      break;
    case "views-low":
      sortStage.$sort.totalClicks = 1;
      break;
    default:
      sortStage.$sort.updatedAt = -1; // Default sort by newest
  }

  pipeline.push(sortStage);

  // 5. Add pagination
  const skip = (Number(page) - 1) * Number(limit);
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: Number(limit) });

  try {
    // Execute the aggregation pipeline
    const products = await Product.aggregate(pipeline);

    // Count total products for pagination
    const countPipeline = [matchStage, { $count: "total" }];
    const countResult = await Product.aggregate(countPipeline);
    const totalProducts = countResult.length > 0 ? countResult[0].total : 0;

    if (!products || products.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No products found",
      });
    }

    console.log("search:", search);
    console.log(
      "product's name:",
      products.map((product) => product.name)
    );
    console.log("--------------------------------");
    return res.status(200).json({
      status: "success",
      message: "Products fetched successfully",
      data: {
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: Number(page),
        totalProducts,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products by filters:", error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching products by filters",
      error: error.message,
    });
  }
};








const createOrUpdateProduct = async (req, res) => {
  const { url, price, ...otherData } = req.body;

  try {
    let product = await Product.findOne({ url });

    if (product) {
      product.priceTimeline.push({
        date: new Date(),
        price: product.price,
      });

      Object.assign(product, { price, ...otherData });
      const updatedProduct = await product.save();

      return res.status(200).json({
        status: "success",
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } else {
      const newProduct = new Product({ url, price, ...otherData });
      const savedProduct = await newProduct.save();

      return res.status(200).json({
        status: "success",
        message: "Product created successfully",
        data: savedProduct,
      });
    }
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Error creating or updating product",
      error: error.message,
    });
  }
};

const getCategoriesAndSubcategories = async (req, res) => {
  try {
    const products = await Product.find();
    const categories = {};

    products.forEach((product) => {
      const { category, subcategory } = product;
      if (!categories[category]) {
        categories[category] = new Set();
      }
      categories[category].add(subcategory);
    });

    for (const category in categories) {
      categories[category] = Array.from(categories[category]);
    }

    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching categories and subcategories",
      error: error.message,
    });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await Product.find().distinct("brand");
    return res.status(200).json(brands);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching brands",
      error: error.message,
    });
  }
};

const getPopularProducts = async (req, res) => {
  try {
    const limit = req.query.limit || 12;
    // Changed to sort by totalFavorites instead of totalClicks
    const products = await Product.find()
      .sort({ totalFavorites: -1 })
      .limit(limit);

    return res.status(200).json({
      status: "success",
      products: products,
      message: "Popular products fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching popular products",
      error: error.message,
    });
  }
};

// Find products with similar name and category
const getSimilarProducts = async (req, res) => {
  const { name, category } = req.body;
  const query = { name: { $regex: name, $options: "i" } };
  const products = await Product.find(query);
  return res.status(200).json({
    status: "success",
    products: products,
    message: "Similar products fetched successfully",
  });
};

// Find products with similar name from different shops
const getSimilarProductsByShop = async (req, res) => {
  try {
    const { id, limit = 8 } = req.query;
    const product = await Product.findById(id);
    const nameWords = product.name.split(" ").slice(0, 3).join(" ");
    const query = {
      name: { $regex: nameWords, $options: "i" },
      shop: { $ne: product.shop },
      brand: product.brand,
    };

    const products = await Product.find(query).limit(limit);

    return res.status(200).json({
      status: "success",
      products: products,
      message: "Similar products fetched successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching similar products",
      error: error.message,
    });
  }
};

// Find products with similar name in the same shop
const getSimilarProductsInShop = async (req, res) => {
  try {
    const { id, limit = 8 } = req.query;
    const product = await Product.findById(id);
    const nameWords = product.name.split(" ").slice(0, 3).join(" ");
    const query = {
      _id: { $ne: id },
      name: { $regex: nameWords, $options: "i" },
      shop: product.shop,
    };

    const products = await Product.find(query).limit(limit);

    return res.status(200).json({
      status: "success",
      products: products,
      message: "Similar products in shop fetched successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching similar products in shop",
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByFilters,
  createOrUpdateProduct,
  getCategoriesAndSubcategories,
  getBrands,
  getPopularProducts,
  getSimilarProducts,
  getSimilarProductsByShop,
  getSimilarProductsInShop,
};
