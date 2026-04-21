# CRM Sistema de Sellos con Fotopolímeros

Sistema completo de gestión de pedidos personalizados con fotopolímeros, desarrollo full-stack con autenticación segura, seguimiento en tiempo real y automatización de procesos.

## 🚀 Características Principales

### Sistema de Autenticación
- Login seguro con JWT y httpOnly cookies
- 2 roles: **Administrador** y **Cliente**
- Contraseñas hasheadas con bcrypt
- Recuperación manual de contraseña

### Panel de Cliente
- Vista privada de pedidos propios
- Sistema de notificaciones en tiempo real
- Timeline visual del proceso de producción
- Filtros: Todos / Activos / Archivados
- Búsqueda por nombre o número de pedido

### Panel de Administración
- Gestión completa de clientes (CRUD)
- Gestión de pedidos con carga de imágenes
- Actualización de estados con historial completo
- Dashboard con estadísticas
- Generación automática de notificaciones

### Estados de Producción (5 Etapas)
1. 📥 **Pedido Recibido**
2. 🎨 **Diseño Completado**
3. 🏭 **En Producción**
4. ✅ **Producto Finalizado**
5. 📦 **Enviado**

### Automatización
- **Archivo automático**: Pedidos "Enviados" se archivan después de 30 días
- **Cron job** diario para limpieza
- **Notificaciones** automáticas en cada cambio de estado

## 📋 Stack Tecnológico

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Bcrypt
- Multer + Sharp (imágenes)
- Node-cron (tareas programadas)

**Frontend:**
- React 18
- React Router v6
- Axios
- CSS Modules
- Date-fns

**Infraestructura:**
- Docker + Docker Compose
- Nginx
- PostgreSQL 15

## 🛠️ Instalación y Configuración

### Prerequisitos
- Node.js 18+ 
- PostgreSQL 15+
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd crm-sellos
```

### 2. Configurar Backend

```bash
cd backend

# Copiar archivo de configuración
copy .env.example .env

# Editar .env con tus credenciales
# DB_PASSWORD=tu_password_postgres
# JWT_SECRET=tu_secret_key_seguro

# Instalar dependencias
npm install

# Inicializar base de datos
npm run init-db

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará disponible en `http://localhost:5000`

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar aplicación
npm start
```

El frontend estará disponible en `http://localhost:3000`

## 🐳 Deployment con Docker

### Opción 1: Docker Compose (Desarrollo)

```bash
# En la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

Acceder a:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

### Opción 2: Producción

```bash
# Construir imágenes
docker-compose -f docker-compose.yml build

# Ejecutar en producción
docker-compose -f docker-compose.yml up -d
```

## 🔐 Credenciales por Defecto

**Administrador:**
- Usuario: `admin`
- Contraseña: `cambiarme123`

⚠️ **IMPORTANTE**: Cambiar esta contraseña inmediatamente después de la primera instalación.

## 📁 Estructura del Proyecto

```
crm-sellos/
├── backend/
│   ├── config/           # Configuración (DB, Auth)
│   ├── controllers/      # Lógica de negocio
│   ├── database/         # Esquema e inicialización
│   ├── jobs/             # Tareas programadas
│   ├── middleware/       # Autenticación, uploads
│   ├── routes/           # Endpoints API
│   ├── utils/            # Utilidades (imágenes)
│   ├── uploads/          # Archivos subidos
│   └── server.js         # Servidor principal
├── frontend/
│   ├── public/           # Archivos estáticos
│   └── src/
│       ├── components/   # Componentes reutilizables
│       ├── context/      # Estado global (Auth)
│       ├── pages/        # Páginas principales
│       ├── services/     # API cliente
│       └── styles/       # Estilos CSS
└── docker-compose.yml    # Orquestación
```

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual

### Usuarios (Admin)
- `GET /api/users` - Listar clientes
- `POST /api/users` - Crear cliente
- `PUT /api/users/:id` - Actualizar cliente
- `PUT /api/users/:id/password` - Resetear contraseña
- `PUT /api/users/:id/toggle-active` - Activar/Desactivar

### Pedidos
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/:id` - Detalle de pedido
- `POST /api/orders` - Crear pedido (Admin)
- `PUT /api/orders/:id` - Actualizar pedido (Admin)
- `PUT /api/orders/:id/status` - Cambiar estado (Admin)
- `GET /api/orders/stats` - Estadísticas (Admin)

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones
- `PUT /api/notifications/:id/read` - Marcar como leída
- `PUT /api/notifications/read-all` - Marcar todas

## 🔧 Scripts Disponibles

### Backend
```bash
npm start          # Iniciar servidor producción
npm run dev        # Iniciar con nodemon
npm run init-db    # Crear schema e insertar admin
npm test           # Ejecutar tests
```

### Frontend
```bash
npm start          # Servidor desarrollo
npm run build      # Build producción
npm test           # Ejecutar tests
```

## 🛡️ Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT con httpOnly cookies
- ✅ CORS configurado
- ✅ Validación de inputs
- ✅ Protección SQL injection (parametrized queries)
- ✅ Aislamiento de datos por cliente
- ✅ Validación de archivos (tipo y tamaño)

## 📊 Base de Datos

### Tablas Principales

**users**
- Usuarios (admin y clientes)
- Contraseñas hasheadas
- Estado activo/inactivo

**orders**
- Pedidos de los clientes
- Estado actual
- Imagen del producto
- Flag de archivado

**order_history**
- Historial completo de cambios
- Timestamp de cada cambio
- Usuario que realizó el cambio
- Notas opcionales

**notifications**
- Notificaciones internas
- Estado leído/no leído
- Vinculadas a pedidos

## 🎯 Casos de Uso

### Cliente
1. Inicia sesión con credenciales
2. Ve dashboard con sus pedidos
3. Click en pedido → ve timeline completo
4. Recibe notificación cuando cambia el estado
5. Filtra pedidos activos/archivados

### Administrador
1. Inicia sesión
2. Crea nuevo cliente con contraseña
3. Crea pedido para cliente específico
4. Sube imagen del diseño
5. Actualiza estado → notificación automática
6. Ve estadísticas generales

## 📝 Notas de Desarrollo

- Sistema diseñado para ~30 clientes
- Escalable hasta 100+ clientes
- Código limpio y comentado
- Arquitectura modular
- Responsive (optimizado desktop 1366x768+)

## 🚨 Solución de Problemas

### Error de conexión a BD
```bash
# Verificar que PostgreSQL esté corriendo
# Verificar credenciales en .env
# Reiniciar contenedor de base de datos
docker-compose restart database
```

### Error en carga de imágenes
```bash
# Verificar permisos de carpeta uploads/
# Tamaño máximo: 5MB
# Formatos: JPG, PNG, WEBP
```

### Sesión expirada
```bash
# JWT expira en 7 días por defecto
# Modificar JWT_EXPIRES_IN en .env
```

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👥 Soporte

Para asistencia técnica, contactar al equipo de desarrollo.

---

Desarrollado con ❤️ para gestión eficiente de producción de sellos personalizados
