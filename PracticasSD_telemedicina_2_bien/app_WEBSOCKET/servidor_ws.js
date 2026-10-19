const { WebSocketServer } = require("ws");

var clientes = [];

function crearServidorWS(puerto) {
    puerto = puerto || 3502;
    var wss = new WebSocketServer({ port: puerto });

    wss.on("connection", function (ws) {
        var cliente = { ws: ws, rol: null, id: null, nombre: null };
        clientes.push(cliente);

        ws.on("message", function (data) {
            var msg;
            try { msg = JSON.parse(data); } catch (e) { return; }

            if (msg.tipo === "login") {
                cliente.rol    = msg.rol;
                cliente.id     = msg.id;
                cliente.nombre = msg.nombre;
            }

            if (msg.tipo === "aviso") {
                var aviso = {
                    fecha:  new Date().toLocaleString(),
                    origen: cliente.nombre || "Desconocido",
                    texto:  msg.texto,
                    color:  msg.color
                };

                if (msg.subtipo === "reserva") {
                    clientes.forEach(function (c) {
                        if (c.rol === "sanitario" && 
                            c.id !== cliente.id && 
                            c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });

                } else if (msg.subtipo === "recurso") {
                    clientes.forEach(function (c) {
                        if (c.rol === "sanitario" && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                /*
                } else if (msg.subtipo === "ejemplo") {
                    clientes.forEach(function (c) {
                        // Corregido: "sanitario" (antes "saniatario")
                        if (c.rol === "sanitario" && c.ws.readyState === 1) Avisa a los sanitarios
                        if (c.rol === "gestor" && c.ws.readyState === 1) Avisa a los gestores
                        if(c.id !== cliente.id && c.ws.readyState === 1) Avisa a todos excepto al que envía el mensaje
                        if((c.id == msg.afectados[0 o 1] depende de lo puesto en enviar aviso lo puesto && c.ws.readyState === 1) Avisa solo a los afectados
                        {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                */
                 }else if (msg.subtipo === "eliminarrecurso") {
                    clientes.forEach(function (c) {
                        if (c.rol === "sanitario" && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                 }else if (msg.subtipo === "avisogestores") {
                    clientes.forEach(function (c) {
                        if (c.rol === "gestor" && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                 }else if (msg.subtipo === "notificar") {
                    clientes.forEach(function (c) {
                        if (c.rol === "sanitario" && c.id == msg.afectados[0] && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                }else if (msg.subtipo === "aviso") {
                    clientes.forEach(function (c) {
                        if (msg.afectados.indexOf(c.id) !== -1 && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                }else if (msg.subtipo === "bajarecurso") {
                    clientes.forEach(function (c) {
                        if (c.rol === "sanitario" && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                }else if (msg.subtipo === "reservaconfirmada") {
                    clientes.forEach(function (c) {
                        if (c.rol === "gestor" && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                } else if (msg.subtipo === "notificar") {
                    clientes.forEach(function (c) {
                        if (c.afectados.indexOf(msg.id) !== -1 && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                } else if (msg.subtipo === "registrosanitario") {
                    clientes.forEach(function (c) {
                        if (c.rol === "gestor" && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                } else if (msg.subtipo === "resenya") {
                    clientes.forEach(function (c) {
                        if (c.rol === "gestor" && c.ws.readyState === 1) {
                            c.ws.send(JSON.stringify(aviso));
                        }
                    });
                }
            } // <--- ESTA era la llave que te faltaba para cerrar el "if (msg.tipo === 'aviso')"
        });
           
        ws.on("close", function () {
            var i = clientes.indexOf(cliente);
            if (i !== -1) clientes.splice(i, 1);
        });
        
    });

    console.log("Servidor WebSocket escuchando en puerto " + puerto);
}

module.exports = { crearServidorWS: crearServidorWS };