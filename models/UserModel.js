const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Super Admin', 'Admin', 'Staff'],
        required: true
    },
    lock: {
        type: Boolean,
        default: false
    },
    active: Boolean,
    profile: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        avatar: String,
        gender: {
            type: String,
            enum: ['Male', 'Female'],
        },
        dateOfBirth: String,
        phone: String,
        address: String,
        start_at: {
            type: Date,
            default: Date.now
        }
    }
})

const User = mongoose.model('Users', UserSchema)

module.exports = User