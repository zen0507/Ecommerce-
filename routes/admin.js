var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  let products = [{
      name: 'Real me',
      category: 'Mobile',
      description: 'This is brand new product',
      image: 'https://imgs.search.brave.com/IY7oWARNmQsr3FYrltqJbx2ui6ZvJjA8WE5JebFc2d4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9waXNj/ZXMuYmJ5c3RhdGlj/LmNvbS9pbWFnZTIv/QmVzdEJ1eV9VUy9k/YW0vUkVGLTI2NTgz/NTAtbmF2LWRlcHQt/bGl2ZWx5X0RFUi05/NTYzNTQ5Ni1iNTVi/LTQwZmItOWE5Mi0y/NGRmNGJkOWZkMmIu/anBnO21heEhlaWdo/dD0yNTI7bWF4V2lk/dGg9MjUyP2Zvcm1h/dD13ZWJw',
      price: 22000
    },
    {
      name: 'Iphone 14',
      category: 'Mobile',
      description: 'This is brand new product',
      image:'https://imgs.search.brave.com/vghEIRcl3oxok6nsAXip7Pz4HKeJr86VVNpoFxTmC6I/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMuc3F1YXJlc3Bh/Y2UtY2RuLmNvbS9j/b250ZW50L3YxLzUy/NjRmN2M5ZTRiMGEz/MjQ3YzY0MTg2MC8x/NjY1ODgyNzE4MjE0/LTlMTEZYMVlYOFgy/ME9SU05WTEowL2lw/aG9uZS0xNC1wcm8t/bWF4LWNhbWVyYS10/ZXN0XzAxLmpwZw',
      price: 70000
    },
    {
      name: 'Nothing Phone',
      category: 'Mobile',
      description: 'This is brand new product',
      image: 'https://imgs.search.brave.com/wFkIJThbWqISecvUs02UXqCrTBFrK5V7uoO0HsQsE1I/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/bXlnLmluL2ltYWdl/cy90aHVtYm5haWxz/LzI1MC8yNTAvZGV0/YWlsZWQvMTMxL05v/dGhpbmctcGhvbmUt/NGEtNWctd2hpdGUt/OGdiLTI1NmdiLUZy/b250LUJhY2stVmll/d19fMV8ud2VicC5w/bmc',
      price: 11000
    },
    {
      name: 'Redmi Note 12',
      category: 'Mobile',
      description: 'This is brand new product',
      image: 'https://imgs.search.brave.com/bg1OIgSTJ53oCs258jpxHxt8wLubV_mukG3OEdqVGTs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pMDEu/YXBwbWlmaWxlLmNv/bS92MS9NSV8xODQ1/NUIzRTREQTcwNjIy/NkNGNzUzNUE1OEU4/NzVGMDI2Ny9wbXNf/MTY3OTU3NDEzNS4x/NTUzNDMyNC5wbmc',
      price: 3000
    },];
  res.render('admin/view-products',{admin:true,products:products});
});
router.get('/add-product', function(req, res, next) {
  res.render('admin/add-product');
})

router.post('/add-product',(req,res)=>{
 
  productHelper.addProduct(req.body,(id)=>{
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
module.exports = router;
