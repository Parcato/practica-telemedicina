var rpc = require("./rpc.js"); 
const conexion = require('../conexion_mysql.js'); 

// --- FUNCIONES ---

function obtenerCategorias(callback) {
    conexion.query("SELECT * FROM categorias", function(err, resultados) {
        if (err) return callback(null);
        return callback(resultados);
    }); 
}

function obtenerModelos(callback) {
    conexion.query("SELECT * FROM modelos", function(err, resultados) {
        if (err) return callback(null);
        return callback(resultados);
    });
}

function loginSanitario(usuario, password, callback) {
    var sql = "SELECT * FROM sanitarios WHERE usuario = ? AND password = ?";
    conexion.query(sql, [usuario, password], function(err, resultados) {
        if (err) return callback(null);
        if (resultados.length === 1) return callback(resultados[0].id);
        return callback(null);
    });
}

function crearSanitario(datosSanitario, callback) {
    // 1. comprobar si el usuario ya existe
    var sqlCheck = "SELECT id FROM sanitarios WHERE usuario = ?";
    conexion.query(sqlCheck, [datosSanitario.usuario], function(err, resultados) {
        if (err) return callback(null);
        if (resultados.length > 0) return callback(null); // usuario repetido

        // 2. si no existe, crear
        var sql = "INSERT INTO sanitarios (usuario, password, nombre, apellidos) VALUES (?, ?, ?, ?)";
        conexion.query(sql, [datosSanitario.usuario, datosSanitario.password, datosSanitario.nombre, datosSanitario.apellidos], function(err, resultado) {
            if (err) return callback(null);
            return callback(resultado.insertId);
        });
    });
}

function actualizarSanitario(idSanitario, datosSanitario, callback) {
    // 1. comprobar que el usuario no lo tiene otro
    var sqlCheck = "SELECT id FROM sanitarios WHERE usuario = ? AND id != ?";
    conexion.query(sqlCheck, [datosSanitario.usuario, idSanitario], function(err, resultados) {
        if (err) return callback(null);
        if (resultados.length > 0) return callback(null); // usuario repetido

        // 2. actualizar
        var sql = "UPDATE sanitarios SET usuario = ?, password = ?, nombre = ?, apellidos = ? WHERE id = ?";
        conexion.query(sql, [datosSanitario.usuario, datosSanitario.password, datosSanitario.nombre, datosSanitario.apellidos, idSanitario], function(err) {
            if (err) return callback(false);
            return callback(true);
        });
    });
}

function obtenerSanitario(idSanitario, callback) {
    var sql = "SELECT id, usuario, nombre, apellidos FROM sanitarios WHERE id = ?";
    conexion.query(sql, [idSanitario], function(err, resultados) {
        if (err) return callback(null);
        if (resultados.length === 0) return callback(null);
        return callback(resultados[0]);
    });
}

function obtenerRecurso(idRecurso, callback) {
    // FIX: obtenerRecurso recibe idRecurso no idModelo
    var sql = "SELECT * FROM recursos WHERE id = ?";
    conexion.query(sql, [idRecurso], function(err, resultados) {
        if (err) return callback(null);
        if (resultados.length === 0) return callback(null);
        return callback(resultados[0]);
    });
}

function obtenerRecursos(idModelo, callback) {
    // solo recursos operativos (estado = 0)
    var sql = "SELECT * FROM recursos WHERE modelo = ? AND estado = 0";
    conexion.query(sql, [idModelo], function(err, resultados) {
        if (err) return callback(null);
        return callback(resultados);
    });
}

function tiempoPendiente(idRecurso, callback) {
    // FIX: tiempoPendiente recibe idRecurso no idSanitario
    var sql = "SELECT SUM(h_estim) AS suma FROM reservas WHERE recursoId = ? AND estado != 3";
    conexion.query(sql, [idRecurso], function(err, resultados) {
        if (err) return callback(0);
        return callback(resultados[0].suma || 0);
    });
}

function obtenerReservas(idSanitario, callback) {
    var sql = "SELECT * FROM reservas WHERE sanitario = ?";
    conexion.query(sql, [idSanitario], function(err, resultados) {
        if (err) return callback(null);
        return callback(resultados);
    });
}

function obtenerResenyas(idRecurso, callback) {
    var sql = "SELECT * FROM resenas WHERE recursoId = ?";
    conexion.query(sql, [idRecurso], function(err, resultados) {
        if (err) return callback(null);
        return callback(resultados);
    });
}

function crearResenya(idRecurso, idSanitario, valoracion, descripcion, callback) {
    // FIX: usaba datos.resenas, ahora MySQL
    var sql = "INSERT INTO resenas (recursoId, sanitario, valoracion, comentario, fecha) VALUES (?, ?, ?, ?, NOW())";
    conexion.query(sql, [idRecurso, idSanitario, valoracion, descripcion], function(err, resultado) {
        if (err) return callback(null);
        return callback(resultado.insertId);
    });
}

function reservarRecurso(idRecurso, idSanitario, horasEstimadas, callback) {
    var sql = "INSERT INTO reservas (recursoId, sanitario, h_estimadas, f_peticion, estado) VALUES (" + idRecurso + ", " + idSanitario + ", " + horasEstimadas + ", NOW(), 1)";
    
    conexion.query(sql, function(err, resultado) {
        if (err) {
            console.error("Error al reservar:", err);
            return callback(null);
        }
        return callback(resultado.insertId);
    });
}

function cancelarReserva(idReserva, callback) {
    // FIX: usaba datos.reservas, ahora MySQL
    var sql = "DELETE FROM reservas WHERE id = ?";
    conexion.query(sql, [idReserva], function(err, resultado) {
        if (err) return callback(false);
        if (resultado.affectedRows === 0) return callback(false);
        return callback(true);
    });
}

function iniciarReserva(idReserva, callback) {
    var sql = "UPDATE reservas SET estado = 2, f_inicio = NOW() WHERE id = ?";
    conexion.query(sql, [idReserva], function(err) {
        if (err) return callback(false);
        return callback(true);
    });
}

function finalizarReserva(idReserva, callback) {
    // FIX: faltaba el ? en la query, ponía "WHERE id = idReserva" literal
    var sql = "UPDATE reservas SET estado = 3, f_fin = NOW() WHERE id = ?";
    conexion.query(sql, [idReserva], function(err) {
        if (err) return callback(false);
        return callback(true);
    });
}

function retirarRecurso(idReserva, callback) {
    // 1. buscar la reserva
    conexion.query("SELECT * FROM reservas WHERE id = ?", [idReserva], function(err, resultados) {
        if (err || resultados.length === 0) return callback(false);
        var reserva = resultados[0];

        // 2. actualizar la reserva
        var sql = "UPDATE reservas SET estado = 2, f_inicio = f_peticion, f_fin = DATE_ADD(f_peticion, INTERVAL " + reserva.h_estim + " HOUR) WHERE id = ?";
        conexion.query(sql, [idReserva], function(err) {
            if (err) return callback(false);

            // 3. actualizar el recurso
            conexion.query("UPDATE recursos SET estado = 1 WHERE id = ?", [reserva.recursoId], function(err) {
                if (err) return callback(false);
                return callback(true);
            });
        });
    });
}

//Para  practicar
function asignarArea(idSanitario,idarea, callback) {
    var sql = "UPDATE  areasalud SET sanitario = ? WHERE cpostal = ?";
    conexion.query(sql, [idSanitario,idarea], function(err, resultado) {
        if (err){
            console.log(err);
        return callback(0);
        }
        return callback(resultado.affectedRows);
    });
}

//Para practicar
function marcarurgente(idReserva, callback) {
    // FIX: usaba datos.reservas, ahora MySQL
    var sql = "UPDATE reservas SET urgente = 1 WHERE id = ?";
    conexion.query(sql, [idReserva], function(err, resultado) {
        if (err) {
            console.log(err);
            return callback(false);
        }
        if (resultado.affectedRows === 0) return callback(false);
        return callback(true);
    });
}

// --- REGISTRO ---

var servidor = rpc.server();
var app = servidor.createApp("gestion_recursos");

app.registerAsync(obtenerCategorias);
app.registerAsync(obtenerModelos);
app.registerAsync(loginSanitario);
app.registerAsync(crearSanitario);
app.registerAsync(actualizarSanitario);
app.registerAsync(obtenerSanitario);
app.registerAsync(obtenerRecurso);
app.registerAsync(obtenerRecursos);
app.registerAsync(tiempoPendiente);
app.registerAsync(obtenerReservas);
app.registerAsync(obtenerResenyas);
app.registerAsync(crearResenya);
app.registerAsync(reservarRecurso);
app.registerAsync(cancelarReserva);
app.registerAsync(iniciarReserva);
app.registerAsync(finalizarReserva);
app.registerAsync(retirarRecurso);
app.registerAsync(marcarurgente);
app.registerAsync(asignarArea);
