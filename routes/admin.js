var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var adminHelpers = require('../helpers/admin-helpers')

const verifyLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};
router.get("/login", (req, res) => {
  if (req.session.adminloggedIn) {
    res.redirect("/admin/");
  } else {
    res.render("admin/login", { loginErr: req.session.adminloginErr,admin:true });
    req.session.adminloginErr = false;
  }
});//datatables

router.post("/login", async (req, res, next) => {
  try {
    const response = await adminHelpers.doLogin(req.body);
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      res.redirect("/admin/");
    } else {
      req.session.adminloginErr = "Invalid username or password";
      res.redirect("/admin/login");
    }
  } catch (err) {
    next(err);
  }
});

router.use(verifyLogin);

/* GET users listing. */
router.get('/',verifyLogin, function(req, res, next) {
  productHelpers.getAllProducts().then(products=>{
    res.render('admin/view-products',{admin:true,products:products});
  })

});
router.get('/add-product', verifyLogin, function(req, res, next) {
  res.render('admin/add-product',{admin:true});
})

router.post('/add-product',(req,res)=>{
 
  productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.image;
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render('admin/add-product');
      }else{
        console.log(err);
      }
    })
  });
}
)

router.get('/delete-product/:id',(req,res)=>{
  let proId = req.params.id;
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })


})

router.get('/edit-product/:id',async (req,res)=>{
  let product = await productHelpers.getProductDetails(req.params.id);
  res.render('admin/edit-product',{product,admin:true});
})

router.post('/edit-product/:id',(req,res)=>{
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image)
    {
      let image = req.files.image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
})
router.get('/all-orders',verifyLogin,async(req,res)=>{
  let orders = await adminHelpers.getAllOrders();
  res.render('admin/all-orders',{admin:true,orders});
})
router.get('/all-users',verifyLogin,async(req,res)=>{
  let users = await adminHelpers.getAllUsers();
  res.render('admin/all-users',{admin:true,users});
})
module.exports = router;
