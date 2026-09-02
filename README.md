# Boletos de combi — Tepic → Batanga

App web para apartar o comprar en línea un lugar en la combi de la ruta
Tepic → Batanga, con paradas en poblados intermedios.

Proyecto en desarrollo, hecho en JavaScript puro (sin frameworks), como
parte de mi aprendizaje en el bootcamp de TripleTen, a petición de un
transportista real de la zona.

## Estado del proyecto

🚧 En construcción — MVP en progreso.

## Funcionalidades del MVP

- [x] Ver horarios de salida del día (con regla especial para domingo)
- [x] Mapa visual de los 14 asientos reales de la combi
- [x] Selección de hasta 4 asientos por compra
- [ ] Formulario de datos del pasajero, con validación
- [ ] Elegir entre "apartar el lugar" (pago al abordar) o "pagar en línea" (simulado)
- [ ] Vencimiento automático de los apartados (30 min antes de la salida)
- [ ] Comprobante/folio de la reserva

## Cómo correrlo localmente

Este proyecto usa módulos de JavaScript (`import`/`export`) y `fetch`
para cargar los datos del viaje, por lo que **no funciona abriendo
`index.html` con doble clic**. Necesitas servirlo con un servidor local:

- Con la extensión **Live Server** de VS Code: clic derecho sobre
  `index.html` → "Open with Live Server".
- O con Node.js instalado: `npx serve` dentro de la carpeta del proyecto.

## Estructura del proyecto

```
web_project_boletos_combi/
├── index.html
├── css/
│   └── styles.css
├── data/
│   └── viajes.json        # ruta, precio, horarios, capacidad
└── js/
    ├── dataService.js     # capa de acceso a datos (fetch + localStorage)
    ├── booking.js          # lógica de negocio (estados, expiración, folios)
    ├── seatMap.js           # mapa de asientos y selección
    └── index.js             # arranque de la app y navegación entre pantallas
```

## Notas técnicas

- Los datos del viaje (ruta, horarios, precio) viven en `data/viajes.json`.
- Las reservas (apartados y pagos) se guardan en `localStorage` del
  navegador — es una limitación temporal del MVP: no hay un servidor
  central compartido entre usuarios todavía.
- El código está organizado para que, en una fase futura, `dataService.js`
  pueda reemplazar `fetch`/`localStorage` por peticiones a una API real
  (backend en PHP + MySQL) sin tener que reescribir el resto de la app.

## Autor

Fabricio Galindo Copado — [LinkedIn](https://www.linkedin.com/in/fabricio-galindo-copado/)
