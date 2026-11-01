var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { response } = require("express");
const { log } = require("handlebars");
const env = require("dotenv").config();
const crypto = require("crypto");
var objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

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
      quantity: 1,
    };

    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .getDb()
        .collection(collections.CART_COLLECTION)
        .findOne({
          user: new objectId(userId),
        });

      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item.toString() === proId.toString(),
        );

        if (proExist !== -1) {
          db.getDb()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              {
                user: new objectId(userId),
                "products.item": new objectId(proId),
              },
              {
                $inc: {
                  "products.$.quantity": 1,
                },
              },
            )
            .then(() => {
              resolve();
            });
        } else {
          db.getDb()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              {
                user: new objectId(userId),
              },
              {
                $push: {
                  products: proObj,
                },
              },
            )
            .then(() => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: new objectId(userId),
          products: [proObj],
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
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  getCartCount: (user_id) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .getDb()
        .collection(collections.CART_COLLECTION)
        .findOne({
          user: new objectId(user_id),
        });

      let count = 0;

      if (cart) {
        count = cart.products.reduce(
          (total, product) => total + product.quantity,
          0,
        );
      }

      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    return new Promise((resolve, reject) => {
      const count = parseInt(details.count);
      const quantity = parseInt(details.quantity);

      if (count === -1 && quantity === 1) {
        db.getDb()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            {
              _id: new ObjectId(details.cart),
            },
            {
              $pull: {
                products: {
                  item: new ObjectId(details.product),
                },
              },
            },
          )
          .then(() => {
            resolve({ removeProduct: true });
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        db.getDb()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            {
              _id: new ObjectId(details.cart),
              "products.item": new ObjectId(details.product),
            },
            {
              $inc: {
                "products.$.quantity": count,
              },
            },
          )
          .then(() => {
            resolve({ removeProduct: false });
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  },
  removeCartProduct: (details) => {
    return new Promise((resolve, response) => {
      db.getDb()
        .collection(collections.CART_COLLECTION)
        .updateOne(
          {
            _id: new objectId(details.cart),
          },
          {
            $pull: {
              products: {
                item: new ObjectId(details.product),
              },
            },
          },
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getCartTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = await db
          .getDb()
          .collection(collections.CART_COLLECTION)
          .aggregate([
            {
              $match: {
                user: new ObjectId(userId),
              },
            },
            {
              $unwind: "$products",
            },
            {
              $lookup: {
                from: collections.PRODUCT_COLLECTION,
                localField: "products.item",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $unwind: "$productDetails",
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: [
                      { $toInt: "$products.quantity" },
                      { $toDouble: "$productDetails.price" },
                    ],
                  },
                },
              },
            },
          ])
          .toArray();

        resolve(total.length > 0 ? total[0].total : 0);
      } catch (error) {
        reject(error);
      }
    });
  },
  placeOrder: async (order, products, total) => {
    let status = order.paymentMethod === "COD" ? "placed" : "pending";
    let orderObj = {
      deliveryDetails: {
        mobile: order.mobile,
        address: order.address,
        pincode: order.pincode,
      },
      userId: new objectId(order.userId),
      paymentMethod: order.paymentMethod,
      products: products,
      status: status,
      totalAmount: total,
      date: new Date(),
    };

    let result = await db
      .getDb()
      .collection(collections.ORDER_COLLECTION)
      .insertOne(orderObj);
    if (order.paymentMethod === "COD") {
      await db
        .getDb()
        .collection(collections.CART_COLLECTION)
        .deleteOne({ user: new objectId(order.userId) });
    }

    return result.insertedId;
  },
  getCartProductList: async (userId) => {
    let cart = await db
      .getDb()
      .collection(collections.CART_COLLECTION)
      .findOne({
        user: new objectId(userId),
      });

    return cart.products;
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .getDb()
        .collection(collections.ORDER_COLLECTION)
        .find({ userId: new objectId(userId) })
        .toArray();
      resolve(orders);
    });
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderProduct = await db
        .getDb()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: new objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(orderProduct);
    });
  },
  getSingleOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .getDb()
        .collection(collections.ORDER_COLLECTION)
        .findOne({ _id: new objectId(orderId) });
      resolve(orders);
    });
  },
  generateRazorpay: async (orderId, total) => {
    let razorpayOrder = await instance.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: orderId,
    });

    await db
      .getDb()
      .collection(collections.ORDER_COLLECTION)
      .updateOne(
        { _id: new objectId(orderId) },
        { $set: { razorpayOrderId: razorpayOrder.id } }
      );

    return razorpayOrder;
  },
  verifyPayment: async (payment, userId) => {
    if (
      !payment.razorpay_order_id ||
      !payment.razorpay_payment_id ||
      !payment.razorpay_signature ||
      !payment.orderId
    ) {
      return false;
    }

    let expectedSignature = crypto
      .createHmac("sha256", process.env.key_secret)
      .update(
        `${payment.razorpay_order_id}|${payment.razorpay_payment_id}`
      )
      .digest("hex");
    let expectedBuffer = Buffer.from(expectedSignature);
    let receivedBuffer = Buffer.from(payment.razorpay_signature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return false;
    }

    let result = await db
      .getDb()
      .collection(collections.ORDER_COLLECTION)
      .updateOne(
        {
          _id: new objectId(payment.orderId),
          userId: new objectId(userId),
          razorpayOrderId: payment.razorpay_order_id,
          status: "pending",
        },
        {
          $set: {
            status: "placed",
            paymentId: payment.razorpay_payment_id,
          },
        }
      );

    if (result.modifiedCount !== 1) {
      return false;
    }

    await db
      .getDb()
      .collection(collections.CART_COLLECTION)
      .deleteOne({ user: new objectId(userId) });

    return true;
  },
};
