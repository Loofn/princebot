const moment = require('moment');

const startTime = moment();

function getUptime(){
    return startTime;
}

module.exports = {
    getUptime
}