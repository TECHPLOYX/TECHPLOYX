# TECHPLOYX - Ruta de ejecución continua

## Regla
Configurar una vez -> Reutilizar identidad técnica -> Ejecutar fuera de ChatGPT -> Verificar -> Recuperar -> Continuar.

## Canal recomendado
GitHub Actions para comprobaciones recurrentes y despliegues solo si la API/CLI oficial del proveedor se verifica y se almacena un token con mínimos privilegios en GitHub Actions Secrets.

## Límites
Las solicitudes de aprobación de conectores en ChatGPT no pueden deshabilitarse con una Skill. No eludir controles ni usar una credencial web personal como sustituto de identidad técnica. Los permisos de despliegue deben establecerse en el proveedor correspondiente. No copiar secretos entre proyectos.

## Estado
Workflow de salud sin secretos añadido en rama ops/continuous-ci-route. NO se ha incorporado a main ni se ha activado programación persistente. APPDEPLOY_API_TOKEN no verificado y endpoint de despliegue por API no probado. No declarar automatización de despliegue lograda.

## Siguiente gate
1. Confirmar mecanismo de API/CI soportado por AppDeploy (o migrar backend a Netlify/GitHub + Supabase si AppDeploy no permite deploy externo).
2. Guardar credencial de servicio en almacén correspondiente, fuera del chat.
3. Crear workflow de staging con revisión y smoke tests.
4. Validar despliegue, rollback y alertas.
5. Solo entonces permitir disparadores recurrentes de producción.

## Correo P1
No liberar 13 notificaciones bloqueadas mientras no exista prueba SMTP con aceptación y confirmación de recepción. Evitar duplicados y marcar sent solo tras aceptación de proveedor.
