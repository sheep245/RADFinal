const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserVerificationSchema = new Schema({
    username: String,
    uniqueString: String,
    createAt: Date,
    expiresAt: Date
})

const UserVerification = mongoose.model('UserVerification', UserVerificationSchema)

module.exports = UserVerification