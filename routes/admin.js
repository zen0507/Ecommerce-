var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then(products=>{
    res.render('admin/view-products',{admin:true,products:products});
  })

});
router.get('/add-product', function(req, res, next) {
  res.render('admin/add-product');
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
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit_product',{product});
})

module.exports = router;
