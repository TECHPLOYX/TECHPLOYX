# TECHPLOYX — Continuidad operativa

Estado verificado 2026-10-24. Supabase project wkfmdtfhvdeyhhxatfll, esquema aislado techployx_ops. Cron techployx-director-five-minute cada cinco minutos; ejecuciones succeeded a las 12:00, 12:05 y 12:10 UTC.

Pruebas: idempotencia con una sola fila por clave, recuperación de bloqueo RUNNING a RETRY, trabajo sin ejecutor a REVIEW y chequeo interno ops_self_check a DONE. El estado de servicios externos permanece UNKNOWN hasta verificar.

Regla: ejecución persistente fuera de ChatGPT. Secretos solo en gestores seguros, ningún secreto en GitHub. Mantener aislado MAXMAQ. No declarar producción autónoma completa antes de conectar ejecutores reales y validar recuperación y alertas.
