// controllers/productController.js
const Product = require("../models/product");

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  const productData = req.body;

  const product = new Product(productData);
  try {
    // validate the product data against the schema
    await product.validate();
    const savedProduct = await product.save();
    res
      .status(201)
      .json({ message: "Product created successfully", data: savedProduct });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a product by ID
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).json(); // No content to send back
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get products by filters from query params
// Get products by filters from query params
exports.getProductsByFilters = async (req, res) => {
  const {
    category,
    subcategory,
    brands,
    minPrice,
    maxPrice,
    limit = 12,
    page = 1,
    sortBy,
    sortOrder,
    search,
  } = req.query;

  // Create a query object
  const query = {};

  // Add filters to the query object based on provided query params
  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;

  // Allow multiple brands
  if (brands) {
    const brandArray = Array.isArray(brands) ? brands : brands.split(","); // Split brands if they are in a comma-separated string
    query.brand = { $in: brandArray }; // Match any of the brands
  }

  // Add price range filter if provided
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice); // Greater than or equal to minPrice
    if (maxPrice) query.price.$lte = Number(maxPrice); // Less than or equal to maxPrice
  }

  // Add search filter for product name (case-insensitive)
  if (search) {
    query.name = { $regex: search, $options: 'i' }; 
  }

  // Set up sorting
  let sortOptions = {};
  if (sortBy && ["price", "discount"].includes(sortBy)) {
    // Adjust the fields you want to sort by
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1; // Convert 'asc'/'desc' to -1/1
  }

  // Set up pagination
  const options = {
    limit: Number(limit),
    skip: (page - 1) * limit,
    sort: sortOptions,
  };

  try {
    // console.log("Query:", query);
    // console.log("Options:", options);
    const products = await Product.find(query, null, options);
    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Create or update a product
exports.createOrUpdateProduct = async (req, res) => {
  const { url, price } = req.body;
  console.log(req.body.name);

  try {
    // Attempt to find an existing product by URL
    let product = await Product.findOne({ url });

    // If the product exists, update it
    if (product) {
      // Add current price to the price timeline before updating
      // if (product.price !== price) {
      product.priceTimeline.push({
        date: new Date(),
        price: product.price,
      });
      // }

      // Update product fields with new data from request
      Object.assign(product, req.body);
      product.price = price; // Ensure the current price is updated

      // Save the updated product
      const updatedProduct = await product.save();
      return res
        .status(201)
        .json({
          message: "Product updated successfully",
          data: updatedProduct,
        });
    } else {
      // If the product does not exist, create a new one
      const newProduct = new Product(req.body);
      const savedProduct = await newProduct.save();
      return res
        .status(201)
        .json({ message: "Product created successfully", data: savedProduct });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all the categories and their subcategories
exports.getCategoriesAndSubcategories = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products
    const categories = {};

    products.forEach((product) => {
      const { category, subcategory } = product;

      if (!categories[category]) {
        categories[category] = new Set(); // Use a Set to avoid duplicates
      }

      categories[category].add(subcategory);
    });

    // Convert Set back to Array for each category
    for (const category in categories) {
      categories[category] = Array.from(categories[category]);
    }

    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// exports.getCategoriesAndSubcategories = async (req, res) => {
//   try {
//     const products = await Product.find(); // Fetch all products
//     const categoriesMap = {};

//     products.forEach((product) => {
//       const { category, subcategory } = product;

//       // Initialize the category if it doesn't exist
//       if (!categoriesMap[category]) {
//         categoriesMap[category] = {
//           name: category,
//           subCategories: new Set(),
//         };
//       }

//       // Add the subcategory only if it doesn't already exist
//       categoriesMap[category].subCategories.add(subcategory);
//     });

//     // Convert the Set to an Array for each category
//     const categoriesArray = Object.values(categoriesMap).map((category) => ({
//       name: category.name,
//       subCategories: Array.from(category.subCategories).map((name) => ({
//         name,
//       })),
//     }));

//     return res.status(200).json(categoriesArray);
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };
// Get all the brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Product.find().distinct("brand");
    return res.status(200).json(brands);
  } catch (error) {
    return res.status(500).json({ message: error.message });  
  }
};