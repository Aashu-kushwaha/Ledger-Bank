//Purpose:Server creation
// Config the server(like Middlewares and API)
const express = require("express");
const authRouter = require("./routes/auth.routes.js")
const cookieParser = require("cookie-parser")
const accountRouter = require("./routes/account.route.js")
const transactionRoutes  = require("./routes/transaction.route.js")

const app = express();
app.use(express.json())//Server cannot read data of body that's why this middlewear help to read the data from body
app.get("/",(req,res)=>{
  res.send("Ledger service is up and running.")
})

app.use(cookieParser());
app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transaction",transactionRoutes)


module.exports=app