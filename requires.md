PROMPT — Genera la dApp “POAP Card” (Next.js + Supabase + Reown, dominio 0xpo.app)

Quiero un proyecto completo en Next.js 14+ (App Router, TypeScript) llamado poap-card para dispensar POAPs con NTAG424 DNA usando SDM (Secure Dynamic Messaging).
TODAS las capacidades web3 (conexión de wallet) y la autenticación deben hacerse exclusivamente con Reown (AppKit + wagmi/viem). Sin app móvil: todo corre en web.
Base de datos: Supabase (Postgres).
Dominio público para el tap: https://0xpo.app.

0) Stack

Next.js 14+ (App Router app/, TypeScript, runtime Node en APIs).

UI: Tailwind CSS. Paleta pastel para la palabra “CARD”:

C #EAC9F8, a #D8F2C8, r #B5AEFF, d #FFEDD6; morado base #6E56CF.

DB: Supabase (Postgres) vía @supabase/supabase-js.

Web3: Reown AppKit + @reown/appkit-adapter-wagmi + viem.

Auth: Reown para conectar la wallet + SIWE (Sign-In With Ethereum) propio; emisión de JWT en cookie HttpOnly.

Opcional: reconciliar estado de códigos con la API de POAP por qr_hash.

1) Reown (requisito estricto)

Instalar y configurar:

@reown/appkit

@reown/appkit-adapter-wagmi

viem / wagmi (lo que AppKit necesite)

Crear un Provider de cliente (ej. app/providers.tsx) que:

Inicialice WagmiAdapter con las chains que se usarán (mainnet p/ ENS y las que gustes).

Haga createAppKit({ adapters: [wagmiAdapter], projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID, features: { email: false } }).

Componente de Conectar Wallet:

Botón que abre el modal de Reown.

Mostrar address conectada (shortened).

SIWE usando la cuenta conectada por Reown:

GET /api/auth/nonce → { nonce }.

POST /api/auth/verify { message, signature, address } → Validar con viem.verifyMessage.
Emitir JWT (12h) y setear cookie HttpOnly.

Toda lectura del address en el cliente proviene de Reown; no aceptes address manuales.

No usar otros conectores ni “iniciar con email”. Solo Reown para web3 y auth.

2) Dominio y ruta pública

Dominio base: https://0xpo.app.

Ruta de tap (pública): GET /r?uid=<UID>&ctr=<CTR>&cmac=<CMAC> (generada por NTAG424 DNA con SDM).

Esta ruta debe correr en runtime nodejs y export const dynamic = 'force-dynamic'.

3) Esquema de datos (SQL en Supabase, con RLS)

Crear tablas e índices en Supabase (SQL editor). RLS: ON en todas.

create table users (
  id uuid primary key default gen_random_uuid(),
  address text unique not null,
  ens text,
  created_at timestamptz default now()
);

create table drops (
  id uuid primary key default gen_random_uuid(),
  owner_address text not null,
  name text not null,
  poap_event_id int,
  created_at timestamptz default now()
);

create table poap_codes (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid references drops(id) on delete cascade,
  claim_url text not null,
  qr_hash text,
  is_used boolean default false,
  used_by_address text,
  used_by_ens text,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  ntag_uid text unique not null,
  owner_address text not null,
  created_at timestamptz default now()
);

create table card_drop_assignments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade unique,
  drop_id uuid references drops(id) on delete cascade,
  assigned_at timestamptz default now()
);

create table card_reads (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  sdm_ctr int not null,
  sdm_cmac text not null unique,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  poap_code_id uuid references poap_codes(id),
  state text check (state in ('reserved','served','minted','invalid')) default 'reserved'
);

create index on drops(owner_address);
create index on cards(owner_address);
create index on poap_codes(drop_id, is_used);
create index on card_reads(card_id, sdm_ctr);

alter table users enable row level security;
alter table drops enable row level security;
alter table poap_codes enable row level security;
alter table cards enable row level security;
alter table card_drop_assignments enable row level security;
alter table card_reads enable row level security;

-- Políticas de lectura basadas en dueño (addr en claims).
create policy "read_own_drops" on drops
for select using ( owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr' );

create policy "read_own_cards" on cards
for select using ( owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr' );

create policy "read_codes_by_drop_owner" on poap_codes
for select using (
  exists(select 1 from drops d where d.id = poap_codes.drop_id
         and d.owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr')
);


Escrituras (insert/update/delete): házlas desde los route handlers del servidor con la Service Role Key (no en el cliente).
Si quieres 100% RLS en cliente, podrás emitir un JWT custom para Supabase con claim addr, pero en esta versión las mutaciones son server-only.

4) Variables de entorno (.env.example)
NEXT_PUBLIC_APP_URL=https://0xpo.app

# Reown
NEXT_PUBLIC_REOWN_PROJECT_ID=YOUR_REOWN_PROJECT_ID

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App Auth (SIWE propio)
JWT_SECRET=supersecret

# SDM / NTAG424
SDM_VERIFY_MODE=mock            # mock | strict
K_MASTER_HEX=00000000000000000000000000000000  # 16 bytes hex (para strict)

# POAP / ENS
POAP_API_TOKEN=
RPC_MAINNET=

5) APIs (Next.js route handlers, Node runtime)

Auth (Reown + SIWE + JWT cookie)

GET /api/auth/nonce → { nonce }.

POST /api/auth/verify { message, signature, address }

Verificar firma con viem.verifyMessage.

Emitir JWT (12h) en cookie HttpOnly.

Helper requireAuth() que lee la cookie y retorna { address }.

Drops

GET /api/drops/me (auth): devuelve [ { id, name, total, used, free } ] del owner.

GET /api/drops/[id]/codes (auth, owner): lista de poap_codes del drop.

Cards

POST /api/cards/claim { cardUid } (auth): upsert de cards(ntag_uid=cardUid, owner_address=address).

POST /api/cards/[cardUid]/assign-drop { dropId } (auth): validar owner de card y drop, upsert en card_drop_assignments.

Tap del NFC (SDM)

GET /api/r?uid&ctr&cmac:

Verificar SDM:

mock: siempre true.

strict: implementar AES-CMAC con K_MASTER_HEX y diversificación por UID (NTAG424 SDM).

Si card no existe ⇒ { status:'error', reason:'unclaimed_card' }.

Si sin drop ⇒ { status:'error', reason:'unassigned_drop' }.

Idempotencia por sdm_cmac:

Si existe y state='minted' ⇒ { status:'minted' }.

Si existe y state='served' ⇒ devolver el mismo claim_url y codeId.

Si no existe ⇒ reservar transaccionalmente el siguiente poap_code libre (is_used=false, ORDER BY created_at), crear card_reads(state='served', poap_code_id=...), responder { status:'served', claimUrl, codeId }.

Errores: no_codes, sdm_invalid, race_condition.

Confirmar mint

POST /api/claim/confirm { codeId, claimer }

Resolver ENS con viem si RPC_MAINNET está configurado.

poap_codes.is_used=true, used_by_address, used_by_ens, used_at=now()

card_reads.state='minted' para ese codeId.

(Opcional) Reconciliar contra POAP

POST /api/admin/reconcile { dropId } (auth del owner o admin):

Por cada qr_hash, llamar GET https://api.poap.tech/actions/claim-qr?qr_hash=... (header x-api-key) y sincronizar estado.

Usa el cliente Supabase admin (Service Role) en el servidor. No exponer la service key al cliente.

6) Páginas (App Router)

/ Home: Header con botón “Conectar wallet” (Reown modal), mostrar address conectada; CTA a Mis Drops / Mis Tarjetas.

/drops (auth): lista de drops (free/used/total).

/drops/[id] (auth): tabla de códigos (claim_url, estado, used_by_ens/address, used_at).

/cards (auth):

Form “Asociar tarjeta” (input cardUid).

“Asignar drop a tarjeta” (select de mis drops + cardUid).

/claim (opcional): si decides consumir /api/r vía fetch y mostrar un botón “Reclamar POAP” que abre claim_url.

Alternativa: que /api/r redirija 302 directo a claim_url.

Ruta pública /r:

app/r/route.ts: puede delegar a la lógica de /api/r y devolver JSON o hacer redirect.

export const dynamic = 'force-dynamic' y export const runtime = 'nodejs'.

7) UX/Estilo

Tema pastel y tipografía limpia.

Mensajes claros para: unclaimed_card, unassigned_drop, no_codes, sdm_invalid, minted.

Encabezado con estado de conexión Reown (address corta) y botón de desconexión.

8) Seguridad

JWT HttpOnly (12h) + verificación de origen/CSRF para POST.

Rate limit en /api/r por IP y por uid.

Idempotencia estricta por sdm_cmac (unique).

Claves AES solo en servidor; Reown projectId solo en el cliente como NEXT_PUBLIC_....

Service Role Key de Supabase solo en el servidor.

Logs de auditoría con card_reads.first_seen_at/last_seen_at.

9) DX y seed

Scripts: dev, build, start.

Seed: 1 drop demo + 5 poap_codes + 1 card (ntag_uid='DEMOUID1234').

README con:

Arquitectura, flujo SDM, endpoints, esquema SQL, .env, RLS, y despliegue en Vercel + Supabase.

(Opcional) Colección Postman o .http con ejemplos de todas las APIs.

10) Criterios de aceptación

Conexión de wallet y auth exclusivamente con Reown (AppKit modal).

/api/r?uid=DEMOUID1234&ctr=1&cmac=MOCK → served + claimUrl.
Repetición misma URL → served con el mismo claimUrl.
Tras POST /api/claim/confirm → la misma URL devuelve minted.

unclaimed_card si el uid no existe.

unassigned_drop si la card no tiene drop asignado.

no_codes si se agotan los códigos.

Genera el repo Next.js completo cumpliendo lo anterior, con Reown para todo el flujo web3 y de autenticación, Supabase como base de datos, y el dominio público 0xpo.app