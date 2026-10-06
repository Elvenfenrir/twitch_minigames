# Chat Mini Games

Página 100% offline (sin dependencias) para que el chat de Twitch juegue mini juegos vía Streamer.bot.
Ábrela directamente (`index.html`) o como Browser Source de OBS (`file:///.../index.html?top=5`).

**Generador de URL:** abre `settings.html`, elige las opciones y copia la URL resultante (incluye vista previa).

## Juegos y comandos del chat

| Juego | id (`game=`) | Comandos |
|---|---|---|
| Tetris | `tetris` | `A` izq · `D` der · `W` rotar · `S` bajar · `E` caída total |
| Snake | `snake` | `A` `D` `W`/`E` `S` (dirección). Parte hacia arriba y espera 3 s antes de moverse |
| Buscaminas | `minesweeper` | `A1`…`J10` descubrir (letra = columna, número = fila) · `F A1` bandera |
| Breakout | `breakout` | `A` / `D` mueven la barra |
| 2048 | `2048` | `A` `D` `W` `S` |
| Conecta 4 | `connect4` | `1`-`7` o `A`-`G` (el chat vs IA) |
| Tic-Tac-Toe | `tictactoe` | `A1`…`C3` o `1`-`9` (chat = X vs IA = O; la IA falla ~20% de las veces) |

## Query parameters

| Param | Default | Descripción |
|---|---|---|
| `host`, `port`, `endpoint`, `ssl` | `127.0.0.1`, `8080`, `/`, `0` | Conexión al WebSocket Server de Streamer.bot (reconexión automática) |
| `password` | – | Contraseña del WebSocket Server si la tiene |
| `actionId` | – | ID de la acción ejecutada al terminar la partida tras recibir un juego vacío en modo single; recibe `gameOverSec` en el argumento `timer` |
| `game` | `random` | Un juego, lista separada por comas (`snake,tetris`) o `random` (todos) |
| `rotation` | auto | `1`: al terminar rota a otro juego del pool · `0`: modo single, el juego se oculta al terminar y arranca oculto hasta recibir un juego. Auto = single si `game` es uno solo. Se puede cambiar en vivo desde Streamer.bot |
| `mode` | `instant` | `instant`: cada comando se aplica al instante · `vote`: gana la jugada más votada en la ventana |
| `voteMs` | `1500` | Ventana de votación (ms) |
| `score` | `1` | Muestra score actual y total acumulado |
| `top` | `0` | Muestra el top N de usuarios con más comandos válidos (0 = oculto) |
| `persist` | `0` | Guarda score total y top en localStorage |
| `theme` | – | Preset de colores: `arien` (rosa pastel), `fenrir` (blanco/negro/verde neón/dorado), `light`, `neon`, `retro` (vacío = oscuro) |
| `radius` | `0` | Radio (px, sobre 720) de las esquinas curvas del fondo del juego. Fuera del cuadrado queda transparente (OBS) |
| `bg` | `10151f` | Color de fondo (hex, con o sin `#`) |
| `accent` | `ffd54a` | Color de acento: HUD, avisos y detalles de cada juego |

| `gameOverSec` | `10` | Segundos mostrando el score al terminar |
| `switchSec` | `10` | Aviso previo al cambio de juego por redemption |
| `speed` | `1` | Multiplicador de velocidad |
| `hint`, `status` | `1`, `1` | Barra de controles / punto de estado de conexión |
| `transparent` | `0` | Fondo transparente (OBS) |
| `debug` | `0` | Caja de texto para simular chat (`A`, `A1`) y cambiar juego (`/snake`) |

### Colores por juego

Además de `bg` y `accent`, cada color tiene su propio parámetro y pisa al preset (hex sin `#`). Lo más fácil es elegirlos con los selectores de `settings.html`.

| Juego | Parámetros |
|---|---|
| General | `grid` (líneas y textos tenues) |
| Tetris | `board`, `pI` `pO` `pT` `pS` `pZ` `pJ` `pL` |
| Snake | `snake`, `food` (la cabeza usa `accent`) |
| Buscaminas | `msClosed`, `msOpen`, `msMine`, `msFlag` |
| Breakout | `brick1`…`brick6`, `ball` |
| 2048 | `tileEmpty` |
| Conecta 4 | `c4board`, `c4empty`, `c4p1`, `c4p2` |
| Tic-Tac-Toe | `ttX`, `ttO` |

Ejemplo: `index.html?theme=neon&msClosed=ff0066&ttX=00ff00`

Ejemplo: `index.html?game=snake,tetris&mode=vote&top=5&bg=1b1030&accent=ff4081`

Al terminar un juego se muestra el score `gameOverSec` segundos y luego se reinicia (si `game` es uno solo) o se abre otro al azar del pool.

## Streamer.bot

1. *Servers/Clients → WebSocket Server*: activar, con auto-start.
2. El chat se recibe directamente del evento `Twitch.ChatMessage` (no requiere acciones).
3. Para cambiar de juego desde un redemption, crea una acción con el trigger **Twitch → Channel Reward → Reward Redemption** y un sub-action **Execute C# Code**:

```csharp
using System;

public class CPHInline
{
    public bool Execute()
    {
        // "snake", "tetris", "minesweeper", "breakout", "2048",
        // "connect4", "tictactoe" o "random".
        string game = "random";

        // Si el reward pide texto al viewer, se usa como nombre del juego.
        if (args.ContainsKey("rawInput") && !string.IsNullOrWhiteSpace(args["rawInput"].ToString()))
            game = args["rawInput"].ToString().Trim().ToLower();

        game = game.Replace("\\", "").Replace("\"", "");

        CPH.WebsocketBroadcastJson("{\"game\":\"" + game + "\"}");
        return true;
    }
}
```

Para fijar un juego por reward, deja `game` con un valor fijo (p. ej. `"snake"`) y crea una acción por reward. Para reiniciar el juego actual envía `{"action":"restart"}`.

Alternativa sin código: sub-action **Broadcast WebSocket Custom Message** con `{ "game": "snake" }`.

La página acepta tanto el JSON crudo de `WebsocketBroadcastJson` como el evento `General.Custom`. Se muestra "Cambiando a X en 10s" y el cambio ocurre tras `switchSec`.

### Modo rotación / single game en vivo

| Mensaje | Efecto |
|---|---|
| `{"action":"rotation"}` | Activa la rotación: al terminar cada juego pasa a otro al azar (todos, o el pool de `game`) |
| `{"action":"rotation","games":"snake,tetris"}` | Rotación solo entre esos juegos |
| `{"game":""}` | En rotación, al terminar el juego actual vuelve al azar entre todos los juegos. En single, ejecuta el `actionId` configurado al terminar y conserva visible la pantalla final |
| `{"action":"single"}` | Activa single y prepara la ejecución del `actionId` al terminar la partida actual; la pantalla final permanece visible |
| `{"action":"single","game":"snake"}` | Juega Snake una vez (con aviso) y luego se oculta |

El cambio de modo aplica desde el siguiente game over. En **single**, al terminar una partida sin una señal de juego vacío, el minijuego y el HUD desaparecen (fondo transparente) hasta recibir un juego o volver a `rotation`. Una señal de juego vacío (`{"game":""}` o `{"action":"single"}` sin juego) ejecuta el `actionId` configurado al terminar la partida, pasando `gameOverSec` como argumento `timer`, y deja visible la pantalla final. Un juego no vacío, incluido `{"game":"random"}`, cambia de juego tras `switchSec`; el cambio no ocurre antes de que venza esa espera. Con `rotation=0` en la URL arranca oculto. Con `debug=1` puedes probar con `/rotation` y `/single`.

Opcionalmente, configura **Action ID para juego vacío en modo single** en `settings.html`. Solo se envía tras recibir una señal de juego vacío mientras el modo está en **single**; la solicitud `DoAction` incluye el argumento `timer` con el valor de `gameOverSec`. No se envía en modo rotación; la vista previa del generador tampoco ejecuta la acción. Deja el campo vacío para desactivarlo.

Crea una acción por modo (o una sola leyendo un argumento) con **Execute C# Code**:

```csharp
using System;

public class CPHInline
{
    // Activa la rotación entre juegos.
    public bool Execute()
    {
        // Opcional: limitar los juegos, p. ej. "snake,tetris". Vacío = todos.
        string games = "";

        string json = games == ""
            ? "{\"action\":\"rotation\"}"
            : "{\"action\":\"rotation\",\"games\":\"" + games.Replace("\"", "") + "\"}";
        CPH.WebsocketBroadcastJson(json);
        return true;
    }
}
```

```csharp
using System;

public class CPHInline
{
    // Modo single: juega una partida y luego el minijuego desaparece.
    public bool Execute()
    {
        // Juego a lanzar. Vacío = termina la partida en curso y se oculta.
        string game = "snake";
        if (args.ContainsKey("rawInput") && !string.IsNullOrWhiteSpace(args["rawInput"].ToString()))
            game = args["rawInput"].ToString().Trim().ToLower();
        game = game.Replace("\\", "").Replace("\"", "");

        string json = game == ""
            ? "{\"action\":\"single\"}"
            : "{\"action\":\"single\",\"game\":\"" + game + "\"}";
        CPH.WebsocketBroadcastJson(json);
        return true;
    }
}
```
