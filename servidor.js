require("./app_REST/servidor.js")
require("./app_REST_RPC/servidor_rpc.js")


var ws = require("./app_WEBSOCKET/servidor_ws.js");
ws.crearServidorWS(3502);
var express = require("express");
var appStatic = express();
appStatic.use(express.static('./app_REST_RPC/cliente_rpc'));
appStatic.listen(3503, function() {
    console.log("Servidor estático sanitario en http://localhost:3503");
});