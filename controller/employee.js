require('dotenv').config()
const express = require('express')
const bcrypt = require('bcrypt')
const { validationResult } = require('express-validator')
const nodemailer = require('nodemailer')
const { v4: uuidv4 } = require('uuid')
const User = require('../models/UserModel')
const UserVerification = require('../models/UserVerification')
const session = require('express-session')
const flash = require('express-flash')

const saltRounds = 10
const transporter = createTransporter();

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

module.exports.employee = async (req, res) => {
    try {
        const employees = await User.find();
        res.render('employee', {
            user: req.user,
            employees,
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.addEmployee = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg
        return res.json({ success: false, error: firstError })
    }
    

    let { fullname, email, gender, dob, phone, address, role } = req.body
    if (role == undefined) {
        role = 'Staff'
    }

    try {
        const existingUsers = await User.find({ 'profile.email': email })
        if (existingUsers.length) {
            return res.json({ success: false, error: 'User with the provided email already exists' })
        }

        const username = email.split('@')[0]
        const hashedPassword = await bcrypt.hash(username, saltRounds)
        const newUser = new User({
            username,
            password: hashedPassword,
            role,
            active: false,
            lock: false,
            profile: { name: fullname, email, gender, dateOfBirth: dob, phone, address },
        })

        await newUser.save()
        sendVerificationEmail(newUser, req, res)
        return res.json({ success: true})
    } catch (error) {
        console.error(error)
        return res.json({ success: false, error: error.message })
    }
}

module.exports.editEmployee = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg
        return res.json({ success: false, error: firstError })
    }

    let { fullname, email, gender, dob, phone, address, role } = req.body

    if (role == undefined) {
        const user = await User.findOne({ 'profile.email': email }, 'role')
        role = user.role
    }

    try {
        const result = await User.findOneAndUpdate(
            { 'profile.email': email },
            {
                $set: {
                    role: role,
                    'profile.name': fullname,
                    'profile.email': email,
                    'profile.gender': gender,
                    'profile.dob': dob,
                    'profile.phone': phone,
                    'profile.address': address,
                },
            },
            { new: true }
        );

        if (result) {
            return res.json({ success: true });
        } else {
            return res.json({
                success: false,
                error: 'An error occurred while updating the employee',
            })
        }
    } catch (error) {
        console.error(error);
        return res.json({ success: false, error: error.message })
    }
}

module.exports.deleteEmployee = async (req, res) => {
    const { username } = req.params;

    try {
        const result = await User.deleteOne({ username })

        if (result.deletedCount > 0) {
            return res.redirect('/employee')
        } else {
            return res.json({
                success: false,
                error: 'User not found or an error occurred while deleting the employee',
            })
        }
    } catch (error) {
        console.error(error);
        return res.json({ success: false, error: error.message })
    }
}

async function sendVerificationEmail(user, req, res) {
    const { username, profile } = user
    const currentUrl = 'http://localhost:9090/'
    const uniqueString = uuidv4() + username
    const mailOption = {
        from: process.env.AUTH_EMAIL,
        to: profile.email,
        subject: 'Verify Your Email',
        html: `<p>Verify your email address to complete the signup and login into your account.</p>
                <p>This link <b>expires in 1 minute</b>, after that you need to contact your admin to resend email verification.</p>
                <p>Press <a href="${currentUrl}employee/verify/${username}/${uniqueString}">here</a> to proceed.</p>`
    }

    try {
        const hashedUniqueString = await bcrypt.hash(uniqueString, saltRounds)
        const newVerification = new UserVerification({
            username,
            uniqueString: hashedUniqueString,
            createAt: Date.now(),
            expiresAt: Date.now() + 60000,
        })

        const userVerification = await UserVerification.findOne({ username })

        if (userVerification) {
            await UserVerification.deleteOne({ username })
        }

        await newVerification.save()
        await transporter.sendMail(mailOption)
        
    } catch (error) {
        console.error(error)
        return res.json({ success: false, error: 'An error occurred while sending verification email' })
    }
}

module.exports.verify = async (req, res) => {
    req.session.createPassword = true

    const { username, uniqueString } = req.params

    try {
        const userVerification = await UserVerification.findOne({ username })

        if (!userVerification) {
            return res.send("Account record doesn't exist or has been verified already")
        }

        if (userVerification.expiresAt < Date.now()) {
            await UserVerification.deleteOne({ username })
            return res.send("Link has expired")
        }

        const isMatch = await bcrypt.compare(uniqueString, userVerification.uniqueString)
        if (!isMatch) {
            return res.json({ status: "FAILED", message: "Invalid verification detail" })
        }

        await User.updateOne({ username }, { active: true })
        await UserVerification.deleteOne({ username })
        req.session.username = username
        res.redirect('/account/createPassword')
    } catch (error) {
        console.error(error);
        res.json({ status: "FAILED", message: "An error occurred during verification" })
    }
}

module.exports.resendLink = async (req, res) => {
    const { username } = req.params

    User.findOne({ username : username })
        .then(user => {
            if (!user) {
                return res.json({ success: false, error: 'User with the provided email does not exist' })
            }

            sendVerificationEmail(user, req, res)
            return res.redirect('/employee')
        })
        .catch(error => {
            console.error(error)
            return res.status(500).json({ success: false, error: 'Internal Server Error' })
        })
}

exports.lockUser = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.lock = !user.lock;
        await user.save();
        res.redirect('/employee')
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}


exports.checkLockStatus = async (req, res, next) => {
    if (!req.user) {
        return res.redirect('/account/login')
    }

    const user = await User.findOne({ username: req.user.username })
    if (user.lock) {
        req.session.destroy()
        return res.redirect('/account/login')
    }

    next()
}