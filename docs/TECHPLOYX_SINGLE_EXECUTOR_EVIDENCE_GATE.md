# TECHPLOYX — Puerta de ejecución única y evidencia (propuesta de actualización de Skills)

Estado: propuesta versionada para integrar en las Skills instaladas. Este archivo NO modifica por sí solo los Skills activos de ChatGPT.

## Regla corporativa obligatoria

**Una operación -> un ejecutor responsable -> una causa comprobada -> una corrección mínima -> una evidencia verificable.**

Aplicar antes de cambiar herramienta, reintentar una operación fallida, pedir credenciales, crear recursos, avanzar de fase o declarar una tarea finalizada.

### Control previo (techployx-operations-control / references/EXECUTION_GATE.md)

1. Identificar proyecto y límites de aislamiento, operación concreta, ejecutor activo y estado actual en la fuente de verdad.
2. Consultar último resultado real y su evidencia, incluida la última configuración aplicada y leída de vuelta.
3. Localizar el paso exacto que falló y separar causa confirmada de hipótesis.
4. Mantener el mismo ejecutor y recursos cuando todavía sirvan. Cambiar de herramienta solo ante incompatibilidad o bloqueo comprobado, dejando constancia.
5. Antes de repetir una ejecución fallida, registrar qué cambió o cuál es la hipótesis nueva que justifica una prueba distinta. No repetir pruebas idénticas sin cambio causal.
6. Para toda modificación: leer estado anterior -> aplicar el cambio más pequeño y autorizado -> volver a leer estado efectivo -> probar el resultado -> conservar enlace/log/identificador.
7. Reportar PLANNED, PREPARED, APPLIED o VERIFIED sin confundirlos. Solo VERIFIED se comunica como HECHO; los controles pendientes continúan abiertos.
8. No recrear identidades, buckets, roles, pipelines, credenciales ni despliegues sin demostrar primero que el recurso existente no sirve.
9. Una tarea con un solo bloqueo mantiene **un** ejecutor activo. El control sigue en CHAT y el resultado se devuelve con evidencia.

### Aplicación en Skills existentes

- **project-control**: ningún cambio de fase ni cierre del bloqueo sin evidencia del sistema de destino. La prueba de un subsistema no equivale al cierre de toda la fase.
- **execution-router**: no alternar CHAT/WORK/CODEX por inercia. Escalar solo el bloque técnico no ejecutable en CHAT y no iniciar rutas paralelas para el mismo objetivo.
- **ruta-confiable-continuidad**: configurar una vez; reutilizar identidades técnicas seguras y controles existentes. Falla repetida -> revisar causa y detener reintentos equivalentes. Persistir registro de identidad, permisos y resultados sin secretos.
- **credentials-access**: antes de solicitar login, revisar conexiones, roles OIDC, secrets y sesiones autorizadas; no repetir MFA ni solicitar contraseñas en chat.

## Caso de aceptación: TECHPLOYX Phase 6 / AWS OIDC

Contexto: repo TECHPLOYX/TECHPLOYX; bucket S3 existente techployx-dr-949847741014-us-east-2; rol techployx-github-dr-us-east-2. La prueba existente valida previamente artefacto y checksum, pero falla en sts:AssumeRoleWithWebIdentity. Runs fallidos: 42788219896, 42788691009, 42789034845, 42789579780.

1. No crear una cuenta, bucket, rol, workflow paralelo ni activar otra herramienta sin causa observada.
2. Leer trust policy IAM efectiva, provider OIDC y sus audiencias, token subject del workflow y ARN configurado en GitHub. La condición sub puede ser ref:refs/heads/main, environment u otra; **comparar antes de modificar**.
3. Corregir solo la discrepancia observada mediante identidad AWS administrativa legítima ya autorizada (AWS CLI o consola normal). Nunca eludir MFA ni automatizar pantallas de seguridad con TinyFish.
4. Leer de vuelta la política aplicada; entonces y solo entonces ejecutar una prueba modificada y justificada mediante el workflow existente.
5. Criterio de éxito OIDC/S3: token asumido -> objeto cifrado subido -> descargado desde S3 -> SHA256 coincide -> evidencia registrada en Supabase. Si fracasa, preservar paso/error exacto sin marcar VERIFIED.
6. El éxito de S3 cierra **solo** el bloqueo de copia externa. La recuperación integral de Supabase Auth, Storage y servicios gestionados sigue siendo una puerta independiente hasta validarse.
7. AppDeploy, Next.js y Netlify quedan fuera de esta corrección IAM. No alterar recursos ni credenciales de MAXMAQ, MedicalVan u otros proyectos.

## Evidencia mínima obligatoria

- ID y URL de la ejecución; fecha, repositorio, rama y ejecutor.
- Estado previo y posterior de la configuración no secreta.
- Paso exacto que falló o prueba que pasó; evidencia de objeto y readback checksum si aplica.
- Registro de continuidad en Supabase; estado de cada puerta de control actualizado y leído de vuelta.
- Siguiente y único bloqueo real, sin confundir PREPARED/APPLIED con VERIFIED.

## Integración posterior en Skills instaladas

Esta propuesta debe integrarse en el origen editable de **techployx-operations-control**, sobre todo `references/EXECUTION_GATE.md`, y mediante cambios mínimos en `project-control`, `execution-router` y `ruta-confiable-continuidad`. Tras actualizar cada Skill activa, leerla de vuelta para confirmar aplicación. No proclamar que este archivo de GitHub actualizó automáticamente las Skills de ChatGPT.
