const express = require('express');
const app = express();
const conexion = require('../conexion_mysql.js');
const jwt = require('jsonwebtoken');

// Una clave secreta para firmar los tokens (en producción va en variables de entorno)
const CLAVE_SECRETA = 'mi_clave_secreta_super_segura';

app.use(express.json());
app.use('/practica', express.static(__dirname + '/cliente'));

// =====================
// MIDDLEWARE JWT
// =====================
function verificarTokenJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    // El formato esperado es "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send("Acceso denegado: No se proporcionó un token");
    }

    jwt.verify(token, CLAVE_SECRETA, (err, usuarioDecodificado) => {
        if (err) {
            return res.status(403).send("Token inválido o expirado");
        }
        
        // Guardamos los datos del usuario en la petición por si los necesitamos
        req.usuario = usuarioDecodificado;
        next(); // Dejamos continuar la petición hacia la ruta
    });
}

// =====================
// API GESTORES
// =====================

// LOGIN (Libre, no lleva verificación porque es donde se consigue el token)
app.post('/api/gestores/login', (req, res) => {
    var login = req.body.login;
    var password = req.body.password;
    var sql = "SELECT * FROM gestores WHERE usuario = '" + login + "' AND password = '" + password + "'";
    
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send("Error en el servidor");
        
        if (resultados.length === 1) {
            var gestor = resultados[0];
            
            // Creamos el payload (datos que viajan dentro del token)
            var payload = { id: gestor.id, usuario: gestor.usuario };
            
            // Firmamos el token (caduca en 2 horas)
            var token = jwt.sign(payload, CLAVE_SECRETA, { expiresIn: '2h' });

            // Devolvemos el token y el ID al cliente
            res.status(200).json({
                token: token,
                id: gestor.id
            });
        } else {
            res.status(403).send("Credenciales incorrectas");
        }
    });
});

// REGISTRO (Libre o protegido según prefieras, lo dejamos libre para poder crear cuentas)
app.post('/api/gestores', (req, res) => {
    var { usuario, password, nombre, apellidos } = req.body;
    var sqlCheck = "SELECT * FROM gestores WHERE usuario = '" + usuario + "'";
    conexion.query(sqlCheck, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length > 0) return res.status(403).send("El login ya existe");
        var sql = "INSERT INTO gestores (usuario, password, nombre, apellidos) VALUES ('" + usuario + "', '" + password + "', '" + nombre + "', '" + apellidos + "')";
        conexion.query(sql, function(err, resultado) {
            if (err) return res.status(500).send();
            res.status(201).json(resultado.insertId);
        });
    });
});

// EDITAR GESTOR (Protegido)
app.put('/api/gestores/:id', verificarTokenJWT, (req, res) => {
    var { usuario, password, nombre, apellidos } = req.body;
    var sqlCheck = "SELECT * FROM gestores WHERE usuario = '" + usuario + "' AND id != " + req.params.id;
    conexion.query(sqlCheck, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length > 0) return res.status(403).send("El login ya existe");
        var sql = "UPDATE gestores SET usuario = '" + usuario + "', password = '" + password + "', nombre = '" + nombre + "', apellidos = '" + apellidos + "' WHERE id = " + req.params.id;
        conexion.query(sql, function(err) {
            if (err) return res.status(500).send();
            res.status(200).json(parseInt(req.params.id));
        });
    });
});

// OBTENER GESTOR (Protegido)
app.get('/api/gestores/:id', verificarTokenJWT, (req, res) => {
    var sql = "SELECT id, usuario, nombre, apellidos FROM gestores WHERE id = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length === 0) return res.status(404).send();
        res.status(200).json(resultados[0]);
    });
});

// =====================
// API SANITARIOS
// =====================

app.get('/api/sanitarios/:id', verificarTokenJWT, (req, res) => {
    var sql = "SELECT id, usuario, nombre, apellidos FROM sanitarios WHERE id = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length === 0) return res.status(404).send();
        res.status(200).json(resultados[0]);
    });
});

// =====================
// API RECURSOS (Todas protegidas con verificarTokenJWT)
// =====================

app.get('/api/recursos', verificarTokenJWT, (req, res) => {
    var sql = "SELECT * FROM recursos WHERE 1=1";
    if (req.query.modelo && req.query.modelo !== 'Todos') {
        sql += " AND modelo = " + req.query.modelo;
    }
    if (req.query.ubicacion && req.query.ubicacion !== 'Todos') {
        sql += " AND ubicacion = " + req.query.ubicacion;
    }
    if (req.query.estado && req.query.estado !== 'Todos') {
        sql += " AND estado = " + req.query.estado;
    }
    if (req.query.categoria && req.query.categoria !== 'Todos') {
        sql += " AND modelo IN (SELECT id FROM modelos WHERE categoria = " + req.query.categoria + ")";
    }
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.get('/api/recursos/:id/reservas', verificarTokenJWT, (req, res) => {
    var sql = "SELECT * FROM reservas WHERE recursoId = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.get('/api/recursos/:id/resenyas', verificarTokenJWT, (req, res) => {
    var sql = "SELECT * FROM resenas WHERE recursoId = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.get('/api/recursos/:id', verificarTokenJWT, (req, res) => {
    var sql = "SELECT * FROM recursos WHERE id = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length === 0) return res.status(404).send();
        res.status(200).json(resultados[0]);
    });
});

app.post('/api/recursos', verificarTokenJWT, (req, res) => {
    var { numero_serie, modelo, ubicacion, estado } = req.body;
    var sql = "INSERT INTO recursos (numero_serie, modelo, ubicacion, estado) VALUES ('" + numero_serie + "', " + modelo + ", " + ubicacion + ", " + estado + ")";
    conexion.query(sql, function(err, resultado) {
        if (err) return res.status(500).send();
        res.status(201).json({ id: resultado.insertId, numero_serie, modelo, ubicacion, estado });
    });
});

app.put('/api/recursos/:id', verificarTokenJWT, (req, res) => {
    var { numero_serie, modelo, ubicacion, estado } = req.body;
    var sql = "UPDATE recursos SET numero_serie = '" + numero_serie + "', modelo = " + modelo + ", ubicacion = " + ubicacion + ", estado = " + estado + " WHERE id = " + req.params.id;
    conexion.query(sql, function(err) {
        if (err) return res.status(500).send();
        res.status(200).json({ id: parseInt(req.params.id), numero_serie, modelo, ubicacion, estado });
    });
});

app.delete('/api/recursos/:id', verificarTokenJWT, (req, res) => {
    var sql = "DELETE FROM recursos WHERE id = " + req.params.id;
    conexion.query(sql, function(err) {
        if (err) return res.status(500).send();
        res.status(204).send();
    });
});

// =====================
// RUTAS AUXILIARES (Protegidas)
// =====================

app.get('/api/categorias', verificarTokenJWT, (req, res) => {
    conexion.query("SELECT * FROM categorias", function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.get('/api/modelos', verificarTokenJWT, (req, res) => {
    conexion.query("SELECT * FROM modelos", function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.get('/api/ubicaciones', verificarTokenJWT, (req, res) => {
    conexion.query("SELECT * FROM ubicaciones", function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.post('/api/reportes', verificarTokenJWT, (req, res) => {
    var { descripcion, gravedad, gestor, recurso } = req.body;
    var sql = "INSERT INTO reportes (fecha, descripcion, gravedad, gestor, recurso) VALUES (NOW(), '" + descripcion + "', " + gravedad + ", " + gestor + ", " + recurso + ")";
    conexion.query(sql, function(err, resultado) {
        if (err) {
            console.log(err);
            return res.status(500).send();
        }
        res.status(201).json(resultado.insertId);
    });
});

app.post('/api/area_salud', verificarTokenJWT, (req, res) => {
    var { nombre, codigopostal, gestor } = req.body;
    var sql = "INSERT INTO areasalud (cpostal, nombre, gestor) VALUES ('" + codigopostal + ", " + nombre + "', " + gestor + ")";
    conexion.query(sql, function(err, resultado) {
        if (err) {
            console.log(err);
            return res.status(500).send();
        }
        res.status(201).json(resultado.insertId);
    });
});

app.listen(3000, () => console.log("Servidor iniciado en http://localhost:3000/practica"));