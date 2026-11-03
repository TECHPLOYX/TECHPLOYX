# Coordinador de Continuidad — versión 1

## Propósito

Mantener una visión única y verificable de TECHPLOYX, MAXMAQ, GARAGEFLOW, INSURANCE y futuros proyectos.

## Alcance de esta versión

El Coordinador observa, ordena y reporta. No ejecuta cambios autónomos ni abre trabajo nuevo.

Cada revisión debe:

1. Leer el registro de proyectos.
2. Detectar bloqueos o falta de avance.
3. Confirmar la siguiente acción concreta.
4. Registrar el resultado en `continuity_logs`.
5. Señalar las decisiones que requieren intervención humana.
6. Generar un resumen diario.

## Formato del resumen

- Estado por proyecto.
- Prioridad.
- Último avance comprobado.
- Bloqueo real, si existe.
- Siguiente acción.
- Decisión requerida del usuario.

## Reglas

- Usar únicamente las rutas comprobadas GitHub + Netlify + Supabase + Zoho + S3.
- No mostrar secretos.
- No cambiar producción, DNS, esquema o permisos sin la ruta autorizada.
- No marcar una tarea como completada sin evidencia observable.
- No duplicar trabajo ya registrado.
