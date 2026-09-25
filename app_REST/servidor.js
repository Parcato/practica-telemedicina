const express = require('express');
const app = express();
const conexion = require('../conexion_mysql.js');

app.use(express.json());
app.use('/practica', express.static(__dirname + '/cliente'));

// =====================
// API GESTORES
// =====================

// LOGIN
app.post('/api/gestores/login', (req, res) => {
    var login = req.body.login;
    var password = req.body.password;
    var sql = "SELECT * FROM gestores WHERE usuario = '" + login + "' AND password = '" + password + "'";
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length === 1) res.status(200).json(resultados[0].id);
        else res.status(403).send("Credenciales incorrectas");
    });
});

// REGISTRO
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

// EDITAR GESTOR
app.put('/api/gestores/:id', (req, res) => {
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

// OBTENER GESTOR
app.get('/api/gestores/:id', (req, res) => {
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

app.get('/api/sanitarios/:id', (req, res) => {
    var sql = "SELECT id, usuario, nombre, apellidos FROM sanitarios WHERE id = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length === 0) return res.status(404).send();
        res.status(200).json(resultados[0]);
    });
});

// =====================
// API RECURSOS
// =====================

// OBTENER RECURSOS CON FILTROS
app.get('/api/recursos', (req, res) => {
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

// OBTENER RESERVAS DE UN RECURSO
app.get('/api/recursos/:id/reservas', (req, res) => {
    var sql = "SELECT * FROM reservas WHERE recursoId = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

// OBTENER RESEÑAS DE UN RECURSO
app.get('/api/recursos/:id/resenyas', (req, res) => {
    var sql = "SELECT * FROM resenas WHERE recursoId = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

// OBTENER UN RECURSO
app.get('/api/recursos/:id', (req, res) => {
    var sql = "SELECT * FROM recursos WHERE id = " + req.params.id;
    conexion.query(sql, function(err, resultados) {
        if (err) return res.status(500).send();
        if (resultados.length === 0) return res.status(404).send();
        res.status(200).json(resultados[0]);
    });
});

// CREAR RECURSO
app.post('/api/recursos', (req, res) => {
    var { numero_serie, modelo, ubicacion, estado } = req.body;
    var sql = "INSERT INTO recursos (numero_serie, modelo, ubicacion, estado) VALUES ('" + numero_serie + "', " + modelo + ", " + ubicacion + ", " + estado + ")";
    conexion.query(sql, function(err, resultado) {
        if (err) return res.status(500).send();
        res.status(201).json({ id: resultado.insertId, numero_serie, modelo, ubicacion, estado });
    });
});

// ACTUALIZAR RECURSO
app.put('/api/recursos/:id', (req, res) => {
    var { numero_serie, modelo, ubicacion, estado } = req.body;
    var sql = "UPDATE recursos SET numero_serie = '" + numero_serie + "', modelo = " + modelo + ", ubicacion = " + ubicacion + ", estado = " + estado + " WHERE id = " + req.params.id;
    conexion.query(sql, function(err) {
        if (err) return res.status(500).send();
        res.status(200).json({ id: parseInt(req.params.id), numero_serie, modelo, ubicacion, estado });
    });
});

// BORRAR RECURSO
app.delete('/api/recursos/:id', (req, res) => {
    var sql = "DELETE FROM recursos WHERE id = " + req.params.id;
    conexion.query(sql, function(err) {
        if (err) return res.status(500).send();
        res.status(204).send();
    });
});

// =====================
// RUTAS AUXILIARES
// =====================

app.get('/api/categorias', (req, res) => {
    conexion.query("SELECT * FROM categorias", function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.get('/api/modelos', (req, res) => {
    conexion.query("SELECT * FROM modelos", function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.get('/api/ubicaciones', (req, res) => {
    conexion.query("SELECT * FROM ubicaciones", function(err, resultados) {
        if (err) return res.status(500).send();
        res.status(200).json(resultados);
    });
});

app.listen(3000, () => console.log("Servidor iniciado en http://localhost:3000/practica"));