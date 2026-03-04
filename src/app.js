// Purpose: Server creation
// Config the server (like Middlewares and API)

const express = require("express");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.routes.js");
const accountRouter = require("./routes/account.route.js");
const transactionRoutes = require("./routes/transaction.route.js");

const app = express();

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://your-frontend.netlify.app' // replace when deployed
]

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res) => {
  res.send("Ledger service is up and running.")
})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transaction", transactionRoutes)

module.exports = app