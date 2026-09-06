USE boletos_combi;

-- Cada operador (chofer) tiene su propia cuenta, y queda asignado a
-- UN horario específico. Esa asignación la decide el admin, nunca el
-- operador mismo.
CREATE TABLE operadores (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100) NOT NULL,
  usuario           VARCHAR(50) NOT NULL UNIQUE,
  contrasena_hash   VARCHAR(255) NOT NULL,
  horario_id        INT NOT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,

  FOREIGN KEY (horario_id) REFERENCES horarios(id)
);