create table
  public.categorias (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    nombre text not null,
    familia_id uuid not null,
    constraint categorias_pkey primary key (id),
    constraint categorias_familia_id_fkey foreign key (familia_id) references familias (id) on update cascade on delete cascade
  ) tablespace pg_default;

-- Activar RLS en categorias
alter table public.categorias enable row level security;

-- Política de lectura para toads la familia (miembros de la misma familia)
create policy "Ver_categorias_mi_familia"
on public.categorias
for select
to authenticated
using (
  familia_id in (
    select f.id from familias f 
    join perfiles p on p.familia_id = f.id
    where p.id = auth.uid()
  )
);

-- Política de inserción (para Admins / Co-Admins de la misma familia, ou qquer miembro se pode) 
-- Dejaremos que Admins, Co-Admins y Dependentes puedan agregar categorias 
-- (o si quisieramos solo admin, validamos perfil)
create policy "Crear_categorias"
on public.categorias
for insert
to authenticated
with check (
  familia_id in (
    select f.id from familias f 
    join perfiles p on p.familia_id = f.id
    where p.id = auth.uid() and p.rol in ('admin', 'co_admin')
  )
);

-- Delete policies
create policy "Eliminar_categorias"
on public.categorias
for delete
to authenticated
using (
  familia_id in (
    select f.id from familias f 
    join perfiles p on p.familia_id = f.id
    where p.id = auth.uid() and p.rol in ('admin', 'co_admin')
  )
);

-- Como transacciones ya tiene la columna "categoria" de tipo text, 
-- y actualmente acepta cualquier texto (Zod validaba de lado cliente/server action),
-- no hace falta modificar la tabla transacciones. Podrán usar las creadas aqui.

-- Trigger o defaults para inyectar categorias basicas al crear familia:
-- Podríamos crearlas desde el backend (actions.ts) temporalmente cuando el usuario se registra.
