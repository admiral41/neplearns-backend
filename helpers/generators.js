const generateRandomNum = (maxNumber, minNumber) =>{
    return parseInt(Math.random() * (maxNumber - minNumber + 1) + minNumber);
}

module.exports = {
    generateRandomNum
}
