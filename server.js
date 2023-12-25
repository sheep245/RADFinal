require('dotenv').config()
require('./config/db')
const express = require('express')
const flash = require('express-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const { cookieJwtAuth } = require('./middlewares/jwtAuth')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(cookieParser())
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

app.use(flash())

app.set('view engine', 'ejs')

const AccountRouter = require('./routers/AccountRouter')
const ProductRouter = require('./routers/ProductRouter')
const EmployeeRouter = require('./routers/EmployeeRouter')
const TransactionRouter = require('./routers/TransactionRouter')
const CustomerRouter = require('./routers/CustomerRouter')
app.get('/', cookieJwtAuth, (req, res) => {
    res.render('home', { user: req.user })
})

app.use('/account', AccountRouter)
app.use('/employee', EmployeeRouter)
app.use('/product', ProductRouter)
app.use('/transaction', TransactionRouter)
app.use('/customer', CustomerRouter)

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`http://localhost:${port}`))