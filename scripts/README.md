# Scripts

Este directorio contiene scripts útiles para mantenimiento y gestión del sistema.

## Update ENS Names

Script para actualizar los nombres ENS de todos los usuarios existentes en la base de datos.

### Requisitos

- Node.js instalado
- Variables de entorno configuradas en `.env.local`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RPC_MAINNET` (opcional, por defecto usa `https://eth.llamarpc.com`)

### Instalación de dependencias

Si es la primera vez que ejecutas scripts, asegúrate de tener `tsx` instalado:

```bash
npm install -D tsx
```

### Uso

```bash
# Ejecutar el script
npx tsx scripts/update-ens-names.ts
```

### ¿Qué hace el script?

1. Se conecta a Supabase con el Service Role Key
2. Obtiene todos los usuarios de la base de datos
3. Para cada usuario:
   - Si ya tiene ENS guardado, lo omite
   - Si no tiene ENS, intenta resolverlo usando viem
   - Si encuentra un ENS, lo guarda en la base de datos
4. Muestra un resumen al final con estadísticas

### Ejemplo de salida

```
🔍 Fetching all users from database...

📊 Found 5 user(s)

👤 Processing: 0x1234...5678
  ✓  ENS already set: vitalik.eth

👤 Processing: 0xabcd...efgh
  🔄 Fetching ENS...
  ✓  Found ENS: myname.eth
  ✓  Updated in database

👤 Processing: 0x9999...0000
  🔄 Fetching ENS...
  ℹ️  No ENS name found

==================================================
📈 Summary:
==================================================
✅ Updated: 1
⏭️  Skipped: 3
❌ Failed: 0
📊 Total: 5
==================================================

✨ Script completed successfully
```

### Notas

- El script incluye un delay de 200ms entre cada resolución para evitar rate limiting
- Los errores de resolución ENS no detienen el script, solo se registran
- Es seguro ejecutar el script múltiples veces (no duplica datos)
- El script usa el RPC de mainnet para resolver ENS

### Registro Automático de ENS

Desde la implementación de esta funcionalidad, todos los **nuevos usuarios** que se registren en el dApp tendrán su ENS resuelto y guardado automáticamente durante el proceso de autenticación.

Este script es útil para:
- Actualizar ENS de usuarios que se registraron antes de esta funcionalidad
- Actualizar ENS de usuarios que han cambiado su configuración ENS
- Llenar ENS faltantes por errores de red o timeouts durante el registro
