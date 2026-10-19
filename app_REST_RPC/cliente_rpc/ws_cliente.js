(function () {

    var socket = null;

    var wsCliente = {

        conectar: function (rol, id, nombre, onAviso) {
            socket = new WebSocket("ws://localhost:3502");

            socket.onopen = function () {
                socket.send(JSON.stringify({
                    tipo:   "login",
                    rol:    rol,
                    id:     id,
                    nombre: nombre
                }));
            };

            socket.onmessage = function (event) {
                var aviso = JSON.parse(event.data);
                if (typeof onAviso === "function") onAviso(aviso);
            };

            socket.onerror = function (e) {
                console.error("WS error:", e);
            };
        },

        desconectar: function () {
            if (socket) { socket.close(); socket = null; }
        },

        enviarAviso: function (subtipo, texto, color, afectados) {
            if (!socket || socket.readyState !== WebSocket.OPEN) return;
            socket.send(JSON.stringify({
                tipo:      "aviso",
                subtipo:   subtipo,
                texto:     texto,
                color:     color,
                afectados: afectados || []
            }));
        }
    };

    window.wsCliente = wsCliente;

})();