# Torre Jefferson · App (piloto)

App web instalable para la Torre Jefferson: reservas de gimnasio y cowork, pedidos y avisos con portería, ocupantes de temporada, comunicados, novedades de portería y bitácora diaria.

- **Datos y usuarios:** Firebase (proyecto `torre-jefferson`): Authentication + Firestore.
- **Publicación:** Netlify, conectado a este repositorio de GitHub.
- **Sin compilación:** son archivos estáticos; Netlify los publica tal cual.

## Puesta en marcha (una sola vez)

1. **Reglas de seguridad de Firestore**
   Firebase → Firestore Database → pestaña **Reglas** → borrar todo → pegar el contenido de `firestore.rules` → **Publicar**.
2. **Subir a GitHub**
   En el repositorio `torre-jefferson-app`: *Add file → Upload files* → arrastrar todos los archivos y carpetas de este proyecto → *Commit changes*.
3. **Publicar en Netlify**
   Netlify → *Add new site → Import an existing project → GitHub* → elegir `torre-jefferson-app` → sin comando de build, carpeta de publicación `.` → *Deploy*.
4. **Reservar los usuarios del personal (importante)**
   Apenas esté publicada, entrar una vez como **Portero**, **Encargado**, **Recepción** y **Comisión** con el código de prueba. Así esas cuentas quedan creadas con el código correcto.
5. **Cargar los datos de ejemplo**
   Entrar como **Encargado** → pestaña **Datos de prueba** → *Cargar datos de ejemplo*.

## Etapa 1 · Operativa de recepción

- **Apartamentos:** tablero de la torre (107 a 1712) y ficha por unidad: estado, residentes, vehículos, autorizaciones e historial.
- **Autorizaciones de ingreso** con fecha de fin o de una sola vez.
- **Vehículos:** listado para seguridad del complejo (copiar o imprimir).
- **Tareas por turno** (Mañana 6–14, Tarde 14–22, Noche 22–6) con tilde, quién y comentario.
- **Llaves:** préstamos, devoluciones y control de inventario.
- **Reservas:** gimnasio, cowork, sauna y sala de masajes.
- Las fichas las cargan el **Encargado** y **Recepción**; portería las consulta.

## Etapa 2 · Gestión interna (pestaña "Gestión")

- **Proveedores de servicio:** visitas con periodicidad y aviso de vencidas.
- **Mucamas:** servicios contratados por días y hora, visitas puntuales y agenda diaria imprimible.
- **Turnos del personal:** planilla semanal de recepción y mucamas (la asigna el encargado).
- **Caja chica:** gastos, reposiciones y saldo; la comisión la consulta.
- **Materiales de limpieza:** stock, entregas, ingresos y alerta de reposición.

## Cómo se ingresa

| Quién | Usuario | Código |
|---|---|---|
| Vecino | Número de apartamento (107 a 1712: piso + 07 a 12) | Código de prueba (`config.js`) |
| Portero / Encargado / Recepción / Comisión | Se elige el rol en la pantalla de ingreso | El mismo código |

La primera vez que alguien entra con un apartamento, la cuenta se crea sola con el código de prueba.

## Instalar en el celular

- **iPhone (Safari):** abrir el link → botón Compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome):** abrir el link → menú ⋮ → *Instalar app* o *Agregar a pantalla principal*.

## Apariencia

Botón **Apariencia** (paleta) arriba: modo Automático (sigue el día/noche del celular), Día o Noche, y 5 colores (Verde mar, Azul, Terracota, Violeta, Oliva). Se guarda en cada dispositivo.

## Configuración (`config.js`)

- `codigoPrueba`: el código común de la prueba.
- `telefonoRecepcion`: el número que se muestra a los vecinos.
- `videos`: en `false` hasta pasar al plan Blaze. Para activarlos: plan Blaze → Storage → pegar `storage.rules` en Reglas → poner `videos: true`.

## Antes de abrirla a todo el edificio

- Reemplazar el código común por códigos individuales por apartamento.
- Activar App Check en Firebase.
- Completar normas, horarios y capacidad del gimnasio y del cowork (en `app.js`, constante `SPACES`).
