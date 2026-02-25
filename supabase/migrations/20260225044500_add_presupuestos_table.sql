-- Tabela de Orçamentos (Presupuestos)
create table
  public.presupuestos (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    familia_id uuid not null,
    categoria text not null,
    monto_limite numeric not null default 0,
    mes_anio text not null, -- formato 'YYYY-MM'
    constraint presupuestos_pkey primary key (id),
    constraint presupuestos_familia_id_fkey foreign key (familia_id) references familias (id) on update cascade on delete cascade,
    constraint presupuestos_familia_categoria_mes_unique unique (familia_id, categoria, mes_anio)
  ) tablespace pg_default;

-- Activar RLS en presupuestos
alter table public.presupuestos enable row level security;

-- Política de lectura: todos los miembros de la familia pueden ver los presupuestos
create policy "Ver_presupuestos_mi_familia"
on public.presupuestos
for select
to authenticated
using (
  familia_id in (
    select f.id from familias f 
    join perfiles p on p.familia_id = f.id
    where p.id = auth.uid()
  )
);

-- Política de inserción: solo Admins (o Co-Admins, dependiendo de la regla elegida. Usaremos Admin/Co-Admin por consistencia)
create policy "Crear_presupuestos"
on public.presupuestos
for insert
to authenticated
with check (
  familia_id in (
    select f.id from familias f 
    join perfiles p on p.familia_id = f.id
    where p.id = auth.uid() and p.rol in ('admin', 'co_admin')
  )
);

-- Política de actualización: solo Admins/Co-Admins
create policy "Actualizar_presupuestos"
on public.presupuestos
for update
to authenticated
using (
  familia_id in (
    select f.id from familias f 
    join perfiles p on p.familia_id = f.id
    where p.id = auth.uid() and p.rol in ('admin', 'co_admin')
  )
);

-- Política de eliminación: solo Admins/Co-Admins
create policy "Eliminar_presupuestos"
on public.presupuestos
for delete
to authenticated
using (
  familia_id in (
    select f.id from familias f 
    join perfiles p on p.familia_id = f.id
    where p.id = auth.uid() and p.rol in ('admin', 'co_admin')
  )
);
