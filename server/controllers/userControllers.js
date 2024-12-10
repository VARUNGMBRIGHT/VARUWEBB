const bcrypt = require('bcryptjs')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const {v4: uuid} = require("uuid")

const HttpError = require("../models/errorModel")




///============register a new usr====//
// POST: api/users/register===//
//unprotected//
const registerUser = async(req, res, next) => {
    try {
        const {name,email,password,password2} = req.body;
        if(!name || !email || !password) {
            return next(new HttpError("Fill in all field.",422))
        }

         const newEmail = email.toLowerCase()

         const emailExists = await User.findOne({email: newEmail})
         if(emailExists) {
            return next(new HttpError("Email aldready exists.", 422))
         }

         if((password.trim()).length < 6) {
            return next(new HttpError("Password Should be at least 6 charachters", 422))

         }

         if(password != password2) { 
            return next(new HttpError("Passwords do not match.", 422))
         }

         const salt = await bcrypt.genSalt(10)
         const hashedPass = await bcrypt.hash(password,salt);
         const newUser = await User.create({name, email: newEmail, password: hashedPass})
         res.status(201).json(`New user ${newUser.email} registered.`)
        }catch (error) {
        return next(new HttpError("User registeration failed.", 422))
    }
}








///============login usr ====//
// POST: api/users/login===//
//unprotected//
const loginUser = async(req, res, next) => {
   try {
       const {email, password} =req.body;
       if (!email || !password) {
        return next(new HttpError("Fill in all fields.", 422))
       }
       const newEmail = email.toLowerCase();

       const user = await User.findOne({email: newEmail})
       if(!user) {
        return next(new HttpError("Invalid credentials.", 422))
       }

       const comparePass = await bcrypt.compare(password, user.password)
       if(!comparePass) {
        return next(new HttpError("Invalid Credentials.", 422))
       }
       const {_id: id, name} =user;
       const token = jwt.sign({id, name}, process.env.JWT_SECRET, {expiresIn: "1d"})

       res.status(200).json({token, id, name})
   } catch (error) {
    return next(new HttpError("Login failed. Please check your credentails", 422))
   }
}










///============USER PROFILE====//
// POST: api/users/:id===//
//protected//
const getUser = async(req, res, next) => {
    try {
       
        const {id} = req.params;
        const user = await User.findById(id).select('-password');
        if(!user) {
            return next(new HttpError(" User not found", 404))
        }
      res.status(200).json(user);
    } catch(error) {
        return next(new HttpError(error))
    }
}






///============CHENGE USER AVATAR====//
// POST: api/users/change-avatar===//
//protected//
const changeAvatar = async(req, res, next) => {
    try {
     if(!req.files.avatar) {
        return next(new HttpError("Please choose an image", 422))
     }

     const user = await User.findById(req.user.id)
       if(user.avatar) {
        fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err) => {
            if(err) {
                return next(new HttpError(err))
            }
        })
       }
        
       const {avatar} = req.files;
       if(avatar.size > 1000000) {
        return next(new HttpError("Profile picture is too big, Select less than 1mb "), 422)
       }
       let fileName;
       fileName = avatar.name;
       let splittedFilename = fileName.split('.')
       let newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length - 1]
       avatar.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
        if(err) {
            return next(new HttpError(err))
        }
        const updatedAvatar = await User.findByIdAndUpdate(req.user.id, {avatar: newFilename}, {new: true})
        if(!updatedAvatar) {
            return next(new HttpError("Avatar could't be changed", 422))
        }   
        res.status(200).json(updatedAvatar)
    })
       
    }catch (error) {
        return next(new HttpError(error))
    }
}









///============Edit user details (from frofiles)====//
// POST: api/users/edit-user===//
//protected//
const editUser = async(req, res, next) => {
    try {
       const {name, email, currentPassword, newPassword, confirmNewPassword} = req.body;
       if (!name || !email || !currentPassword || !newPassword) {
        return next(new HttpError(" Fill in all fields", 422))
       }
       
       const user = await User.findById(req.user.id);
       if(!user) {
        return next(new HttpError(" User not found", 403))
       }

       const emailExists = await User.findOne({email});
       if(emailExists && (emailExists._id != req.user.id)) {
        return next(new HttpError("Email already Exists", 422))
       }

       const validateUserPassword = await bcrypt.compare(currentPassword, user.password);
       if(!validateUserPassword) {
        return next(new HttpError("Invalid current password ", 422))
       }
       if(newPassword !== confirmNewPassword) {
        return next(new HttpError(" New password do not match", 422))
       }

       const salt = await bcrypt.genSalt(10)
       const hash = await bcrypt.hash(newPassword, salt);

       const newInfo = await User.findByIdAndUpdate(req.user.id, {name, email, password: hash}, {new: true})
       res.status(200).json(newInfo)
    } catch (error) {
        return next(new HttpError(error))
    }
}









///============GET AUTHORS ====//
// POST: api/users/authors===//
//unprotected//
const getAuthors = async(req, res, next) => {
    try {
        const authors = await User.find().select('-password');
        res.json(authors);
    } catch (error) {
        return next(new HttpError(error))
    }
}







module.exports = {registerUser,loginUser,getUser,changeAvatar,editUser,getAuthors}