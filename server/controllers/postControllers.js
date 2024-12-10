const Post = require('../models/postModel')
const User = require('../models/userModel')

const fs = require('fs')
const path = require('path')
const {v4: uuid} = require("uuid")

const HttpError = require("../models/errorModel")

//===============CREATE POST===========//
//============API/POSTS================//
//=============UNPROTECTED==============//
const createPost = async (req, res,next) => {
    try {
        let {title, category, description} =req.body;
        if(!title || !category || !description || !req.files) {
            return next(new HttpError("Fill in all fields and choose image", 422))
        }

        const {thumbnail} = req.files; 
        if(thumbnail.size > 5000000) {
            return next(new HttpError("Image too big . File Should be lessthan 5mb"))
        }
        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length -1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if(err) {
                return next(new HttpError(err))
            } else {
                const newPost = await Post.create({title, category, description, thumbnail: newFilename, creator: req.user.id})
                if(!newPost) {
                    return next(new HttpError("Post Could't be created", 422))
                }

                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser.posts + 1; 
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})
                
                res.status(201).json(newPost)

             }
        })
    }catch (error) {
      return next(new HttpError(error))
    }
}





//===============GET ALL POST===========//
//============API/================//
//=============PROTECTED==============//
const getPosts = async (req, res,next) => {
   try {
      const posts = await Post.find().sort({updatedAt: -1})
      res.status(200).json(posts)
   } catch (error) {
    return next(new HttpError(error))
   }
}





//===============GET SINGLE POST===========//
//============API/POSTS/:ID================//
//=============UNPROTECTED==============//
const getPost = async (req, res,next) => {
   try {
       const postId = req.params.id;
    const post = await Post.findById(postId);
    if(!post) {
        return next(new HttpError("Post not found", 404))
    }
    res.status(200).json(post)
   } catch (error) {
    return next(new HttpError(error))
   }
}





//===============GET POST BY CATEGORY ===========//
//============API/POSTS/CATEGORIES/:CATEGORY================//
//=============UNPROTECTED==============//
const getCatPosts = async (req, res,next) => {
    try {
             const {category} = req.params; 
            const catPosts = await Post.find({category}).sort({createdAt: -1})
            res.status(200).json(catPosts)
            } catch (error) {
        return next(new HttpError(error))
       }
}




//===============GET AUTHOR POST===========//
//============API/POSTS/USERS/:ID================//
//=============UNPROTECTED==============//
const getUserPosts = async (req, res,next) => {
    try {
        const {id} = req.params; 
       const posts = await Post.find({creator: id}).sort({createdAt: -1})
       res.status(200).json(posts)
       } catch (error) {
   return next(new HttpError(error))
  }
}




//===============EDIT POST===========//
//============API/POSTS/:ID================//
//=============PROTECTED==============//
const editPost = async (req, res,next) => {
   try {
     let fileName ;
     let newFilename;
     let updatedPost;     
     const postId = req.params.id;
     let {title, category, description} = req.body;
     if (!title || !category || !description) {
        return next(new HttpError("Fill all fields ", 422))
     }
     const oldPost = await Post.findById(postId);
if (!oldPost) {
    return next(new HttpError("Post not found", 404));
}
     if(req.user.id == oldPost.creator){
     if(!req.files) {
        updatedAt = await Post.findByIdAndUpdate(postId, {title, category, description }, {new:true})

     }else {
        const oldPost = await Post.findById(postId);

        fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async (err) => {
            if (err) {
                return next(new HttpError(err))
            }
           
        })
        const {thumbnail} = req.files;

        if(thumbnail.size > 5000000) {
            return next(new HttpError("image too big select less than 5mb "))
        }
        fileName = thumbnail.name;
        let splittedFilename = fileName.split('.')
        newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length -1]
        thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
            if(err) {
                return next(new HttpError(err))
            }
        })
        updatedPost = await Post.findByIdAndUpdate(postId,
     {title, category, description, thumbnail: newFilename}, {new: true})
     }
    }
     if(!updatedPost) {
        return next(new HttpError("could't update post", 400)) 
     }
     res.status(200).json(updatedPost)


   }catch (error) {
      return next(new HttpError(error))
    }
}




//===============DELETE POST===========//
//============API/POSTS/:ID================//
//=============PROTECTED==============//
const deletePost = async (req, res,next) => {
   try {
         const postId = req.params.id;
         if(!postId) {
            return next(new HttpError("Post unavailable", 400))
            
         }
         const post = await Post.findById(postId);
         const fileName = post?.thumbnail;
         if(req.user.id == post.creator) {
         fs.unlink(path.join(__dirname, '..', 'uploads',fileName), async (err) => {
            if (err) {
              return next(new HttpError(err))
            }else {
                await Post.findOneAndDelete(postId);

                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser?.posts -1;
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})
                res.json(`Post ${postId} deleted successfully.`)
            }
        })
    } else {
        return next(new HttpError("Post could't be deleted", 403))
    }
        
         
           } catch (error) {
    return next(new HttpError(error))
  }
}

module.exports = {createPost, getPosts, getPost, getCatPosts,getUserPosts,deletePost, editPost}