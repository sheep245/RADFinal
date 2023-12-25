const express = require('express')
const router = express.Router()
const controller = require('../controller/account')
const { registerValidator, loginValidator, changePasswordValidator, resetPassword } = require('../middlewares/accountValidate')
const { cookieJwtAuth } = require('../middlewares/jwtAuth')

router.get('/createPassword', controller.createPassword)

router.post('/createPassword', registerValidator, controller.handleCreatePassword)

router.get('/forgotPassword', controller.forgotPassword)

router.post('/forgotPassword', resetPassword, controller.handleForgotPassword)

router.get('/resetPassword/:username/:uniqueString', controller.resetPassword)

router.get('/confirmResetPwd', controller.confirmResetPwd)

router.get('/login', controller.login)

router.post('/login', loginValidator, controller.handleLogin)

router.get('/profile', cookieJwtAuth, controller.profile)

router.post('/updateProfile', cookieJwtAuth, controller.updateProfile)

router.get('/changePassword', cookieJwtAuth, controller.changePassword)

router.post('/changePassword', cookieJwtAuth, changePasswordValidator,controller.handleChangePassword)

router.get('/logout', controller.logout)

module.exports = router