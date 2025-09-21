# POAP Card - Configuración del Proyecto

Este proyecto está completo y listo para usar. Sigue estos pasos para configurarlo:

## 🚀 Instalación Completada

El proyecto ya ha sido inicializado con:
- ✅ Next.js 14+ con App Router y TypeScript
- ✅ Reown AppKit para conexión de wallet
- ✅ Supabase para base de datos
- ✅ Tailwind CSS con paleta de colores personalizada
- ✅ Sistema de autenticación SIWE + JWT
- ✅ Verificación SDM para NTAG424
- ✅ APIs completas para drops, cards y tapping NFC

## 🔧 Configuración Necesaria

### 1. Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus credenciales reales:

### 2. Reown (AppKit)
1. Ve a [Reown Cloud](https://cloud.reown.com)
2. Crea un nuevo proyecto
3. Copia el Project ID a `NEXT_PUBLIC_REOWN_PROJECT_ID`

### 3. Supabase
1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API
3. Copia URL y keys a las variables correspondientes
4. Ejecuta el SQL en `database/schema.sql` en el SQL Editor
5. Opcionalmente ejecuta `database/seed.sql` para datos de demo

### 4. Dominio (Producción)
- El proyecto está configurado para `https://0xpo.app`
- Para desarrollo usa `http://localhost:3000`

## 🏃‍♂️ Ejecutar el Proyecto

```bash
# Instalar dependencias (ya están instaladas)
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Verificar tipos
npm run typecheck

# Linter
npm run lint
```

## 🧪 Probar el Sistema

1. **Conecta tu wallet** en la página principal
2. **Reclama una tarjeta** con UID: `DEMOUID1234`
3. **Prueba el tap NFC** visitando: `/r?uid=DEMOUID1234&ctr=1&cmac=MOCK`

## 📁 Estructura del Proyecto

```
poapcard/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── drops/          # Gestión de drops
│   ├── cards/          # Gestión de tarjetas
│   └── r/              # Tap público NFC
├── components/         # Componentes React
├── lib/               # Utilidades
│   ├── auth/          # Autenticación SIWE/JWT
│   ├── supabase/      # Clientes DB
│   └── sdm/           # Verificación NTAG424
├── database/          # SQL schemas
└── types/            # TypeScript types
```

## 🔒 Seguridad

- Autenticación SIWE + JWT HttpOnly cookies
- Verificación criptográfica SDM
- Row Level Security en Supabase
- Idempotencia por CMAC único

## 🚀 Deploy

- **Frontend**: Vercel (conecta el repo Git)
- **Base de datos**: Supabase (ya configurado)
- **Dominio**: Configura `https://0xpo.app`

## 📚 Documentación Completa

Ver `CLAUDE.md` para documentación técnica detallada y `README.md` para información general.

¡El proyecto está listo para usar! 🎉