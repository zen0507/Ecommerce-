var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
require("dotenv").config();

module.exports = {
  doLogin: async (adminData) => {
    if (
      !adminData ||
      typeof adminData.email !== "string" ||
      typeof adminData.password !== "string"
    ) {
      return { status: false };
    }

    const admins = db.getDb().collection(collections.ADMIN_COLLECTION);
    const admin = await admins.findOne({ email: adminData.email });

    if (admin) {
      const passwordMatches = await bcrypt.compare(
        adminData.password,
        admin.password,
      );
      if (!passwordMatches) {
        return { status: false };
      }

      const { password, ...sessionAdmin } = admin;
      return { status: true, admin: sessionAdmin };
    }

    if (
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD ||
      adminData.email !== process.env.ADMIN_EMAIL ||
      adminData.password !== process.env.ADMIN_PASSWORD
    ) {
      return { status: false };
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const result = await admins.insertOne({
      email: adminData.email,
      password: hashedPassword,
    });

    return {
      status: true,
      admin: { _id: result.insertedId, email: adminData.email },
    };
  },
 
getAllOrders: async () => {
    let orders = await db.getDb()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
            // Get user information
            {
                $lookup: {
                    from: collections.USER_COLLECTION,
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },

            // Convert userDetails array into an object
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Get product information
            {
                $lookup: {
                    from: collections.PRODUCT_COLLECTION,
                    localField: "products.item",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },

            // Combine product information with its quantity
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "orderProduct",
                            in: {
                                item: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$productDetails",
                                                as: "product",
                                                cond: {
                                                    $eq: [
                                                        "$$product._id",
                                                        "$$orderProduct.item"
                                                    ]
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                quantity: "$$orderProduct.quantity"
                            }
                        }
                    }
                }
            },

            // Remove temporary productDetails and password
            {
                $project: {
                    productDetails: 0,
                    "userDetails.password": 0
                }
            }

        ]).toArray();

    return orders;
},

  getAllUsers:async()=>{
    return new Promise(async (resolve, reject) => {
          let users = await db
            .getDb()
            .collection(collections.USER_COLLECTION)
            .find()
            .toArray();
          resolve(users);
        });
  }
};