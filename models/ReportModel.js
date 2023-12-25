const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ReportSchema = new Schema({
    report_type: {
        type: String,
        required: true
    },
    date_generated: {
        type: Date,
        default: Date.now
    },
    data: {
        type: Schema.Types.Mixed, // Allows for storing any data structure
        required: true
    }
})

const Report = mongoose.model('Report', ReportSchema)

module.exports = Report