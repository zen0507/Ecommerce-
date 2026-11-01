var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelpers
    .getAllProducts()
    .then((products) => {
      res.render("user/view-products", { products, user, cartCount });
    })
    .catch(next);
});
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});

router.post("/signup", (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    req.session.loggedIn = true;
    req.session.user = response;
    res.redirect("/");
  });
});

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.loginErr = "Invalid username or password";
      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
router.get("/cart", verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id);

  let cartCount = await userHelpers.getCartCount(req.session.user._id);

  let total = await userHelpers.getCartTotal(req.session.user._id);

  res.render("user/cart", {
    products,
    user: req.session.user,
    cartCount,
    total,
  });
});

router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", async (req, res, next) => {
  try {
    let response = await userHelpers.changeProductQuantity(req.body);

    let total = await userHelpers.getCartTotal(req.session.user._id);

    response.total = total;

    res.json(response);
  } catch (error) {
    next(error);
  }
});
router.post("/remove-cart-product", async (req, res, next) => {
  try {
    await userHelpers.removeCartProduct(req.body);

    let total = await userHelpers.getCartTotal(req.session.user._id);

    res.json({
      status: true,
      total: total,
    });
  } catch (error) {
    next(error);
  }
});
router.get("/place-order", verifyLogin, async (req, res) => {
  let total = await userHelpers.getCartTotal(req.session.user._id);

  res.render("user/place-order", { total, user: req.session.user });
});

router.post("/place-order", verifyLogin, async (req, res, next) => {
  try {
    let userId = req.session.user._id;
    let products = await userHelpers.getCartProductList(userId);
    let total = await userHelpers.getCartTotal(userId);
    let orderId = await userHelpers.placeOrder(
      { ...req.body, userId },
      products,
      total,
    );

    res.json({
      status: true,
      orderId: orderId.toString(),
    });
  } catch (error) {
    next(error);
  }
});
router.get("/order-success/:orderId", verifyLogin, (req, res) => {
  res.render("user/order-success", {
    orderId: req.params.orderId,
    user: req.session.user,
  });
});
router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  console.log(orders);
  res.render("user/orders", { user: req.session.user, orders });
});
router.get("/view-order-products/:orderId",verifyLogin,async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.orderId);
  let order = await userHelpers.getSingleOrder(req.params.orderId);

  console.log(products);
  console.log(order);
  res.render("user/order-products.hbs",{products,order});
})
module.exports = router;
