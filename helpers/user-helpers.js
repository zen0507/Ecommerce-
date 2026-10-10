
        var db = require('../config/connection')
        var collections = require('../config/collections')
        const bcrypt = require('bcrypt');
const { response } = require('express');

        module.exports = {
            doSignup:(userData)=>{
                return new Promise(async(resolve,reject)=>{
                    userData.password = await bcrypt.hash(userData.password, 10);
                    db.getDb().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                       console.log(data);

                        // Return the complete user data
                        resolve(userData);                    })
                })
            },
            doLogin:(userData)=>{
                return new Promise(async(resolve,reject)=>{
                    let loginStatus = false;
                    let user = await db.getDb().collection(collections.USER_COLLECTION).findOne({email:userData.email});
                    if(user)
                    {
                        bcrypt.compare(userData.password,user.password).then((status)=>{
                            if(status)
                            {
                                console.log("login success");
                                response.user = user;
                                response.status = true;
                                resolve(response);
                            }
                            else{
                                console.log("login failed");
                                resolve({status:false})
                            }

                        })
                    }
                    else{
                        console.log("login failed");
                    }
                    })
            }
        }