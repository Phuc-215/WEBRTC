const fs = require('fs');
const path = require('path');

module.exports = {
    key: fs.readFileSync(path.join(__dirname, '../../certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/cert.pem'))
};
