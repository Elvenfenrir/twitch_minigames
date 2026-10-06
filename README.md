# Chat Mini Games

Página 100% offline (sin dependencias) para que el chat de Twitch juegue mini juegos vía Streamer.bot.
Ábrela directamente (`index.html`) o como Browser Source de OBS (Local file con query params, o `file:///...index.html?top=5`).

## Juegos y comandos del chat

| Juego | id (`game=`) | Comandos |
|---|---|---|
| Tetris | `tetris` | `A` izq · `D` der · `W` rotar · `S` bajar · `E` caída total |
| Snake | `snake` | `A` `D` `W`/`E` `S` (dirección) |
| Buscaminas | `minesweeper` | `A1`…`J10` descubrir (letra = columna, número = fila) · `F A1` bandera |
| Breakout | `breakout` | `A` / `D` mueven la barra |
| 2048 | `2048` | `A` `D` `W` `S` |
| Conecta 4 | `connect4` | `1`-`7` o `A`-`G` (el chat vs IA) |

## Query parameters

| Param | Default | Descripción |
|---|---|---|
| `host`, `port`, `endpoint`, `ssl` | `127.0.0.1`, `8080`, `/`, `0` | Conexión al WebSocket Server de Streamer.bot (reconexión automática) |
| `password` | – | Contraseña del WebSocket Server si la tiene |
| `game` | `random` | Un juego, lista separada por comas (`snake,tetris`) o `random` (todos) |
| `mode` | `instant` | `instant`: cada comando se aplica al instante · `vote`: gana la jugada más votada en la ventana |
| `voteMs` | `1500` | Ventana de votación (ms) |
| `score` | `1` | Muestra score actual y total acumulado |
| `top` | `0` | Muestra el top N de usuarios con más comandos válidos (0 = oculto) |
| `persist` | `0` | Guarda score total y top en localStorage |
| `gameOverSec` | `10` | Segundos mostrando el score al terminar |
| `switchSec` | `10` | Aviso previo al cambio de juego por redemption |
| `speed` | `1` | Multiplicador de velocidad |
| `hint`, `status` | `1`, `1` | Barra de controles / punto de estado de conexión |
| `transparent` | `0` | Fondo transparente (OBS) |
| `debug` | `0` | Caja de texto para simular chat (`A`, `A1`) y cambiar juego (`/snake`) |

Al terminar un juego se muestra el score `gameOverSec` segundos y luego se reinicia (si `game` es uno solo) o se abre otro al azar del pool.

## Streamer.bot

1. *Servers/Clients → WebSocket Server*: activar, con auto-start.
2. El chat se recibe directamente del evento `Twitch.ChatMessage` (no requiere acciones).
3. Para cambiar de juego desde un redemption: acción con la sub-acción **Broadcast WebSocket Custom Message** y este JSON:

```json
{ "game": "snake" }
```

`game` acepta un id, `random`, o usa `{ "action": "restart" }`. Se muestra "Cambiando a X en 10s" y el cambio ocurre tras `switchSec`.
