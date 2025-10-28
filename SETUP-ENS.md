# Setup: ENS Resolution System

Este documento te guía para configurar el sistema de resolución ENS.

## Paso 1: Configurar Variables de Entorno

El script necesita acceso a las siguientes variables de entorno. Asegúrate de tenerlas en tu archivo `.env.local`:

```bash
# Requeridas para el script
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Opcional (tiene un default público)
RPC_MAINNET=https://eth.llamarpc.com
```

### ¿Dónde encontrar estas variables?

#### SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** → **API**
3. Copia:
   - **Project URL** → Esta es tu `SUPABASE_URL`
   - **Service Role Key** → Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Mantén esto en secreto!)

#### RPC_MAINNET (Opcional)

Esta variable es opcional. El script usa `https://eth.llamarpc.com` por defecto.

Si quieres usar tu propio RPC de Ethereum Mainnet:
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://infura.io/)
- [QuickNode](https://www.quicknode.com/)
- O cualquier otro proveedor RPC

Ejemplo:
```bash
RPC_MAINNET=https://eth-mainnet.g.alchemy.com/v2/your-api-key
```

## Paso 2: Verificar Configuración

Verifica que tu archivo `.env.local` tenga todas las variables necesarias:

```bash
# Mostrar las variables (sin valores sensibles)
cat .env.local | grep -E "(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|RPC_MAINNET)" | sed 's/=.*/=***/'
```

Deberías ver algo como:
```
SUPABASE_URL=***
SUPABASE_SERVICE_ROLE_KEY=***
RPC_MAINNET=***
```

## Paso 3: Aplicar Migración de Base de Datos

Si aún no lo has hecho, asegúrate de aplicar la migración que agrega el campo `is_admin`:

1. Ve a tu dashboard de Supabase
2. Abre el **SQL Editor**
3. Copia y ejecuta el contenido de `database/migrations/001_add_admin_users.sql`

## Paso 4: Ejecutar el Script

Ahora puedes ejecutar el script para actualizar los ENS de usuarios existentes:

```bash
npm run update-ens
```

### Ejemplo de salida exitosa:

```
🔍 Fetching all users from database...

📊 Found 3 user(s)

👤 Processing: 0x0e88ac34917a6bf5e36bfdc2c6c658e58078a1e6
  🔄 Fetching ENS...
  ✓  Found ENS: admin.eth
  ✓  Updated in database

👤 Processing: 0x1234567890abcdef1234567890abcdef12345678
  🔄 Fetching ENS...
  ℹ️  No ENS name found

👤 Processing: 0xd8da6bf26964af9d7eed9e03e53415d37aa96045
  🔄 Fetching ENS...
  ✓  Found ENS: vitalik.eth
  ✓  Updated in database

==================================================
📈 Summary:
==================================================
✅ Updated: 2
⏭️  Skipped: 0
❌ Failed: 0
📊 Total: 3
==================================================

✨ Script completed successfully
```

## Paso 5: Verificar Resultados

Después de ejecutar el script, verifica los resultados en el panel de admin:

1. Conecta tu wallet admin (`0x0e88ac34917a6bf5e36bfdc2c6c658e58078a1e6`)
2. Ve a `/admin`
3. Deberías ver los nombres ENS en la columna "ENS"

## Troubleshooting

### Error: "Missing required environment variables"

**Causa**: No se encontró el archivo `.env.local` o faltan las variables.

**Solución**:
```bash
# Copia el ejemplo
cp .env.example .env.local

# Edita el archivo con tus valores reales
nano .env.local  # o usa tu editor favorito
```

### Error: "Failed to resolve ENS"

**Causa**: Problemas de conexión con el RPC de Mainnet.

**Soluciones**:
1. Verifica tu conexión a internet
2. Prueba con otro RPC endpoint
3. El script continuará con los demás usuarios (no se detiene por un error)

### Error: "Database error"

**Causa**: Problemas de conexión con Supabase.

**Soluciones**:
1. Verifica que las credenciales sean correctas
2. Verifica que el Service Role Key tenga permisos de escritura
3. Verifica que la tabla `users` exista y tenga el campo `ens`

### El script dice "Skipped" para todos los usuarios

**Causa**: Todos los usuarios ya tienen ENS guardado.

**Solución**: Esto es normal. El script solo actualiza usuarios sin ENS. Si quieres forzar la actualización, puedes limpiar el campo ENS manualmente en Supabase y volver a ejecutar el script.

## Notas Importantes

- ⚠️ **Nunca** compartas tu `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **Nunca** hagas commit de tu archivo `.env.local` al repositorio
- ✅ El script es idempotente (seguro ejecutar múltiples veces)
- ✅ Los nuevos usuarios tendrán su ENS resuelto automáticamente al registrarse
- ✅ El script tiene delays para evitar rate limiting del RPC

## Soporte

Si tienes problemas, revisa:
1. Los logs del script (tienen detalles de cada error)
2. El README del script en `scripts/README.md`
3. La configuración de RLS en Supabase
