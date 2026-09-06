USE boletos_combi;

ALTER TABLE reservas
  ADD COLUMN marcado_pagado_por ENUM('admin', 'operador') NULL,
  ADD COLUMN marcado_pagado_operador_id INT NULL,
  ADD COLUMN marcado_pagado_en DATETIME NULL,
  ADD FOREIGN KEY (marcado_pagado_operador_id) REFERENCES operadores(id);