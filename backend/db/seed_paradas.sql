-- Inserta las 16 paradas intermedias, en el mismo orden que ya
-- habíamos confirmado (de Tepic hacia Batanga).

USE boletos_combi;

INSERT INTO paradas (orden, nombre) VALUES
  (1,  'Pichón'),
  (2,  'Trapichillo'),
  (3,  'Resolana'),
  (4,  'Jumatan'),
  (5,  'Limón'),
  (6,  'Jicote'),
  (7,  'Tírate'),
  (8,  'Papalote'),
  (9,  'Santiago'),
  (10, 'Amapa'),
  (11, 'Cerritos'),
  (12, 'P. Nuevo'),
  (13, 'Gav. Grande'),
  (14, 'Gav. Chico'),
  (15, 'Sentispax'),
  (16, 'San Miguel');