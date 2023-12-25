const express = require('express')
const router = express.Router()
const controller = require('../controller/employee')
const { addEmployeeValidator } = require('../middlewares/employeeValidate')
const { cookieJwtAuth } = require('../middlewares/jwtAuth')

router.get('/', cookieJwtAuth, controller.employee)

router.post('/addEmployee', addEmployeeValidator, controller.addEmployee)

router.post('/editEmployee', addEmployeeValidator, controller.editEmployee)

router.get('/delete/:username', controller.deleteEmployee)

router.get('/verify/:username/:uniqueString', controller.verify)

router.get('/resendLink/:username', controller.resendLink)

router.get("/lock/:username", controller.lockUser)
module.exports = router