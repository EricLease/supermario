# SuperMario Bros. game engine clone  and tooling

Clone or fork the repo, and navigate to its directory.
The project uses [serve](npmjs.com/package/serve), so there is a one time install:
> npm install

After that, to start the game engine and tooling just start the server:
> npm run start

```
> supermario-ecl@0.4.0 start c:\Work\supermario
> serve ./public

WARNING: Checking for updates failed (use `--debug` to see full error)

   ┌───────────────────────────────────────────────┐
   │                                               │
   │   Serving!                                    │
   │                                               │
   │   - Local:            http://localhost:5000   │
   │   - On Your Network:  http://undefined:5000   │
   │                                               │
   │   Copied local address to clipboard!          │
   │                                               │
   └───────────────────────────────────────────────┘
```

You will see it is being served at `localhost:5000` by default.

<table>
<thead><th style='text-align:center;'>Path</th>
       <th style='text-align:center;'>App</th></thead>
<tr><td>localhost:5000/</td>
    <td style='text-align:right;'>engine</td></tr>
<tr><td>localhost:5000/sprite-tool</td>
    <td style='text-align:right;'>sprite-tool</td></tr>
</table>

&nbsp;

## Take note (sprite-tool)
* If the `imageUrl` value in a sprite sheet `.json` file is a path, it will be treted as an app root relative path on the server.
* Creating a new sprite sheet with `sprite-tool` will embed the image's base64 data in the `.json` file.
* If a sprite sheet was loaded into `sprite-tool` with a path `imageUrl`, the path will be preseved on export.  Likewise, embedded data will be preserved.
* Export functionality is currently restricted to downloading the file to your browser's downloads folder, and possibly changing the name (e.g. appending '(1)').  Sprite sheets created with the tool must be moved, and possibly renamed before they can be used with the engine.

&nbsp;

# Credit:
[Meth Meth Method](https://www.youtube.com/channel/UC8A0M0eDttdB11MHxX58vXQ) for the game engine.  His [Super Mario Bros in JavaScript](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx) video series was the starting point for the engine, and has been modified very little so far.  The resulting source from that series is [on his github page](https://github.com/meth-meth-method/super-mario).