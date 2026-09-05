USE boletos_combi;

-- Se define UNA SOLA VEZ al crear la reserva y nunca vuelve a cambiar,
-- ni siquiera cuando el admin marca un apartado como pagado en efectivo.
ALTER TABLE reservas ADD COLUMN pagado_en_linea BOOLEAN NOT NULL DEFAULT FALSE;