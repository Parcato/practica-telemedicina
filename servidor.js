// Servidor REST del gestor de recursos (PostgreSQL + JWT). Un único puerto: process.env.PORT
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./conexion_db.js');

const CLAVE_SECRETA = process.env.JWT_SECRET;
if (!CLAVE_SECRETA) {
    console.error('Falta la variable de entorno JWT_SECRET');
    process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'cliente')));

// Helper: responde 500 si la consulta falla
function responder(res, promesa, onOk) {
    promesa
        .then(filas => onOk(filas))
        .catch(err => { console.error(err.message); res.status(500).send(); });
}

// =====================
// MIDDLEWARE JWT
// =====================
function verificarTokenJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send("Acceso denegado: No se proporcionó un token");

    jwt.verify(token, CLAVE_SECRETA, (err, usuarioDecodificado) => {
        if (err) return res.status(403).send("Token inválido o expirado");
        req.usuario = usuarioDecodificado;
        next();
    });
}

// =====================
// API GESTORES
// =====================

app.post('/api/gestores/login', (req, res) => {
    const { login, password } = req.body;
    responder(res,
        db.query("SELECT * FROM gestores WHERE usuario = $1 AND password = $2", [login, password]),
        resultados => {
            if (resultados.length !== 1) return res.status(403).send("Credenciales incorrectas");
            const gestor = resultados[0];
            const token = jwt.sign({ id: gestor.id, usuario: gestor.usuario }, CLAVE_SECRETA, { expiresIn: '2h' });
            res.status(200).json({ token, id: gestor.id });
        });
});

app.post('/api/gestores', (req, res) => {
    const { usuario, password, nombre, apellidos } = req.body;
    responder(res, db.query("SELECT id FROM gestores WHERE usuario = $1", [usuario]), existentes => {
        if (existentes.length > 0) return res.status(403).send("El login ya existe");
        responder(res,
            db.query("INSERT INTO gestores (usuario, password, nombre, apellidos) VALUES ($1, $2, $3, $4) RETURNING id",
                     [usuario, password, nombre, apellidos]),
            filas => res.status(201).json(filas[0].id));
    });
});

app.put('/api/gestores/:id', verificarTokenJWT, (req, res) => {
    const { usuario, password, nombre, apellidos } = req.body;
    responder(res, db.query("SELECT id FROM gestores WHERE usuario = $1 AND id != $2", [usuario, req.params.id]), existentes => {
        if (existentes.length > 0) return res.status(403).send("El login ya existe");
        responder(res,
            db.query("UPDATE gestores SET usuario = $1, password = $2, nombre = $3, apellidos = $4 WHERE id = $5",
                     [usuario, password, nombre, apellidos, req.params.id]),
            () => res.status(200).json(parseInt(req.params.id)));
    });
});

app.get('/api/gestores/:id', verificarTokenJWT, (req, res) => {
    responder(res, db.query("SELECT id, usuario, nombre, apellidos FROM gestores WHERE id = $1", [req.params.id]), filas => {
        if (filas.length === 0) return res.status(404).send();
        res.status(200).json(filas[0]);
    });
});

// =====================
// API SANITARIOS
// =====================

app.get('/api/sanitarios/:id', verificarTokenJWT, (req, res) => {
    responder(res, db.query("SELECT id, usuario, nombre, apellidos FROM sanitarios WHERE id = $1", [req.params.id]), filas => {
        if (filas.length === 0) return res.status(404).send();
        res.status(200).json(filas[0]);
    });
});

// =====================
// API RECURSOS
// =====================

app.get('/api/recursos', verificarTokenJWT, (req, res) => {
    const condiciones = [];
    const params = [];
    const { modelo, ubicacion, estado, categoria } = req.query;

    if (modelo && modelo !== 'Todos')       { params.push(modelo);    condiciones.push(`modelo = $${params.length}`); }
    if (ubicacion && ubicacion !== 'Todos') { params.push(ubicacion); condiciones.push(`ubicacion = $${params.length}`); }
    if (estado && estado !== 'Todos')       { params.push(estado);    condiciones.push(`estado = $${params.length}`); }
    if (categoria && categoria !== 'Todos') {
        params.push(categoria);
        condiciones.push(`modelo IN (SELECT id FROM modelos WHERE categoria = $${params.length})`);
    }

    const where = condiciones.length ? ' WHERE ' + condiciones.join(' AND ') : '';
    responder(res, db.query("SELECT * FROM recursos" + where + " ORDER BY id", params), filas => res.status(200).json(filas));
});

app.get('/api/recursos/:id/reservas', verificarTokenJWT, (req, res) => {
    const sql = `
        SELECT r.id,
               r."recursoId",
               r.sanitario,
               r.h_estimadas AS h_estim,
               r.f_peticion,
               r.f_inicio,
               r.f_fin,
               r.estado,
               s.nombre   AS nombre_sanitario,
               s.apellidos AS apellidos_sanitario,
               c.nombre   AS categoria
        FROM reservas r
        LEFT JOIN sanitarios s ON s.id = r.sanitario
        LEFT JOIN recursos   rc ON rc.id = r."recursoId"
        LEFT JOIN modelos    m  ON m.id = rc.modelo
        LEFT JOIN categorias c  ON c.id = m.categoria
        WHERE r."recursoId" = $1
        ORDER BY r.id`;
    responder(res, db.query(sql, [req.params.id]), filas => res.status(200).json(filas));
});

app.get('/api/recursos/:id/resenyas', verificarTokenJWT, (req, res) => {
    responder(res, db.query('SELECT * FROM resenas WHERE "recursoId" = $1 ORDER BY id', [req.params.id]),
              filas => res.status(200).json(filas));
});

app.get('/api/recursos/:id', verificarTokenJWT, (req, res) => {
    responder(res, db.query("SELECT * FROM recursos WHERE id = $1", [req.params.id]), filas => {
        if (filas.length === 0) return res.status(404).send();
        res.status(200).json(filas[0]);
    });
});

app.post('/api/recursos', verificarTokenJWT, (req, res) => {
    const { numero_serie, modelo, ubicacion, estado } = req.body;
    responder(res,
        db.query("INSERT INTO recursos (numero_serie, modelo, ubicacion, estado) VALUES ($1, $2, $3, $4) RETURNING id",
                 [numero_serie, modelo, ubicacion, estado]),
        filas => res.status(201).json({ id: filas[0].id, numero_serie, modelo, ubicacion, estado }));
});

app.put('/api/recursos/:id', verificarTokenJWT, (req, res) => {
    const { numero_serie, modelo, ubicacion, estado } = req.body;
    responder(res,
        db.query("UPDATE recursos SET numero_serie = $1, modelo = $2, ubicacion = $3, estado = $4 WHERE id = $5",
                 [numero_serie, modelo, ubicacion, estado, req.params.id]),
        () => res.status(200).json({ id: parseInt(req.params.id), numero_serie, modelo, ubicacion, estado }));
});

app.delete('/api/recursos/:id', verificarTokenJWT, (req, res) => {
    responder(res, db.query("DELETE FROM recursos WHERE id = $1", [req.params.id]), () => res.status(204).send());
});

// =====================
// RUTAS AUXILIARES
// =====================

app.get('/api/categorias', verificarTokenJWT, (req, res) => {
    responder(res, db.query("SELECT * FROM categorias ORDER BY id"), filas => res.status(200).json(filas));
});

app.get('/api/modelos', verificarTokenJWT, (req, res) => {
    responder(res, db.query("SELECT * FROM modelos ORDER BY id"), filas => res.status(200).json(filas));
});

app.get('/api/ubicaciones', verificarTokenJWT, (req, res) => {
    responder(res, db.query("SELECT * FROM ubicaciones ORDER BY id"), filas => res.status(200).json(filas));
});

app.post('/api/reportes', verificarTokenJWT, (req, res) => {
    const { descripcion, gravedad, gestor, recurso } = req.body;
    responder(res,
        db.query("INSERT INTO reportes (fecha, descripcion, gravedad, gestor, recurso, estado) VALUES (NOW(), $1, $2, $3, $4, 0) RETURNING id",
                 [descripcion, gravedad, gestor, recurso]),
        filas => res.status(201).json(filas[0].id));
});

app.post('/api/area_salud', verificarTokenJWT, (req, res) => {
    const { nombre, codigopostal, gestor } = req.body;
    responder(res,
        db.query("INSERT INTO areasalud (cpostal, nombre, gestor, sanitario) VALUES ($1, $2, $3, 0) RETURNING cpostal",
                 [codigopostal, nombre, gestor]),
        filas => res.status(201).json(filas[0].cpostal));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor REST escuchando en el puerto ${PORT}`));