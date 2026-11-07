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
    let orders = await db
        .getDb()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
            {
                $lookup: {
                    from: collections.USER_COLLECTION,
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $lookup: {
                    from: collections.PRODUCT_COLLECTION,
                    localField: "products.item",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $addFields: {
                    productDetails: {
                        $map: {
                            input: { $ifNull: ["$products", []] },
                            as: "orderProduct",
                            in: {
                                $let: {
                                    vars: {
                                        product: {
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
                                        }
                                    },
                                    in: {
                                        $mergeObjects: [
                                            { $ifNull: ["$$product", {}] },
                                            { quantity: "$$orderProduct.quantity" }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ])
        .toArray();

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