//https://www.codementor.io/@ashish1dev/list-of-useful-nodejs-modules-du107mcv3
//https://www.w3schools.com/nodejs/ref_modules.asp
/*Requerir módulo propio*/
const math=require("./modulo_math");
console.log("El cuadrado de n es " + math.pot(4));
console.log("El doble de 3 es : " + math.dob(3));


/*Requerir módulo nativo de NodeJs*/

const fs = require("fs");

fs.readdir(".", function (err,archivos){
    //error
    console.log("Los archivos son: ",archivos);
})


/*Requerir módulo externo de NodeJs. Requiere instalación.*/
//para crear un banner
var banner = require('figlet');
 
banner('Felicidades!!', function(err, data) {
    if (err) {
        console.log('Algo fue mal...');
        console.dir(err);
        return;
    }
    console.log(data)
});




