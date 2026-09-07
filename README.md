# Boletos de combi — Tepic → Batanga

App web para apartar o comprar en línea un lugar en la combi de la ruta
Tepic → Batanga, con paradas en poblados intermedios.

Proyecto hecho en JavaScript (frontend vanilla + backend en Node/Express
con MySQL), como parte de mi aprendizaje en el bootcamp de TripleTen, a
petición de un transportista real de la zona, con intención de llevarlo
a producción.

🔗 Demo del frontend: https://gitalffa.github.io/web_project_boletos_combi/
*(el backend todavía corre solo en local; el demo en línea no factura reservas reales hasta que se despliegue el backend — ver "Pendiente")*

## Estado del proyecto

✅ MVP funcional de principio a fin, con backend real, panel de
administración y panel de operadores (choferes) — en fase de pruebas.

## Arquitectura

```
App del cliente (index.html)     →  fetch                 →  API Express  →  MySQL
App de admin (admin.html)        →  fetch (token JWT admin)     ↗   backend/
App de operador (operador.html)  →  fetch (token JWT operador)  ↗
```

Todo el inventario de asientos y reservas vive en una base de datos MySQL
compartida, con una restricción `UNIQUE` que evita que dos personas
reserven el mismo asiento al mismo tiempo (ver `backend/db/schema.sql`).

## Funcionalidades del MVP

**App del cliente** (`index.html`)
- [x] Ver horarios de salida del día (con regla especial para domingo),
      calculados en el backend
- [x] Ocultar automáticamente los horarios que ya salieron hoy
- [x] Mapa visual de los 14 asientos reales de la combi, alineado a la
      distribución física real (CSS Grid)
- [x] Selección de hasta 4 asientos por compra
- [x] Formulario de datos del pasajero (nombre + teléfono), con validación
- [x] Elegir entre "apartar el lugar" (pago al abordar) o "pagar en línea"
      (tarjeta simulada, con validación de número, vencimiento y CVV)
- [x] Vencimiento automático de los apartados (30 min antes de la salida)
- [x] Revalidación de asientos si otro usuario se adelantó (error 409)
- [x] Comprobante con folio al terminar la compra
- [x] Descargar/imprimir el boleto (usando el diálogo nativo del navegador)
- [x] Consultar un boleto ya hecho por folio + últimos 4 dígitos del teléfono

**Backend**
- [x] Node/Express + MySQL, con protección contra doble-apartado a nivel
      de base de datos (transacciones + restricción UNIQUE)
- [x] Protección contra horarios duplicados (restricción UNIQUE en `hora`)

**Panel de administración** (`admin.html`)
- [x] Login con contraseña (hash con `bcrypt`) + sesión con token JWT
- [x] Menú de hamburguesa con las secciones y botón de cerrar sesión
- [x] Editar precio, capacidad del vehículo y minutos de expiración
- [x] Administrar horarios: crear, editar, desactivar/reactivar
      (borrado suave — nunca se borra un horario con reservas históricas)
- [x] Administrar paradas intermedias: crear, editar, borrar
- [x] Ver reservas de un día específico (horario, asiento, pasajero, teléfono)
- [x] Marcar un "apartado" como pagado en efectivo, sin que se libere
      al llegar su hora límite
- [x] Estadísticas por rango de fechas: apartados vigentes/vencidos,
      pagados en línea, pagados en efectivo (distinguiendo el origen
      real del pago aunque el admin lo marque después)
- [x] Administrar operadores (choferes): crear cuenta, asignarle uno o
      varios horarios, desactivar/reactivar, generar contraseña temporal
      de emergencia

**Panel de operador / chofer** (`operador.html`)
- [x] Login independiente, con su propio usuario y contraseña
- [x] Ve únicamente los pasajeros de su/sus propio(s) horario(s) del día
      de hoy — nunca los de otros choferes ni otros horarios (lo decide
      el token, no algo que el operador pueda elegir)
- [x] Si tiene varias salidas asignadas el mismo día, cada una se
      muestra agrupada por separado
- [x] Marcar un pasajero como pagado (efectivo al abordar)
- [x] Cambiar su propia contraseña — el admin ya NO puede fijarle una
      contraseña de uso diario, solo generar una temporal de emergencia
      que el operador está obligado a cambiar en su primer ingreso
- [x] Menú de hamburguesa con "Cambiar mi contraseña" y "Cerrar sesión"

**Seguridad y auditoría**
- [x] Cada pago marcado como recibido queda registrado con quién lo
      marcó (admin, o qué operador específico) y a qué hora — protege
      tanto al negocio como a cada chofer ante cualquier disputa
- [x] Un operador nunca puede marcar como pagada una reserva que no sea
      de su propio horario y del día de hoy (lo garantiza la consulta a
      la base de datos, no una simple validación del lado del cliente)

## Pendiente / mejoras futuras

- [ ] Desplegar el backend (VPS o similar) para que el demo en línea
      funcione con reservas reales, no solo en local
- [ ] Boletos por tramo (subir/bajar en paradas intermedias), no solo ruta completa
- [ ] Pasarela de pago real (Conekta/OpenPay/Stripe) en vez de la simulada
- [ ] Selector de fecha en la app del cliente (por ahora solo horarios de "hoy")
- [ ] Quitar `js/booking.js` y `data/viajes.json` del frontend (ya no se
      usan, la lógica vive ahora en el backend)
- [ ] Vulnerabilidad moderada conocida en `qs` (dependencia de Express 4.x):
      no explotable con nuestra configuración actual (requiere una opción
      que no usamos), pendiente de resolver con un parche oficial o al
      migrar a Express 5 más adelante — ver `npm audit`

## Cómo correrlo localmente

Necesitas **dos servidores corriendo al mismo tiempo**, en dos terminales
distintas:

**1. Backend (API + MySQL)**
```bash
cd backend
npm install
cp .env.example .env   # y llena tus datos reales ahí (MySQL, ADMIN_PASSWORD_HASH, JWT_SECRET)
npm run dev
```
Debe quedar corriendo en `http://localhost:3000`.

**2. Frontend**
Con la extensión **Live Server** de VS Code: clic derecho sobre
`index.html` (cliente), `admin.html` (administración) u `operador.html`
(chofer) → "Open with Live Server". Debe abrir en un puerto distinto
(normalmente `5500`) — es normal y necesario que sean puertos diferentes
al del backend.

**Base de datos**: antes de la primera vez, corre el esquema y las
migraciones, en este orden:
```bash
sudo mysql < backend/db/schema.sql
mysql -u combi_app -p boletos_combi < backend/db/seed_paradas.sql
mysql -u combi_app -p boletos_combi < backend/db/agregar_columna_activo.sql
mysql -u combi_app -p boletos_combi < backend/db/agregar_restriccion_hora_unica.sql
mysql -u combi_app -p boletos_combi < backend/db/agregar_columna_pagado_en_linea.sql
mysql -u combi_app -p boletos_combi < backend/db/agregar_tabla_operadores.sql
mysql -u combi_app -p boletos_combi < backend/db/agregar_auditoria_pago.sql
mysql -u combi_app -p boletos_combi < backend/db/agregar_operador_horarios.sql
mysql -u combi_app -p boletos_combi < backend/db/agregar_forzar_cambio_contrasena.sql
```

**Credenciales del admin**: genera tu contraseña y el secreto de sesión
con los scripts incluidos, y pégalos en tu `.env` (ver más abajo):
```bash
node backend/scripts/generar-hash-contrasena.js "TuContraseñaAquí"
node backend/scripts/generar-secreto-jwt.js
```

**Cuentas de operador**: se crean desde el panel de administración
(pestaña "Operadores"), no con un script — ahí mismo se les asigna uno o
varios horarios.

## Estructura del proyecto

```
web_project_boletos_combi/
├── index.html                 # app del cliente
├── admin.html                  # panel de administración
├── operador.html                # panel del chofer
├── README.md
├── .gitignore
├── css/
│   ├── styles.css               # estilos compartidos
│   └── admin.css                 # estilos de admin y operador (pestañas, menú hamburguesa, tablas)
├── data/
│   └── viajes.json        # OBSOLETO, ya no lo usa la app (ver Pendiente)
├── js/                      # ---------- FRONTEND ----------
│   ├── dataService.js       # capa de acceso a datos del cliente (fetch a la API)
│   ├── adminService.js       # capa de acceso a datos del panel de admin (fetch + token)
│   ├── operadorService.js     # capa de acceso a datos del panel de operador (fetch + token)
│   ├── booking.js              # OBSOLETO, la lógica ahora vive en el backend
│   ├── seatMap.js                # mapa de asientos y selección
│   ├── validation.js              # validación de formularios (pasajero y pago)
│   ├── index.js                    # arranque de la app del cliente
│   ├── admin.js                     # arranque del panel de admin
│   └── operador.js                   # arranque del panel de operador
└── backend/                  # ---------- BACKEND ----------
    ├── package.json
    ├── .env.example            # plantilla de variables de entorno (sin datos reales)
    ├── server.js                # arranque de Express y registro de rutas
    ├── scripts/
    │   ├── generar-hash-contrasena.js  # genera ADMIN_PASSWORD_HASH
    │   └── generar-secreto-jwt.js       # genera JWT_SECRET
    ├── middleware/
    │   ├── verificarAdmin.js       # protege las rutas /api/admin/*
    │   └── verificarOperador.js     # protege las rutas /api/operador/* (y graba horarioIds/operadorId del token)
    ├── db/
    │   ├── schema.sql                                # esquema base de la base de datos
    │   ├── seed_paradas.sql                           # datos iniciales de paradas intermedias
    │   ├── agregar_columna_activo.sql                  # migración: borrado suave de horarios
    │   ├── agregar_restriccion_hora_unica.sql           # migración: horarios sin duplicados
    │   ├── agregar_columna_pagado_en_linea.sql           # migración: origen real del pago
    │   ├── agregar_tabla_operadores.sql                   # migración: cuentas de choferes
    │   ├── agregar_auditoria_pago.sql                      # migración: quién marcó cada pago y cuándo
    │   ├── agregar_operador_horarios.sql                    # migración: un operador puede tener varios horarios
    │   ├── agregar_forzar_cambio_contrasena.sql              # migración: forzar cambio de contraseña temporal
    │   └── connection.js                                      # pool de conexiones a MySQL
    └── routes/
        ├── horarios.js              # GET  /api/horarios              (cliente)
        ├── asientos.js               # GET  /api/asientos              (cliente)
        ├── reservas.js                # POST /api/reservas (con transacción), GET /api/reservas/consultar (cliente)
        ├── configuracion.js            # GET  /api/configuracion        (cliente)
        ├── paradas.js                   # GET  /api/paradas             (cliente)
        ├── adminLogin.js                  # POST /api/admin/login
        ├── adminConfiguracion.js           # GET/PUT /api/admin/configuracion
        ├── adminHorarios.js                 # CRUD /api/admin/horarios (con borrado suave)
        ├── adminParadas.js                    # CRUD /api/admin/paradas
        ├── adminReservas.js                    # GET /api/admin/reservas, marcar-pagado
        ├── adminEstadisticas.js                  # GET /api/admin/estadisticas
        ├── adminOperadores.js                      # CRUD /api/admin/operadores (con varios horarios c/u)
        ├── operadorLogin.js                          # POST /api/operador/login
        ├── operadorReservas.js                         # GET /api/operador/reservas, marcar-pagado
        └── operadorCuenta.js                             # PUT /api/operador/cambiar-contrasena
```

## Notas técnicas

- **Base de datos**: MySQL, base `boletos_combi`, usuario dedicado
  `combi_app` (nunca se usa `root` desde la app). Esquema base en
  `backend/db/schema.sql`, migraciones posteriores en archivos aparte
  dentro de `backend/db/`.
- **Protección contra doble-apartado**: la tabla `reserva_asientos` tiene
  una restricción `UNIQUE (fecha, horario_id, numero_asiento)`. Combinada
  con una transacción en `POST /api/reservas`, la base de datos garantiza
  que dos personas nunca puedan quedarse con el mismo asiento, incluso si
  lo intentan en el mismo instante.
- **Borrado suave de horarios**: "borrar" un horario en realidad solo lo
  marca `activo = FALSE` — nunca se borra físicamente, para no romper la
  relación con reservas históricas. La restricción de hora única aplica
  también a horarios inactivos (si quieres "revivir" uno, se reactiva,
  no se vuelve a crear).
- **Origen real del pago**: la columna `pagado_en_linea` se define una
  sola vez al crear la reserva y nunca cambia — así, cuando el admin o
  un operador marca un "apartado" como pagado (efectivo), sigue siendo
  distinguible de alguien que pagó en línea desde el inicio.
- **Auditoría de pagos**: las columnas `marcado_pagado_por`,
  `marcado_pagado_operador_id` y `marcado_pagado_en` registran quién
  marcó cada pago (admin, o qué operador específico) y cuándo — protege
  tanto al negocio como a cada chofer ante cualquier disputa.
- **Operadores con varios horarios**: relación muchos a muchos vía la
  tabla `operador_horarios` (un operador puede tener asignada más de una
  salida el mismo día). El token del operador lleva grabado el arreglo
  de `horarioIds` asignados — el propio operador nunca elige ni envía
  qué horario quiere ver, así que no hay forma de que vea información de
  otro chofer.
- **Contraseñas de operador**: el admin nunca vuelve a conocer la
  contraseña real que un operador usa día a día. Cuando se crea una
  cuenta o se genera una "contraseña temporal" de emergencia, la columna
  `debe_cambiar_contrasena` obliga al operador a definir una propia en
  su primer ingreso, antes de dejarlo ver nada más.
- **Autenticación de admin y operador**: contraseñas guardadas como hash
  (`bcrypt`), nunca en texto plano. Las rutas `/api/admin/*` y
  `/api/operador/*` (excepto los `/login`) están protegidas por sus
  respectivos middlewares, que exigen un token JWT válido en el
  encabezado `Authorization: Bearer ...`. Los tokens viven en
  `sessionStorage` del navegador (no en `localStorage`), para que no
  persistan más allá de la sesión.
- **Consulta pública de boletos**: `GET /api/reservas/consultar` exige
  folio + últimos 4 dígitos del teléfono de algún pasajero de esa
  reserva — evita que alguien "adivine" un folio y vea datos ajenos.
- **Variables de entorno**: viven en `backend/.env`, que nunca se sube a
  Git (ver `backend/.gitignore`). `backend/.env.example` es la plantilla
  sin datos reales. Incluye credenciales de MySQL, `ADMIN_PASSWORD_HASH`
  y `JWT_SECRET`.
- **CORS**: el backend acepta peticiones desde cualquier origen por ahora
  (desarrollo local). Antes de producción hay que restringirlo solo al
  dominio real del frontend.
- **Cache busting manual** (frontend): todos los `<link>`, `<script>` e
  `import` entre módulos llevan un parámetro `?v=1` al final. Cuando subas
  un cambio que quieras que se vea reflejado de inmediato para los
  usuarios, sube ese número en TODOS los archivos donde aparezca.

## Autor

Fabricio Galindo Copado — [LinkedIn](https://www.linkedin.com/in/fabricio-galindo-copado/)
