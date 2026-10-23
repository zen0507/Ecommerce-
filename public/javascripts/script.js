function addToCart(proId)
      {
        $.ajax({
          url:'/add-to-cart/'+proId,
          method:'get',
          success:(response)=>
          {
            if(response.status)
            {
              let count = $('#cart-count').html();
              count = parseInt(count)+1;
              $("#cart-count").html(count);
            }
            }
        })
      }

   function changeQuantity(cartId,proId,count)
   {
    $.ajax({
        url:'/change-product-quantity',

        data:{
            cart:cartId,
            product:proId,
            count:count,
        },
        method:'post',
        success:(response)=>{
        if (response.status) {
              let cartCount = parseInt($("#cart-count").html());

              cartCount = cartCount + count;

              $("#cart-count").html(cartCount);
      }
        }
    })
   }