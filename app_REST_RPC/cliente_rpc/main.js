var app = rpc("localhost", "gestion_recursos");

var loginSanitario    = app.procedure("loginSanitario");
var obtenerSanitario  = app.procedure("obtenerSanitario");
var crearSanitario    = app.procedure("crearSanitario");
var obtenerCategorias = app.procedure("obtenerCategorias");
var obtenerModelos    = app.procedure("obtenerModelos");
var obtenerRecursos   = app.procedure("obtenerRecursos");
var obtenerRecurso    = app.procedure("obtenerRecurso");
var obtenerReservas   = app.procedure("obtenerReservas");
var tiempoPendiente   = app.procedure("tiempoPendiente");
var obtenerResenyas   = app.procedure("obtenerResenyas");
var reservarRecurso   = app.procedure("reservarRecurso");
var iniciarReserva    = app.procedure("iniciarReserva");
var finalizarReserva  = app.procedure("finalizarReserva");
var cancelarReserva   = app.procedure("cancelarReserva");
var crearResenya      = app.procedure("crearResenya");
var rpcRetirarRecurso = app.procedure("retirarRecurso");
var marcarurgente     = app.procedure("marcarurgente");
//Para practicar
var asignarArea = app.procedure("asignarArea");
//Para practicar
var idSanitarioLogueado = null;
var idRecursoParaResenya = null;

function mostrarAviso(aviso) {
    var tbody = document.getElementById("tabla-avisos");
    if (!tbody) return;
    var fila = document.createElement("tr");
    fila.style.backgroundColor = aviso.color || "#ffffff";
    fila.innerHTML = "<td>" + aviso.fecha + "</td><td>" + aviso.origen + "</td><td>" + aviso.texto + "</td>";
    tbody.insertBefore(fila, tbody.firstChild);
}

function ejecutarmarcarugente(idReserva) {
    marcarurgente(idReserva, function(resultado) {
        if (resultado) cargarTablasInicio();
    });
}

function mostrar(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function retirarRecursop(idReserva) {
    rpcRetirarRecurso(idReserva, function(resultado) {
        if (resultado) cargarTablasInicio();
        else alert("No se pudo retirar el recurso");
    });
}

function login() {
    var u = document.getElementById("usuario").value;
    var p = document.getElementById("password").value;
    loginSanitario(u, p, function(id) {
        if (!id) return alert("Error de acceso");
        idSanitarioLogueado = id;
        obtenerSanitario(id, function(s) {
            var nombre = s.nombre + " " + s.apellidos;
            document.getElementById("nombre-gestor").innerText = nombre;
            wsCliente.conectar("sanitario", id, nombre, mostrarAviso);
            cargarTablasInicio();
            mostrar("vista-inicio");
        });
    });
}

//Para practicar
function ejecutarEliminarReportes() {
    var idsanitario = idSanitarioLogueado;
    var idarea = document.getElementById("codigopostal").value;
    asignarArea(idsanitario,idarea, function(total) {
        alert("Se han asignado " + total + " areas");
        cargarTablasInicio();
    });
}
//Para practicar

function salir() {
    wsCliente.desconectar();
    location.reload();
}

function cargarTablasInicio() {
    obtenerReservas(idSanitarioLogueado, function(reservas) {
        obtenerCategorias(function(categorias) {
            obtenerModelos(function(modelos) { // <-- Añadimos esto para cruzar los datos
                var tPendientes = document.getElementById("tabla-pendientes");
                var tRealizadas = document.getElementById("tabla-realizadas");
                tPendientes.innerHTML = ""; tRealizadas.innerHTML = "";

                reservas.forEach(function(res) {
                    obtenerRecurso(res.recursoId, function(rec) {
                        tiempoPendiente(res.recursoId, function(hRest) {
                            
                            // 1. Buscamos el modelo al que pertenece el recurso
                            var modEncontrado = modelos.find(function(m) { return m.id == rec.modelo; });
                            
                            // 2. Buscamos la categoría a la que pertenece ese modelo
                            var catEncontrada = null;
                            if (modEncontrado) {
                                catEncontrada = categorias.find(function(c) { return c.id == modEncontrado.categoria; });
                            }
                            
                            var nombreCategoria = catEncontrada ? catEncontrada.nombre : "---";

                            var fila = document.createElement("tr");

                            if (res.estado === 1) {
                                fila.innerHTML =
                                    "<td>" + nombreCategoria + "</td>" +
                                    "<td>" + rec.modelo + "</td>" +
                                    "<td>" + rec.numero_serie + "</td>" +
                                    "<td>" + rec.ubicacion + "</td>" +
                                    "<td>" + new Date(res.f_peticion).toLocaleString() + "</td>" +
                                    "<td>" + hRest + "</td>" +
                                    "<td><button onclick='ejecutarCancelar(" + res.id + ")'>X</button></td>" +
                                    "<td><button onclick='ejecutarRetirar(" + res.id + ")'>Retirar</button></td>" +
                                    "<td><button onclick='ejecutarmarcarugente(" + res.id + ")'>!</button></td>"+
                                    "<td><button onclick='avisar(" + res.recursoId + ")'>Avisar</button></td>" +
                                    "<td><button onclick='avisargestores(" + res.recursoId + ")'>Avisar a Gestor</button></td>";

                                tPendientes.appendChild(fila);

                            } else if (res.estado === 2) {
                                fila.innerHTML =
                                    "<td>" + nombreCategoria + "</td>" +
                                    "<td>" + rec.modelo + "</td>" +
                                    "<td>" + rec.numero_serie + "</td>" +
                                    "<td>" + res.h_estim + "</td>" +
                                    "<td>" + new Date(res.f_inicio).toLocaleString() + "</td>" +
                                    "<td><button onclick='ejecutarDevolver(" + res.id + ")'>Devolver</button></td>" +
                                    "<td></td><td></td>";
                                tRealizadas.appendChild(fila);

                            } else if (res.estado === 3) {
                                fila.innerHTML =
                                    "<td>" + nombreCategoria + "</td>" +
                                    "<td>" + rec.modelo + "</td>" +
                                    "<td>" + rec.numero_serie + "</td>" +
                                    "<td>" + res.h_estim + "</td>" +
                                    "<td>" + new Date(res.f_inicio).toLocaleString() + "</td>" +
                                    "<td>" + new Date(res.f_fin).toLocaleString() + "</td>" +
                                    "<td><button onclick='prepararResenya(" + res.recursoId + ")'>Reseña</button></td>" +
                                    "<td><button onclick='ejecutarEliminarReportes(" + res.recursoId + ")'>Eliminar reportes</button></td>";
                                
                                tRealizadas.appendChild(fila);
                            }
                        });
                    });
                });
            });
        });
    });
}
function avisargestores(idRecurso) {
    obtenerRecurso(idRecurso, function(rec) {
        var texto = "SE HA PRODUCIDO UN AVISO PARA EL RECURSO " + rec.numero_serie + " (MODELO " + rec.modelo + ")";
        wsCliente.enviarAviso("avisogestores", texto, "#ffcccc", []);
    });
}

function nuevaReserva() {
    obtenerCategorias(function(cats) {
        var sel = document.getElementById("f-cat-ficha");
        sel.innerHTML = '<option value="">Seleccione...</option>';
        cats.forEach(function(c) {
            sel.innerHTML += "<option value='" + c.id + "'>" + c.nombre + "</option>";
        });
        mostrar("vista-reserva");
    });
}
function avisar(idReserva){
    obtenerRecurso(idReserva, function(rec) {
        var texto = "SE HA PRODUCIDO UN AVISO PARA EL RECURSO " + rec.numero_serie + " (MODELO " + rec.modelo + ")";
        wsCliente.enviarAviso("aviso", texto, "#ffcccc", [idSanitarioLogueado]);
    });
   
}

function actualizarModelos() {
    var idCat = document.getElementById("f-cat-ficha").value;
    obtenerModelos(function(mods) {
        var sel = document.getElementById("f-mod-ficha");
        sel.innerHTML = '<option value="">Seleccione...</option>';
        mods.filter(function(m) { return m.categoria == idCat; }).forEach(function(m) {
            sel.innerHTML += "<option value='" + m.id + "'>" + m.nombre + "</option>";
        });
    });
}

function listarRecursosDisponibles() {
    var idMod = document.getElementById("f-mod-ficha").value;
    var cuerpo = document.getElementById("cuerpo-seleccion-recurso");
    cuerpo.innerHTML = "";
    obtenerRecursos(idMod, function(recursos) {
        recursos.forEach(function(rec) {
            tiempoPendiente(rec.id, function(hRest) {
                obtenerResenyas(rec.id, function(resenyas) {
                    var media = resenyas.length > 0
                        ? (resenyas.reduce(function(a, b) { return a + parseInt(b.valoracion); }, 0) / resenyas.length).toFixed(1)
                        : "---";
                    var esLibre = (hRest === 0);
                    var fila = document.createElement("tr");
                    fila.innerHTML =
                        "<td>" + rec.numero_serie + "</td>" +
                        "<td>" + rec.ubicacion + "</td>" +
                        "<td>" + (esLibre ? "Disponible" : hRest) + "</td>" +
                        "<td>" + media + "</td>" +
                        "<td><button onclick='confirmarReserva(" + rec.id + ")'>" + (esLibre ? "Retirar" : "Reservar") + "</button></td>";
                    cuerpo.appendChild(fila);
                });
            });
        });
    });
}

function confirmarReserva(idRec) {
    var h = document.getElementById("f-tiempo").value;
    reservarRecurso(idRec, idSanitarioLogueado, parseInt(h), function() {
        obtenerRecurso(idRec, function(rec) {
            var texto = "SE HA REALIZADO UNA RESERVA PARA EL RECURSO " + rec.numero_serie + " (MODELO " + rec.modelo + ") DURANTE " + h + " HORAS";
            wsCliente.enviarAviso("reservaconfirmada", texto, "#ccffda", []);
        cargarTablasInicio();
        mostrar("vista-inicio");
        });
        
    });
}

function ejecutarRetirar(idReserva) {
    iniciarReserva(idReserva, function(ok) {
        if (!ok) return;
        obtenerReservas(idSanitarioLogueado, function(reservas) {
            var res = null;
            for (var i = 0; i < reservas.length; i++) {
                if (reservas[i].id == idReserva) { res = reservas[i]; break; }
            }
            if (!res) { cargarTablasInicio(); return; }
            obtenerRecurso(res.recursoId, function(rec) {
                var texto = "SE HA INICIADO LA RESERVA DEL RECURSO " + rec.numero_serie + " (MODELO " + rec.modelo + ")";
                wsCliente.enviarAviso("reserva", texto, "#ffcccc", []);
                cargarTablasInicio();
            });
        });
    });
}

function ejecutarDevolver(idReserva) {
    finalizarReserva(idReserva, function(ok) {
        if (!ok) return;
        obtenerReservas(idSanitarioLogueado, function(reservas) {
            var res = null;
            for (var i = 0; i < reservas.length; i++) {
                if (reservas[i].id == idReserva) { res = reservas[i]; break; }
            }
            if (!res) { cargarTablasInicio(); return; }
            obtenerRecurso(res.recursoId, function(rec) {
                var texto = "SE HA FINALIZADO LA RESERVA DEL RECURSO " + rec.numero_serie + " (MODELO " + rec.modelo + ")";
                wsCliente.enviarAviso("reserva", texto, "#ffcccc", []);
                cargarTablasInicio();
            });
        });
    });
}

function ejecutarCancelar(id) {
    if (confirm("¿Cancelar?")) cancelarReserva(id, function() { cargarTablasInicio(); });
}

function prepararResenya(idRec) {
    idRecursoParaResenya = idRec;
    obtenerRecurso(idRec, function(r) {
        document.getElementById("resenya-nserie").innerText = r.numero_serie;
        document.getElementById("f-comentario").value = "";
        mostrar("vista-nueva-resenya");
    });
}

function enviarResenya() {
    var v = document.getElementById("f-valoracion").value;
    var t = document.getElementById("f-comentario").value;
    crearResenya(idRecursoParaResenya, idSanitarioLogueado, v, t, function(id) {
        if (!id) return alert("Error al guardar reseña");
        obtenerRecurso(idRecursoParaResenya, function(rec) {
            var texto = "SE HA CREADO UNA RESEÑA PARA EL RECURSO " + rec.numero_serie + " (MODELO " + rec.modelo + ") CON PUNTUACIÓN " + v;
            wsCliente.enviarAviso("resenya", texto, "#ccffcc", []);
            alert("Reseña guardada");
            mostrar("vista-inicio");
        });
    });
}

function registrarSanitario() {
    var datos = {
        usuario:   document.getElementById("usuario-registro").value,
        password:  document.getElementById("password-registro").value,
        nombre:    document.getElementById("nombre-registro").value,
        apellidos: document.getElementById("apellidos-registro").value
        
    };
    
    crearSanitario(datos, function(id) {
        if (!id) return alert("Error al registrar");
        wsCliente.conectar("sanitario", id, datos.nombre + " " + datos.apellidos, function(){});
       setTimeout(function() {
            var texto = "SE HA REGISTRADO EL SANITARIO " + datos.nombre + " " + datos.apellidos;
            wsCliente.enviarAviso("registrosanitario", texto, "#ccffcc", []);
        }, 1000);
        mostrar("vista-login");
    });
}