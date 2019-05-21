
function tokenGenerator(tokenSize) {
    let token = "";
    for (i=0; i < tokenSize ; i++) {
        let base = Math.floor(Math.random() * 62)
        if (base > 51 )
            token += (base - 52)
        else if (base > 25 )
            token += String.fromCharCode(39  + base);
        else
            token +=  String.fromCharCode(97 + base);
    }
    return token;
}

module.exports = tokenGenerator;
