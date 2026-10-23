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
          let quantityElement = $("#quantity-" + proId);
          let currentQuantity = parseInt(quantityElement.text());
          quantityElement.text(currentQuantity + count);
          let cartCount = parseInt($("#cart-count").html());
          cartCount = cartCount + count;
          $("#cart-count").html(cartCount);
      }
        }
    })
   }

   function removeProduct(cartId,proId)
   {
    $.ajax({
      url: '/remove-cart-product',
       data:{
            cart:cartId,
            product:proId,
        },
        method:'post',
        success:(response)=>{
        if (response.status) {
          location.reload();

      }
        }
    })
   }