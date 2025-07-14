const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require("../models/AdminModel");
const jwt = require('jsonwebtoken')
var cors = require('cors')
var app = express()


const adminRouter = express.Router();


adminRouter.post("/signupadmin",async(req,res)=>{
    try {
        const {email,password} =  await req.body;
        const hashedPassword =  await bcrypt.hash(password,10);
        const admin = await new Admin({
            email,
            password:hashedPassword
        });
        
        await admin.save();

        res.status(201).json({message:"created"})

    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
})



adminRouter.post("/signinadmin",async(req,res)=>{
    try {
        const {email,password} = await req.body; 
        console.log("this is email and password of the admin trying to login",email,password)
        const finduser =  await Admin.findOne({email:email});
        console.log("This means that finduser has been able to successfully find the user and  ",finduser)
        if(!finduser){
            console.log("inside not fond user");
            res.status(404).json({message:"user not founded in the database"})
        }
        const comparePassword =  await bcrypt.compare(password,finduser.password);
        console.log("the value of compared password ",comparePassword);
        if(!comparePassword){
            consol
            res.status(401).json({message:"Incorrect password"})
        }
        const adminToken = await jwt.sign({id:JSON.stringify(finduser._id),role:'admin'},process.env.ADMIN_JWT)
        if(!adminToken){
            res.status(500).json({message:"Not able to create token"})
        } 
        res.status(200).json({message:"login success",token:adminToken,role:finduser.role})
    } catch (error) {
        res.status(500)
    }
})


module.exports = adminRouter
