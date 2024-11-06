const User = require("../models/user");
const Admin = require("../models/admin");

const getTotalUserAndAdmin = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total admins count
    const totalAdmins = await Admin.countDocuments();

    // Calculate total
    const total = totalUsers + totalAdmins;

    res.status(200).json({
      status: "success",
      data: {
        users: totalUsers,
        admins: totalAdmins,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getUsersByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Create date range query
        const dateQuery = {};
        if (startDate) {
            dateQuery.createdAt = { $gte: new Date(startDate) };
        }
        if (endDate) {
            dateQuery.createdAt = { ...dateQuery.createdAt, $lte: new Date(endDate) };
        }

        const usersByDate = await User.aggregate([
            {
                $match: dateQuery
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: {
                        $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: "$_id.day"
                        }
                    },
                    count: 1
                }
            },
            {
                $sort: { date: 1 }
            }
        ]);

        res.status(200).json({
            status: "success",
            data: {
                usersByDate,
                total: usersByDate.reduce((acc, curr) => acc + curr.count, 0)
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

module.exports = {
    getTotalUserAndAdmin,
    getUsersByDate
};
