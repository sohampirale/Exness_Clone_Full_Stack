import express from 'express'
const app = express();

app.use(express.json())

app.get('/',(req,res)=>{
    return res.send("Hello World from http-server")
})

app.listen(3001,()=>{
    console.log('Server listening on port 3001');
})