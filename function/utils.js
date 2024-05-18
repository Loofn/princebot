const Vibrant = require('node-vibrant');
const weather = require('weather-js');

function isHexColor(input){
    const hexPattern = /^(#)?[0-9a-fA-F]+$/;
    return hexPattern.test(input);
}

/**
 * Checks if the given input is list of IDs seperated with comma, no spaces
 * @param {String} input 
 * @returns {boolean} 
 */
function isIDList(input){
    var regex = /^\d+(,\d+)+$/;
    return regex.test(input);
}

async function getDominantColorFromURL(imageURL) {
    try {
        // Create a Vibrant instance with the image URL
        const vibrant = await Vibrant.from(imageURL).getPalette();

        // Extract the dominant color from the Vibrant palette
        const dominantColor = vibrant.Vibrant.getHex();

        // Return the RGB values of the dominant color
        return dominantColor;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function isImageLink(str){
    var regex = /\.(jpeg|jpg|gif|png)$/i;
    return regex.test(str);
}

async function getWeather(loc, degree="C"){
    return new Promise((resolve, reject) => {
        weather.find({search: loc, degreeType: degree}, function (err, res){
            if(err) {
                console.error(err)
                reject()
            }
            resolve(res);
        })
    })
}

/**
 * Make the original string shorter.
 * 
 * @param {String} str 
 * @param {Integer} maxLength 
 * @returns {String} Shortened string
 */
function shortenString(str, maxLength){
    if(str.length > maxLength){
        return str.substring(0, maxLength);
    }
}

function getRandomInteger(x) {
    return Math.floor(Math.random() * x) + 1;
}

module.exports = {
    isHexColor,
    isIDList,
    getDominantColorFromURL,
    isImageLink,
    getWeather,
    shortenString,
    getRandomInteger
}