-- =============================================================
-- Esquema de base de datos: Boletos de combi Tepic -> Batanga
-- -----------------------------------------------------------------
-- Reemplaza a data/viajes.json + localStorage del MVP en frontend.
-- Ahora el inventario de asientos vive en un solo lugar compartido
-- por todos los usuarios, no en el navegador de cada quien.
-- =============================================================

CREATE DATABASE IF NOT EXISTS boletos_combi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE boletos_combi;

-- -----------------------------------------------------------------
-- configuracion: valores únicos del negocio (precio, capacidad,
-- minutos de expiración). Guardarlos aquí en vez de "quemados" en el
-- código permite que el transportista los cambie sin tocar nada más.
-- -----------------------------------------------------------------
CREATE TABLE configuracion (
  clave  VARCHAR(50)  NOT NULL PRIMARY KEY,
  valor  VARCHAR(255) NOT NULL
);

INSERT INTO configuracion (clave, valor) VALUES
  ('precio_ruta_completa', '160'),
  ('capacidad_vehiculo', '14'),
  ('minutos_limite_apartado', '30');

-- -----------------------------------------------------------------
-- paradas: solo informativas por ahora (fase de ruta completa).
-- "orden" define en qué secuencia se muestran, de Tepic a Batanga.
-- -----------------------------------------------------------------
CREATE TABLE paradas (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  orden   TINYINT UNSIGNED NOT NULL,
  nombre  VARCHAR(100) NOT NULL
);

-- -----------------------------------------------------------------
-- horarios: las salidas posibles de la combi. "aplica_domingo"
-- reemplaza las dos listas separadas que teníamos en el JSON
-- (lunesASabado / domingo): un horario que NO aplica el domingo es,
-- justamente, el de las 10:30.
-- -----------------------------------------------------------------
CREATE TABLE horarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  hora            TIME NOT NULL,
  aplica_domingo  BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO horarios (hora, aplica_domingo) VALUES
  ('06:00:00', TRUE),
  ('08:00:00', TRUE),
  ('10:30:00', FALSE),  -- el único que no sale los domingos
  ('12:00:00', TRUE),
  ('15:00:00', TRUE),
  ('17:00:00', TRUE);

-- -----------------------------------------------------------------
-- reservas: una fila por cada "transacción" de compra (puede cubrir
-- varios asientos a la vez, ver reserva_asientos). "folio" es lo que
-- el pasajero muestra al abordar o al pagar.
-- -----------------------------------------------------------------
CREATE TABLE reservas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  folio       VARCHAR(20) NOT NULL UNIQUE,
  fecha       DATE NOT NULL,
  horario_id  INT NOT NULL,
  modalidad   ENUM('apartado', 'confirmado') NOT NULL,
  creada_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vence_en    DATETIME NULL,  -- NULL cuando modalidad = 'confirmado' (no vence)

  FOREIGN KEY (horario_id) REFERENCES horarios(id)
);

-- -----------------------------------------------------------------
-- reserva_asientos: un renglón por CADA asiento dentro de una
-- reserva. Repetimos "fecha" y "horario_id" (que ya están en
-- "reservas") a propósito: es lo que nos permite poner la
-- restricción UNIQUE de abajo, que es la pieza más importante de
-- todo el esquema.
-- -----------------------------------------------------------------
CREATE TABLE reserva_asientos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id          INT NOT NULL,
  fecha               DATE NOT NULL,
  horario_id          INT NOT NULL,
  numero_asiento      TINYINT UNSIGNED NOT NULL,
  nombre_pasajero     VARCHAR(100) NOT NULL,
  telefono_pasajero   VARCHAR(10) NOT NULL,

  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
  FOREIGN KEY (horario_id) REFERENCES horarios(id),

  -- LA RESTRICCIÓN CLAVE: la base de datos rechaza automáticamente
  -- un segundo intento de guardar el mismo asiento, en la misma
  -- fecha y horario. Esto es lo que localStorage nunca pudo
  -- garantizar, porque cada navegador vivía en su propio mundo.
  UNIQUE KEY asiento_unico_por_viaje (fecha, horario_id, numero_asiento)
);