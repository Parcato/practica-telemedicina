const mysql = require('mysql');
const database = {
    host : 'localhost',
    user : 'tele2026',
    password : 'Ey)weLNtvOwmDwcO',
    database : 'telemedicina_2026'
};

const conexion = mysql.createConnection(database);

conexion.connect(function (err) {
    if (err) {
        console.error('Error en la conexión de la base de datos:',err);
        process.exit();
    }
    else {
        console.log('Conexión establecida con éxito');
    }
});

module.exports = conexion;