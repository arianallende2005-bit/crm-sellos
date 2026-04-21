# Deployment en Google Cloud Platform (GCP)

Esta guía detalla cómo desplegar el CRM de Sellos en Google Cloud Platform usando Cloud Run y Cloud SQL.

## Prerequisitos

- Cuenta de GCP activa
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) instalado
- Proyecto de GCP creado

## 1. Configuración Inicial

```bash
# Autenticarse
gcloud auth login

# Configurar proyecto
gcloud config set project YOUR_PROJECT_ID

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## 2. Base de Datos (Cloud SQL)

### Crear instancia PostgreSQL

```bash
gcloud sql instances create crm-sellos-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_STRONG_PASSWORD

# Crear base de datos
gcloud sql databases create crm_sellos --instance=crm-sellos-db
```

### Configurar conexión privada

```bash
# Obtener connection name
gcloud sql instances describe crm-sellos-db --format='value(connectionName)'
```

## 3. Secrets Manager

Guardar secretos sensibles:

```bash
# JWT Secret
echo -n "your-super-secret-jwt-key" | gcloud secrets create jwt-secret --data-file=-

# Database Password
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-
```

## 4. Desplegar Backend en Cloud Run

### Preparar Dockerfile

El Dockerfile ya está configurado en `backend/Dockerfile`

### Build y Deploy

```bash
cd backend

# Build container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/crm-sellos-backend

# Deploy to Cloud Run
gcloud run deploy crm-sellos-backend \
  --image gcr.io/YOUR_PROJECT_ID/crm-sellos-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:crm-sellos-db \
  --set-env-vars NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/YOUR_CONNECTION_NAME \
  --set-secrets JWT_SECRET=jwt-secret:latest,DB_PASSWORD=db-password:latest \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

### Inicializar Base de Datos

Conectarse a Cloud SQL y ejecutar:

```bash
# Conectar a Cloud SQL
gcloud sql connect crm-sellos-db --user=postgres

# Dentro de psql
\c crm_sellos
\i path/to/schema.sql
```

O ejecutar desde Cloud Run:

```bash
# Usar Cloud Run Job para inicialización
gcloud run jobs create init-db \
  --image gcr.io/YOUR_PROJECT_ID/crm-sellos-backend \
  --command npm,run,init-db \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:crm-sellos-db \
  --set-secrets DB_PASSWORD=db-password:latest

# Ejecutar job
gcloud run jobs execute init-db
```

## 5. Desplegar Frontend en Cloud Run

### Preparar build

```bash
cd frontend

# Crear .env.production
echo "REACT_APP_API_URL=https://YOUR_BACKEND_URL" > .env.production
```

### Build y Deploy

```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/crm-sellos-frontend

# Deploy
gcloud run deploy crm-sellos-frontend \
  --image gcr.io/YOUR_PROJECT_ID/crm-sellos-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --memory 256Mi
```

## 6. Cloud Storage para Imágenes (Opcional)

### Crear bucket

```bash
gsutil mb -l us-central1 gs://crm-sellos-images

# Hacer bucket público (solo lectura)
gsutil iam ch allUsers:objectViewer gs://crm-sellos-images
```

### Configurar backend

Actualizar `backend/.env`:

```bash
GCS_BUCKET_NAME=crm-sellos-images
GCS_PROJECT_ID=YOUR_PROJECT_ID
```

### Agregar Service Account

```bash
# Crear service account
gcloud iam service-accounts create crm-sellos-sa \
  --display-name="CRM Sellos Service Account"

# Dar permisos
gsutil iam ch serviceAccount:crm-sellos-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com:objectAdmin gs://crm-sellos-images

# Asociar a Cloud Run
gcloud run services update crm-sellos-backend \
  --service-account crm-sellos-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## 7. Cloud Scheduler (Tareas programadas)

Para reemplazar node-cron:

```bash
# Crear endpoint para job de archivo
gcloud scheduler jobs create http archive-orders \
  --schedule="0 2 * * *" \
  --uri="https://YOUR_BACKEND_URL/api/jobs/archive" \
  --http-method=POST \
  --oidc-service-account-email=crm-sellos-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --location=us-central1
```

Agregar endpoint en backend:

```javascript
// backend/routes/jobs.js
router.post('/archive', verifyToken, requireAdmin, async (req, res) => {
  const { runArchiveJobNow } = require('../jobs/archiveJob');
  await runArchiveJobNow();
  res.json({ success: true });
});
```

## 8. Configurar Dominio Personalizado

```bash
# Mapear dominio
gcloud run domain-mappings create \
  --service crm-sellos-frontend \
  --domain crm.tuempresa.com \
  --region us-central1

# Seguir instrucciones para configurar DNS
```

## 9. SSL/HTTPS

Cloud Run automáticamente provee certificados SSL. Si usas dominio personalizado:

```bash
# Cloud Run maneja SSL automáticamente
# Solo configurar registros DNS correctamente
```

## 10. Monitoreo y Logs

```bash
# Ver logs backend
gcloud run services logs read crm-sellos-backend --limit=100

# Ver logs frontend
gcloud run services logs read crm-sellos-frontend --limit=100

# Configurar alertas
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="CRM High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  ...
```

## 11. Backup de Base de Datos

```bash
# Habilitar backups automáticos
gcloud sql instances patch crm-sellos-db \
  --backup-start-time=03:00 \
  --enable-bin-log

# Backup manual
gcloud sql backups create --instance=crm-sellos-db
```

## 12. Variables de Entorno Completas

### Backend Cloud Run

```bash
NODE_ENV=production
PORT=8080
DB_HOST=/cloudsql/YOUR_CONNECTION_NAME
DB_PORT=5432
DB_NAME=crm_sellos
DB_USER=postgres
CORS_ORIGIN=https://YOUR_FRONTEND_URL
GCS_BUCKET_NAME=crm-sellos-images
GCS_PROJECT_ID=YOUR_PROJECT_ID
```

### Secrets

```bash
JWT_SECRET=<from Secret Manager>
DB_PASSWORD=<from Secret Manager>
```

## 13. Costos Estimados

**Cloud Run:**
- Backend: ~$5-15/mes (tráfico bajo-medio)
- Frontend: ~$3-8/mes

**Cloud SQL (db-f1-micro):**
- ~$7-10/mes

**Cloud Storage:**
- ~$0.02/GB/mes

**Total estimado:** $15-35/mes para 30 clientes con uso moderado

## 14. CI/CD con Cloud Build

Crear `cloudbuild.yaml` en raíz:

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/crm-sellos-backend', './backend']

  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/crm-sellos-frontend', './frontend']

  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/crm-sellos-backend']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/crm-sellos-frontend']

  # Deploy backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args: ['gcloud', 'run', 'deploy', 'crm-sellos-backend', '--image', 'gcr.io/$PROJECT_ID/crm-sellos-backend', '--region', 'us-central1']

  # Deploy frontend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args: ['gcloud', 'run', 'deploy', 'crm-sellos-frontend', '--image', 'gcr.io/$PROJECT_ID/crm-sellos-frontend', '--region', 'us-central1']

images:
  - 'gcr.io/$PROJECT_ID/crm-sellos-backend'
  - 'gcr.io/$PROJECT_ID/crm-sellos-frontend'
```

## Notas Importantes

- ⚠️ Cambiar contraseña de admin después del primer deploy
- ⚠️ Configurar política de respaldo regular
- ⚠️ Monitorear costos en GCP Console
- ⚠️ Implementar rate limiting para producción
- ⚠️ Configurar CORS correctamente con dominio de producción

## Soporte

Para problemas de deployment, consultar:
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
