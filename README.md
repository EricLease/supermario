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
* Creating a new sprite sheet with `sprite-tool` will embed the image's base64 data in the `.json` file.  While this may be desirable for a `SpriteSheet` dedicated to tiles, it is likely *not* the desired behavior if multiple `SpriteSheet`s share the same `imageUrl`.  In that case, one should start with a bare `.json` file, with an `imageUrl` that is a relative path to the server image asset, as in Fig. 1, below.
* If a sprite sheet was loaded into `sprite-tool` with a path `imageUrl`, the path will be preseved on export.  Likewise, embedded data will be preserved.
* Export functionality is currently restricted to downloading the file to your browser's downloads folder, and possibly changing the name (e.g. appending '(1)').  Sprite sheets created with the tool must be moved, and possibly renamed before they can be used with the engine.

> Ex. 1 Boilerplate sprite sheet `.json` that uses an external image<br/>
> ```
> {
>    "imageUrl": "/assets/characters.gif"
> }
> ```
> <br />

> Ex. 2 A sprite sheet `.json` with an embedded image
> ```
> {
>    "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEFgwWDAAD/...",
>    ...
> }
>
> ```
> <br/>

&nbsp;

# Roadmap

* ### v0.5.0: map-editor
* ### v0.6.0: entity-editor
* ### v0.7.0: engine level/scene enhancements
* ### v0.8.0: engine game state management
* ### v0.9.0: server integration (data & asset storage, query api)
* ### v1.0.0: PWA enhancements for offline mode

# TODO (in v0.5.x)

* ### Add sprite panel - tiles, patterns, entities tabs
* ### Add layers panel - checkboxes to enable/disable layers
* ### Enable tile drag and drop 
    * add/move/remove 
    * prevent editing when multiple layers visible?!!!?!!??
* ### Create pattern editor mini-tool
* ### Add entity loading support
* ### Implement export

&nbsp;

# Credit:
[Meth Meth Method](https://www.youtube.com/channel/UC8A0M0eDttdB11MHxX58vXQ) for the game engine.  His [Super Mario Bros in JavaScript](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx) video series was the starting point for the engine, and has been modified very little so far.  The resulting source from that series is [on his github page](https://github.com/meth-meth-method/super-mario).