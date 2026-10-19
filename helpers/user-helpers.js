var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { response } = require("express");
var objectId = require("mongodb").ObjectId;

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.getDb()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          console.log(data);

          // Return the complete user data
          resolve(userData);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .getDb()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log("login success");
            resolve({ status: true, user });
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },

 addToCart: (proId, userId) => {
    let proObj = {
        item: new objectId(proId),
        quantity: 1
    };

    return new Promise(async (resolve, reject) => {
        let userCart = await db.getDb()
            .collection(collections.CART_COLLECTION)
            .findOne({
                user: new objectId(userId)
            });

        if (userCart) {
            let proExist = userCart.products.findIndex(
                product => product.item.toString() === proId.toString()
            );

            if (proExist !== -1) {
                db.getDb()
                    .collection(collections.CART_COLLECTION)
                    .updateOne(
                        {
                            user: new objectId(userId),
                            "products.item": new objectId(proId)
                        },
                        {
                            $inc: {
                                "products.$.quantity": 1
                            }
                        }
                    )
                    .then(() => {
                        resolve();
                    });
            } else {
                db.getDb()
                    .collection(collections.CART_COLLECTION)
                    .updateOne(
                        {
                            user: new objectId(userId)
                        },
                        {
                            $push: {
                                products: proObj
                            }
                        }
                    )
                    .then(() => {
                        resolve();
                    });
            }
        } else {
            let cartObj = {
                user: new objectId(userId),
                products: [proObj]
            };

            db.getDb()
                .collection(collections.CART_COLLECTION)
                .insertOne(cartObj)
                .then(() => {
                    resolve();
                });
        }
    });
},
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .getDb()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: new objectId(userId) },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              let: { proList: "$products" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ["$_id", "$$proList"],
                    },
                  },
                },
              ],
              as: "cartItems",
            },
          },
        ])
        .toArray();
      resolve(cartItems[0].cartItems);
    });
  },
  getCartCount: (user_id) => {
    return new Promise(async (resolve, reject) => {
        let cart = await db.getDb()
            .collection(collections.CART_COLLECTION)
            .findOne({
                user: new objectId(user_id)
            });

        let count = 0;

        if (cart) {
            count = cart.products.reduce(
                (total, product) => total + product.quantity,
                0
            );
        }

        resolve(count);
    });
}
};
