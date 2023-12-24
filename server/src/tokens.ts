
<<<<<<<< HEAD:server/tokens.ts
function _tokenGenerator(tokenSize: number) : string {
    let token = "";
    for (let i = 0; i < tokenSize ; i++) {
========
export function tokenGenerator(tokenSize: number): string {
    let token = "";
    for (let i=0; i < tokenSize ; i++) {
>>>>>>>> typescript:server/src/tokens.ts
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

<<<<<<<< HEAD:server/tokens.ts
module.exports = _tokenGenerator;
========
>>>>>>>> typescript:server/src/tokens.ts
