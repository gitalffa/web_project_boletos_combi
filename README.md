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

✅ MVP funcional de principio a fin, con backend real — en fase de pruebas.

## Arquitectura

```
Frontend (navegador)  →  fetch  →  API Express  →  MySQL
      js/                        backend/
```

El frontend ya NO usa `localStorage` ni el JSON estático para datos de
reservas — todo el inventario de asientos vive en una base de datos
MySQL compartida por todos los usuarios, con una restricción `UNIQUE`
que evita que dos personas reserven el mismo asiento al mismo tiempo
(ver `backend/db/schema.sql`).

## Funcionalidades del MVP

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
- [x] Backend real en Node/Express + MySQL, con protección contra
      doble-apartado a nivel de base de datos (transacciones + restricción UNIQUE)
- [x] Revalidación de asientos si otro usuario se adelantó (error 409)
- [x] Comprobante con folio al terminar la compra
- [x] Reiniciar el flujo para reservar otro boleto

## Pendiente / mejoras futuras

- [ ] Desplegar el backend (VPS o similar) para que el demo en línea
      funcione con reservas reales, no solo en local
- [ ] Boletos por tramo (subir/bajar en paradas intermedias), no solo ruta completa
- [ ] Pasarela de pago real (Conekta/OpenPay/Stripe) en vez de la simulada
- [ ] Selector de fecha (por ahora la app solo muestra los horarios de "hoy")
- [ ] Panel para que el transportista administre horarios y precios
- [ ] Quitar `js/booking.js` y `data/viajes.json` del frontend (ya no se
      usan, la lógica vive ahora en el backend)

## Cómo correrlo localmente

Necesitas **dos servidores corriendo al mismo tiempo**, en dos terminales
distintas:

**1. Backend (API + MySQL)**
```bash
cd backend
npm install
cp .env.example .env   # y llena tu contraseña real de MySQL ahí
npm run dev
```
Debe quedar corriendo en `http://localhost:3000`.

**2. Frontend**
Con la extensión **Live Server** de VS Code: clic derecho sobre
`index.html` → "Open with Live Server". Debe abrir en un puerto distinto
(normalmente `5500`) — es normal y necesario que sean puertos diferentes.

**Base de datos**: antes de la primera vez, corre el esquema:
```bash
sudo mysql < backend/db/schema.sql
mysql -u combi_app -p boletos_combi < backend/db/seed_paradas.sql
```

## Estructura del proyecto

```
web_project_boletos_combi/
├── index.html
├── README.md
├── .gitignore
├── css/
│   └── styles.css
├── data/
│   └── viajes.json        # OBSOLETO, ya no lo usa la app (ver Pendiente)
├── js/                      # ---------- FRONTEND ----------
│   ├── dataService.js       # capa de acceso a datos (fetch a la API real)
│   ├── booking.js            # OBSOLETO, la lógica ahora vive en el backend
│   ├── seatMap.js             # mapa de asientos y selección
│   ├── validation.js          # validación de formularios (pasajero y pago)
│   └── index.js                # arranque de la app y navegación entre pantallas
└── backend/                  # ---------- BACKEND ----------
    ├── package.json
    ├── .env.example            # plantilla de variables de entorno (sin datos reales)
    ├── server.js                # arranque de Express y registro de rutas
    ├── db/
    │   ├── schema.sql             # esquema de la base de datos
    │   ├── seed_paradas.sql       # datos iniciales de paradas intermedias
    │   └── connection.js           # pool de conexiones a MySQL
    └── routes/
        ├── horarios.js             # GET  /api/horarios
        ├── asientos.js              # GET  /api/asientos
        ├── reservas.js               # POST /api/reservas (con transacción)
        ├── configuracion.js           # GET  /api/configuracion
        └── paradas.js                  # GET  /api/paradas
```

## Notas técnicas

- **Base de datos**: MySQL, base `boletos_combi`, usuario dedicado
  `combi_app` (nunca se usa `root` desde la app). Esquema completo en
  `backend/db/schema.sql`.
- **Protección contra doble-apartado**: la tabla `reserva_asientos` tiene
  una restricción `UNIQUE (fecha, horario_id, numero_asiento)`. Combinada
  con una transacción en `POST /api/reservas`, la base de datos garantiza
  que dos personas nunca puedan quedarse con el mismo asiento, incluso si
  lo intentan en el mismo instante.
- **Variables de entorno**: las credenciales de MySQL viven en
  `backend/.env`, que nunca se sube a Git (ver `backend/.gitignore`).
  `backend/.env.example` es la plantilla sin datos reales.
- **CORS**: el backend acepta peticiones desde cualquier origen por ahora
  (desarrollo local). Antes de producción hay que restringirlo solo al
  dominio real del frontend.
- **Cache busting manual** (frontend): todos los `<link>`, `<script>` e
  `import` entre módulos llevan un parámetro `?v=1` al final. Cuando subas
  un cambio que quieras que se vea reflejado de inmediato para los
  usuarios, sube ese número en TODOS los archivos donde aparezca.

## Autor

Fabricio Galindo Copado — [LinkedIn](https://www.linkedin.com/in/fabricio-galindo-copado/)
