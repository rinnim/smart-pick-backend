const Product = require("../models/product_model");

const getProductStockStatusByShop = async (req, res) => {
  try {
    // First, get all unique stock statuses
    const uniqueStatuses = await Product.distinct("stockStatus");

    const productCounts = await Product.aggregate([
      {
        $group: {
          _id: {
            shop: "$shop",
            status: { $toLower: "$stockStatus" },
          },
          statusCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.shop",
          count: { $sum: "$statusCount" },
          statusBreakdown: {
            $push: {
              status: "$_id.status",
              count: "$statusCount",
            },
          },
        },
      },
      {
        $project: {
          shop: "$_id",
          count: 1,
          stockStatusCounts: {
            $arrayToObject: {
              $map: {
                input: "$statusBreakdown",
                as: "item",
                in: {
                  k: "$$item.status",
                  v: "$$item.count",
                },
              },
            },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    if (!productCounts.length) {
      return res.status(404).json({
        status: "error",
        message: "No products found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Product statistics fetched successfully",
      data: {
        shops: productCounts,
        totalShops: productCounts.length,
        totalProducts: productCounts.reduce((acc, curr) => acc + curr.count, 0),
        uniqueStockStatuses: uniqueStatuses,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching product statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getProductStockStatusByShop,
};
