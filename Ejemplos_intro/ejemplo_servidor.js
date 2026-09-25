var express = require('express'); //cargar el módulo
var app = express(); // crear la app express

var num=0;

app.get('/hola', function(req, res){ 
                            
    console.log("Hola Mundo.  Peticion: " + num); 
    res.send("Hola Mundo. Peticion: " + num); 
    num++
});                                               

app.get('/adios', function(req, res){  
    res.send("Adios Mundo. Peticion: " + num);  
    num=0; 
}); 

var banner = require('figlet');

app.get('/banner', function(req, res){
    res.send("Banner");
    banner('hola!!', function(err, data) {
        if (err) {
            console.log('Algo fue mal...');
            console.dir(err);
            return;
        }
        console.log(data)
    });
});

app.get('/adiosbanner', function(req, res){
    res.send("Banner");
    banner('adios!!', function(err, data) {
        if (err) {
            console.log('Algo fue mal...');
            console.dir(err);
            return;
        }
        console.log(data)
    });
});




/*
app.get('/*', function(req, res, next){   
num++;                                 
console.log("peticiones realizadas: ", num); 
res.send("peticiones realizadas: " + num);  
next(); 
});
*/

app.listen(3000, function(){ 
    console.log("Servidor escuchando en puerto 3000");
})











                                    