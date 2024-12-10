const {Schema, model} =require("mongoose")

const postSchema = new Schema({
    title: {type:String, required: true},
    category: {type:String, enum: ["Agriculture","Bussiness","Education","Entertainment", "Art", "Investment", "Uncategorised","Weather"], message: "{VALUE is not Supported"},
    description: {type:String, required: true},
    creator: {type:Schema.Types.ObjectId, ref:"User"},
    title: {type:String, required: true},
    thumbnail: {type:String, required: true}, 
},   {timestamps: true})

module.exports = model("Post", postSchema)