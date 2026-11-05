# Sports Radar

Guía deportiva responsive para descubrir rápidamente qué ver ahora, próximamente y el fin de semana.

## Estado del contenido

La aplicación está preparada para producción, pero no publica la programación incluida en `data/events.json`: es DEMO y está intencionadamente desactivada en la interfaz. Antes de lanzar horarios o emisiones reales, conecta `/api/events` a proveedores oficiales o autorizados y conserva por evento `source`, `source_url`, `fetched_at` y una política de precedencia ante conflictos.

## Ejecución local

```bash
npm ci
npm start
```

Comprueba el servicio en `http://localhost:3000/api/health`.

## Despliegue con Docker

En el servidor que ejecuta Docker:

```bash
git clone <REPOSITORIO> sports-radar
cd sports-radar
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

El contenedor se reinicia salvo parada explícita e incorpora un healthcheck. Por defecto expone el puerto `3000`; si ya hay un proxy inverso, publícalo únicamente en loopback o enrútalo al dominio desde el proxy:

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

No expongas públicamente horarios DEMO ni un panel de administración inexistente. Para actualizar la versión instalada:

```bash
git pull --ff-only
docker compose up -d --build
```
