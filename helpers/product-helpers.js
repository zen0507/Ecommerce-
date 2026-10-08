
var db = require('../config/connection')
var collections = require('../config/collections')
module.exports = {
    addProduct: (product,callback)=>
    {
        db.getDb().collections(collections.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data.insertedId);
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.getDb().collection(collections.PRODUCT_COLLECTION).find().toArray();
            resolve(products)
        })

    }

}