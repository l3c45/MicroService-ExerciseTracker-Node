const express = require('express')
const app = express()
const cors = require('cors')
const mongoose=require("mongoose")
const bodyParser=require("body-parser")
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const nDate = () => new Date().toDateString()

mongoose.connect(process.env['URL'], { useNewUrlParser: true, useUnifiedTopology: true })

//const ObjectId = mongoose.Schema.ObjectId;

const exerciseSchema=new mongoose.Schema({
   description: String,
   duration: Number,
   date: String
  })

const userSchema= new mongoose.Schema({
  username:{
    type:String,
    required:true
  },
  count:{
    type:Number,
    default:0
  },
  log: [exerciseSchema ]
})

const User=mongoose.model("User",userSchema)
const Exercise=mongoose.model("Exercise",exerciseSchema)

app.get("/api/users/:_id/logs?",function(req,res){
  
  const {_id}=req.params

  User.findById(_id,async function(err,user){
   
    user.count=user.log.length
    await user.save()
    res.json(user)
    })
  })

app.get("/api/users",function(req,res){
  
  User.find({},function(err,users){
    res.json(users)
  })
})




app.post("/api/users",async function(req,res){
  const username=req.body.username
  const instance = new User({
    username: username
  })
  await instance.save(function(err,data){
      res.json({
      username: data.username ,
      _id: data._id
      })
  })

})

app.post("/api/users/:_id/exercises",  async function(req,res){
  
  const userId=req.params._id
  const description=req.body.description
  const duration=req.body.duration
  let date
  
  if(req.body.date===""){
     date=nDate()
    console.log("vacio")
  } else{
     date= new Date(req.body.date).toDateString()
  }

  const instance=  new Exercise({
    description: description,
    duration: duration,
    date: date 
    })
    
  await instance.save(function(err){

     User.findById(userId,(err,user)=>{
       user.log.push(instance)
       user.save()
       res.json({
          username: user.username,
          description: instance.description,
          duration: instance.duration,
          date: instance.date,
          _id: user._id
       })
     }) 
  }) 
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})



