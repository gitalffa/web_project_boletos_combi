USE boletos_combi;

-- Un operador ahora puede tener VARIOS horarios asignados (relación
-- muchos a muchos), no solo uno fijo como al principio.
CREATE TABLE operador_horarios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  operador_id  INT NOT NULL,
  horario_id   INT NOT NULL,
  FOREIGN KEY (operador_id) REFERENCES operadores(id) ON DELETE CASCADE,
  FOREIGN KEY (horario_id) REFERENCES horarios(id),
  UNIQUE KEY operador_horario_unico (operador_id, horario_id)
);

-- Migramos las asignaciones que ya existían (un horario por operador)
-- a la nueva tabla, para no perder lo que ya habías configurado.
INSERT INTO operador_horarios (operador_id, horario_id)
SELECT id, horario_id FROM operadores WHERE horario_id IS NOT NULL;

-- La columna vieja ya no se usa. La dejamos permitir NULL en vez de
-- borrarla, para no complicarnos con el nombre interno de su llave
-- foránea (no hace daño dejarla ahí, simplemente ya no se lee ni se
-- escribe desde el código).
ALTER TABLE operadores MODIFY horario_id INT NULL;
