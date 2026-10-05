
var db = require('../config/connection')

module.exports = {
    addProduct: (product,callback)=>
    {
        db.getDb().collection('product').insertOne(product).then((data)=>{
            callback(data.insertedId);
        })
    }

}