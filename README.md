# Consumo de API REST con Angular 22 (httpResource + Proxy)

Aplicación Angular que consume una API REST propia (mini-backend en Express) para:

- **(a)** Listar posts usando `httpResource`, mostrando estados de carga y error.
- **(b)** Crear un post con `POST`.
- **(c)** Eliminar un post con `DELETE` y refrescar la lista automáticamente.
- **(d)** Funcionar correctamente a través de un `proxy.conf.json`.

## Estructura del repositorio
practica/
├── consumo-rest-app/     # Proyecto Angular (frontend)
├── mini-api/              # Backend propio en Express (sin CORS habilitado)
├── docs/                  # Capturas de evidencia
│   ├── 00-version-node.png
│   ├── 00-version-angular-cli.png
│   ├── 01-error-cors-antes-del-proxy.png
│   └── 02-vista-funcionando-con-proxy.png
└── README.md
## Versiones utilizadas

Evidenciado con el comando `ng version` (ver captura en `docs/00-version-angular-cli.png`):

| Herramienta       | Versión   |
|--------------------|-----------|
| Node.js            | v26.5.0   |
| Angular CLI         | 22.0.6    |
| Angular (core)      | 22.0.6    |
| npm                 | 11.17.0   |
| Sistema Operativo   | Windows (win32 x64) |

## Requisitos previos

- Node.js v26.5.0 (o compatible)
- npm 11.x
- Angular CLI 22.x instalado globalmente (`npm install -g @angular/cli@22`)

## Cómo correr el proyecto

Se necesitan **dos terminales abiertas al mismo tiempo**.

### 1. Levantar el backend propio (mini-api)

```bash
cd mini-api
npm install
node server.js
```
Debe mostrar:API corriendo en http://localhost:3000

Este backend expone los endpoints:
- `GET /posts`
- `POST /posts`
- `DELETE /posts/:id`

> Nota: este backend **no tiene CORS habilitado a propósito**, para poder evidenciar el error de CORS antes de aplicar el proxy.

### 2. Levantar el frontend Angular

En otra terminal:

```bash
cd consumo-rest-app
npm install
ng serve
```

Abrir en el navegador: [http://localhost:4200](http://localhost:4200)

## Configuración del Proxy (`proxy.conf.json`)

Ubicado en `consumo-rest-app/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    },
    "logLevel": "debug"
  }
}
```

Y referenciado en `angular.json`, dentro de la configuración de `serve`:

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

El servicio Angular (`src/app/services/post.ts`) consume la API mediante una ruta **relativa**:

```typescript
private baseUrl: string = '/api/posts';
```

Gracias al proxy, el navegador solicita `http://localhost:4200/api/posts`, y es el servidor de desarrollo de Angular quien reenvía internamente esa petición a `http://localhost:3000/posts`. Como esta redirección ocurre del lado del servidor (no en el navegador), **el navegador nunca ve un origen cruzado real**, y por lo tanto no bloquea la petición por CORS.

## Evidencia: error de CORS antes de aplicar el proxy

Antes de configurar el proxy, el servicio apuntaba directamente a `http://localhost:3000/posts` desde el navegador (origen `http://localhost:4200`), lo que provocaba el siguiente error en la consola:

Access to fetch at 'http://localhost:3000/posts' from origin 'http://localhost:4200'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.

![Error de CORS antes del proxy](docs/01-error-cors-antes-del-proxy.png)

En este estado, el componente muestra el **estado de error** manejado por `httpResource` (`ResourceValueError`).

## Evidencia: vista funcionando después de aplicar el proxy

Tras cambiar la URL del servicio a `/api/posts` y configurar correctamente `proxy.conf.json`, la aplicación consume el backend sin errores de CORS:

![Vista funcionando con proxy](docs/02-vista-funcionando-con-proxy.png)

## Funcionalidades implementadas

### a) Listado con `httpResource` (estados de carga y error)

```typescript
postsResource = httpResource<Post[]>(() => {
  this.refreshTrigger();
  return `${this.baseUrl}`;
});
```

El template (`post-list.html`) utiliza las propiedades reactivas del resource (`isLoading()`, `error()`, `value()`) para mostrar el estado correspondiente en cada caso.

### b) Crear recurso (POST)

```typescript
async create(post: Post): Promise<void> {
  await fetch(this.baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  this.refresh();
}
```

### c) Eliminar recurso (DELETE) y refrescar

```typescript
async delete(id: number): Promise<void> {
  await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
  this.refresh();
}
```

El método `refresh()` actualiza una señal (`refreshTrigger`) que `httpResource` observa como dependencia reactiva, forzando una nueva petición `GET` y refrescando la lista automáticamente.

### d) Proxy configurado

Ver sección **Configuración del Proxy** arriba.

## Autor

Nombre: _(Jonathan Javier Rivera Suarez )_
Materia / Práctica: Angular 22 — Consumo de API REST con httpResource

