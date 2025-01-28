const mongoose = require('mongoose');

const emailExtractorSchema = new mongoose.Schema({
    userName: String,
    clientId: String,
    clientSecret: String,
    port: Number,
    useSSL: Boolean,
    subject: String
});

module.exports = mongoose.model('EmailExtractor', emailExtractorSchema);
