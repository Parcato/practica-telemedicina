// Conexión a PostgreSQL (Supabase). La cadena viene de la variable de entorno DATABASE_URL.
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.error('Falta la variable de entorno DATABASE_URL');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase exige SSL; el certificado es de su CA, por eso no se valida la cadena.
    ssl: { rejectUnauthorized: false },
    max: 5
});

pool.query('SELECT 1')
    .then(() => console.log('Conexión a la base de datos establecida'))
    .catch(err => console.error('Error en la conexión a la base de datos:', err.message));

// Igual que en MySQL, pero con parámetros posicionales $1, $2...
// Devuelve las filas directamente.
module.exports = {
    query: (sql, params) => pool.query(sql, params).then(r => r.rows),
    pool
};
