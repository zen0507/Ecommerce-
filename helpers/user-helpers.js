
        var db = require('../config/connection')
        var collections = require('../config/collections')
        const bcrypt = require('bcrypt');

        module.exports = {
            doSignup:(userData)=>{
                return new Promise(async(resolve,reject)=>{
                    userData.password = await bcrypt.hash(userData.password, 10);
                    db.getDb().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                       console.log(data);

                        // Return the complete user data
                        resolve(userData);                    })
                })
                

            }
            
        }