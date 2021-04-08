const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', '..', 'platforms', 'ios', 'internal', 'nativescript-build.xcconfig');
if (fs.existsSync(filePath)) {
    fs.appendFile(filePath, '\nVALIDATE_WORKSPACE = YES', function (err) {
        if (err) {
            throw err;
        }
        console.log('Modified successfully nativescript-build.xcconfig...');
    });
}
