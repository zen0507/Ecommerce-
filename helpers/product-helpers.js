
var db = require('../config/connection')
var collections = require('../config/collections')
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (product,callback)=>
    {
        db.getDb().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data.insertedId);
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.getDb().collection(collections.PRODUCT_COLLECTION).find().toArray();
            resolve(products)
        })

    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:new objectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    }

}