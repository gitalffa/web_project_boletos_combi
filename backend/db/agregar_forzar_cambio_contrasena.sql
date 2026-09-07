USE boletos_combi;

-- Cuando es TRUE, el operador debe cambiar su contraseña antes de
-- poder ver sus reservas. Se activa cada vez que el admin genera una
-- contraseña (nueva cuenta, o "contraseña temporal" de emergencia).
ALTER TABLE operadores ADD COLUMN debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT TRUE;
