const express = require('express')
const app = express()
const cors = require('cors')
const mongoose=require("mongoose")
const bodyParser=require("body-parser")
require('dotenv').config()

///Configuracion
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
///Obtengo fecha actual
const nDate = () => new Date().toDateString()


///Conexion a MongoDb y definicion de esquemas y modelos
mongoose.connect(process.env['URL'], { useNewUrlParser: true, useUnifiedTopology: true })

const exerciseSchema=new mongoose.Schema({
   description: String,
   duration: Number,
   date: {
     type:String
   }
  })

const userSchema= new mongoose.Schema({
  username:{
    type:String,
    required:true
  },
  log: [exerciseSchema ]
})

const User=mongoose.model("User",userSchema)
const Exercise=mongoose.model("Exercise",exerciseSchema)


///Manejadores de rutas

//Muestra todos los usuarios

app.get("/api/users",function(req,res){
  
  User.find({},function(err,users){
    res.json(users)
  })
})

//Muestra los registros de un determinado usuario , pudiendo filtrar por fecha y cantidad de registros

app.get("/api/users/:_id/logs?",function(req,res){
  
  const {_id}=req.params
  const from=req.query.from || "1900-01-01"
  const to=req.query.to || "3000-12-31"
  const limit=req.query.limit || 1000

  User.findById(_id,async function(err,user){

    const filteredUser=user.log.filter((exercise,index) => (
      (new Date(exercise.date).getTime()>=new Date(from).getTime())
    && (new Date(exercise.date).getTime()<=new Date(to).getTime())
    )
    ).slice(0,limit)
    
    let count=filteredUser.length
    
    res.json({
      username: user.username,
      count: count,
      _id: user._id,
      log: filteredUser
    })
  })
})

//Guarda un nuevo usuario y devuelve la informacion 
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

//Guarda un registro de ejercicio, fecha es opcional
app.post("/api/users/:_id/exercises",  async function(req,res){
  
  const userId=req.params._id
  const description=req.body.description
  const duration=req.body.duration
  const regex=/^\d{4}\D\d{2}\D\d{2}$/
  let date
  
  if(req.body.date===""|| !regex.test(req.body.date)){
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

//Configuracion de puerto

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})



