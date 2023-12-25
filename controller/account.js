require('dotenv').config()
const express = require('express')
const bcrypt = require('bcrypt')
const session = require('express-session')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const User = require('../models/UserModel')
const { route } = require('../routers/AccountRouter')
const { v4: uuidv4 } = require('uuid')
const UserVerification = require('../models/UserVerification')
const nodemailer = require('nodemailer')
const transporter = createTransporter();

const saltRounds = 10

function createTransporter() {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.AUTH_EMAIL,
            clientId: process.env.AUTH_CLIENT_ID,
            clientSecret: process.env.AUTH_CLIENT_SECRET,
            refreshToken: process.env.AUTH_REFRESH_TOKEN,
        },
    })

    transporter.verify((error) => {
        if (error) console.log(error)
    })

    return transporter;
}

const imageFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Images Only!'), false)
    }
}

const storage = multer.diskStorage({
    destination: 'public/images/users/',
    filename: (req, file, cb) => {
        cb(null, `${req.user.username}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ 
    storage,
    fileFilter: imageFilter 
})

module.exports.logout = (req, res) => {
    const token = req.cookies.token

    if (!token) {
        res.redirect('/account/login')
    }
    res.clearCookie('token');
    req.session.destroy(() => { res.redirect('/account/login') })
}

module.exports.login = (req, res) => {
    res.render('login', { error: req.flash('error'), formData: req.session.formData || {}})
    delete req.session.formData
}

module.exports.handleLogin = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg
        req.flash('error', firstError)
        req.session.formData = req.body
        return res.redirect('/account/login')
    }

    const { username, password } = req.body
    
    try {
        const user = await User.findOne({ username })
        if (!user) {
            req.flash('error', 'Invalid credentials entered')
            req.session.formData = req.body
            return res.redirect('/account/login')
        }

        if (user.active == false) {
            req.flash('error', 'Please login by clicking on the link in your email')
            return res.redirect('/account/login')
        }

        if (user.lock) {
            req.flash('error', 'You have been block from the server')
            return res.redirect('/account/login')
        }

        if (user.password === username) {
            req.flash('error', 'Please create a new password')
            return res.redirect('/account/createPasswrod')
        }

        const comparePassword = await bcrypt.compare(password, user.password)
        if (comparePassword) {
            if (password === user.username && username !== 'admin') {
                req.session.username = user.username
                req.flash('error', 'Please create a new password')
                return res.redirect('/account/createPassword')
            }

            const userPayload = {
                username : user.username,
                role: user.role,
                password: user.password,
                profile: {
                    name: user.profile.name,
                    email: user.profile.email,
                    avatar: user.profile.avatar,
                    gender: user.profile.gender,
                    dob: user.profile.dateOfBirth,
                    phone: user.profile.phone,
                    address: user.profile.address
                }
            }
            const token = jwt.sign(userPayload, process.env.JWT, {expiresIn: '1h'})
        
            res.cookie("token", token, {
                httpOnly: true,
                // secure: true,
                // maxAge: 10000,
                // signed: true,
            })
            return res.redirect('/')
        } else {
            req.flash('error', 'Username or password are incorrect')
            req.session.formData = req.body
            res.redirect('/account/login');
        }
    } catch (error) {
        res.status(500).json({ status: 'FAILED', message: 'Internal server error', error: error.message })
    }
}

module.exports.changePassword = (req, res) => {
    const error = req.flash('error')
    const success = req.flash('success')
    const formData = req.session.formData || {}
    const user = req.user
    res.render('changePassword', { user, error, success, formData })
    delete req.session.formData
}

module.exports.handleChangePassword = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg
        return res.json({ success: false, error: firstError })
    }
   
    const { currentPassword, newPassword } = req.body
    const user = req.user
    const result = await bcrypt.compare(currentPassword, user.password)
    if (result) {
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
        const updatedUser = await User.findOneAndUpdate(
            { username: user.username },
            { password: hashedPassword },
            { new: true }
        )
        if (updatedUser) {
            if (req.session.formData) {
                delete req.session.formData
            }
            return res.json({ success: true, message: 'Update password successful'})
        } else {
            return res.json({ success: false, message: 'Fail to update password' })
        }
    } else {
        return res.json({ success: false, message: 'Error when processing update password' })
    }
}

module.exports.profile = async (req, res) => {
    const user = req.user

    const avatarPath = `/images/users/${user.username}.png`
    const imagePath = path.join(__dirname, '..', 'public', avatarPath)

    try {
        await fs.promises.access(imagePath, fs.constants.F_OK)
        res.render('profile', { user, avatarPath, error: req.flash('error') });
    } catch (error) {
        res.render('profile', { user, avatarPath: '/images/avatar.png', error: req.flash('error') })
    }
}

module.exports.updateProfile = (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        const user = req.user

        if (err) {
            return res.json({ success: false, error: 'Images only!' })
        }

        if (!req.file) {
            req.flash('error', 'Image not found')
            return res.redirect('/account/profile')
        }

        const tempPath = `public/images/users/temp_${req.file.filename}`
        const finalPath = `public/images/users/${req.file.filename}`

        try {
            const size = 200
            await sharp(req.file.path)
                .resize(size, size)
                .composite([{
                    input: Buffer.from(
                        `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
                    ),
                    blend: 'dest-in'
                }])
                .toFile(tempPath)

            fs.renameSync(tempPath, finalPath)

            await User.findByIdAndUpdate(user._id, { 'profile.avatar': `images/users/${req.file.filename}` })
            
            res.json({ success: true, message: 'Update profile successful' })
        } catch (error) {
            res.json({ success: false, error: 'An error occurred while updating profile.' })
        }
    })
}

module.exports.createPassword = (req, res) => {
    if (req.session.createPassword == false) {
        return res.redirect('/account/login')
    }
    req.session.createPassword = true
    res.render('createPassword', { username: req.session.username, error: req.flash('error'), formData: req.session.formData || {} })
    delete req.session.formData
}

module.exports.handleCreatePassword = (req, res) => {
    let result = validationResult(req)
    let message

    const username = req.session.username

    if (result.errors.length === 0) {
        const { password } = req.body


        if (username == password) {
            req.flash('error', 'Cannot use the same password as the username')
            req.flash('username', username)
            return res.redirect('/account/createPassword')
        }
        const hashedPassword = bcrypt.hashSync(password, saltRounds)

        User.findOneAndUpdate({ username: username }, { $set: { password: hashedPassword } })
            .then(result => {
                if (result) {
                    delete req.session.createPassword
                    delete req.session.username
                    if (req.user) delete req.user
                    delete req.session.formData
                    res.redirect('/account/login')
                } else {
                    req.flash('error', 'An error occur while creating new password')
                    res.redirect('/account/createPassword')
                }
            })
            .catch(error => {
                req.flash('username', username)
                req.flash('error', 'An error occure while finding user')
                res.redirect('/account/createPassword')
            })
    } else {
        result = result.mapped()
        for (let fields in result) {
            message = result[fields].msg
            break
        }

        req.session.formData = req.body
        req.flash('error', message)
        res.redirect('/account/createPassword')
    }
}

module.exports.forgotPassword = (req, res) => {
    const formData = req.session.formData || {}
    res.render('forgotPassword', {formData, error: req.flash('error')})
    delete req.session.formData
}

module.exports.handleForgotPassword = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        req.session.formData = req.body
        req.flash('error', errors.array()[0].msg)
        return res.redirect('/account/forgotPassword')
    }

    const { email } = req.body

    try {
        const user = await User.findOne({ 'profile.email': email });
        if (!user) {
            req.flash('error', 'No user found with this email address')
            return res.redirect('/account/forgotPassword')
        }
        sendForgotPasswordEmail(user, req, res)
        
        res.redirect('/account/confirmResetPwd')
    } catch (error) {
        console.error(error)
        req.flash('error', 'An error occurred during the forgot password process')
        res.redirect('/account/forgotPassword')
    }
}

async function sendForgotPasswordEmail(user, req, res) {
    const { username, profile } = user
    const currentUrl = 'http://localhost:9090/'
    const uniqueString = uuidv4() + username
    const mailOption = {
        from: process.env.AUTH_EMAIL,
        to: profile.email,
        subject: 'Reset Your Password',
        html: `<p>Click the link below to reset your password.</p>
               <p>This link <b>expires in 1 hour</b>. If you didn't request a password reset, ignore this email.</p>
               <p>Press <a href="${currentUrl}account/resetPassword/${username}/${uniqueString}">here</a> to reset your password.</p>`
    }

    try {
        const hashedUniqueString = await bcrypt.hash(uniqueString, saltRounds)
        const newVerification = new UserVerification({
            username,
            uniqueString: hashedUniqueString,
            createAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        })

        const userVerification = await UserVerification.findOne({ username })

        if (userVerification) {
            await UserVerification.deleteOne({ username })
        }

        await newVerification.save()
        await transporter.sendMail(mailOption)

    } catch (error) {
        console.error(error);
        return res.json({ success: false, error: 'An error occurred while sending password reset email' });
    }
}

module.exports.resetPassword = async (req, res) => {
    const { username, uniqueString } = req.params;

    try {
        const userVerification = await UserVerification.findOne({ username });

        if (!userVerification) {
            return res.json({
                status: 'FAILED',
                message: "Account record doesn't exist or password has been reset already",
            });
        }

        if (userVerification.expiresAt < Date.now()) {
            await UserVerification.deleteOne({ username });
            return res.json({
                status: 'FAILED',
                message: 'Link has expired',
            });
        }

        const isMatch = await bcrypt.compare(uniqueString, userVerification.uniqueString);
        if (!isMatch) {
            return res.json({ status: 'FAILED', message: 'Invalid verification detail.' });
        }

        await UserVerification.deleteOne({ username })
        req.session.username = username
        res.redirect('/account/createPassword');
    } catch (error) {
        console.error(error);
        res.json({ status: 'FAILED', message: 'An error occurred during password reset verification' });
    }
}

module.exports.confirmResetPwd = (req, res) => {
    res.render('confirmResetPwd')
}