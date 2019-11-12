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

## Take note
* If the `imageUrl` value in a sprite sheet `.json` file is a path, it will be treted as an app root relative path on the server.
* Creating a new sprite sheet with `sprite-tool` will embed the image's base64 data in the `.json` file.
* If a sprite sheet was loaded into `sprite-tool` with a path `imageUrl`, the path will be preseved on export.  Likewise, embedded data will be preserved.
* Export functionality is currently restricted to downloading the file to your browser's downloads folder, and possibly changing the name (e.g. appending '(1)').  Sprite sheets created with the tool must be moved, and possibly renamed before they can be used with the engine.

&nbsp;

# TODO:
### (Scheduled for v0.5.0)

## sprite-tool

1. (v0.4.1) ~~Implement drag-and-drop `DeleteSprite`.~~
    * ~~add `contextId` to data being transfered~~
    * ~~restrict `drop` event handlers to only act on data a valid `contextId` for the handler~~

2. (v0.4.5) ~~Allow `Save` of an existing sprite to create a new sprite when the name has changed, rather than changing the name of the existing sprite. **Still warn user if it would overwrite an existing sprite!**~~

3. Allow selection of `DefaultSpriteType` (e.g. _"solid"_).

4. (v0.4.4) ~~Change behavior of `Cancel` action when creating a new sprite to do one of the following~~ 
    * ~~return to the previously selected sprite~~
    * ~~hide the `ActiveWorkbench`, like when the `SheetEditor` is first built.~~

    ~~Note: the first option would have to fall back to the second in some scenarios~~

5. (v0.4.1, v0.4.4) ~~Prevent removal/renaming of sprites that are part of an animation in the current `SpriteSheet`.~~

6. (v0.4.2) ~~Replace all js `alert()` and `confirm()` with instances of `Modal`.~~

7. Implement `ExportAs`
    * either add a button that opens a modal allowing user to change the file name (no change required for the sheet dirty indicator), or allow the filename to be editable on `SheetDetails` (requires sheet dirty indicator to be moved to the `SheetEditor` level)

8. (v0.4.6) ~~Adding a palette sprite on animation workbench's playlist should update the playlist's count.~~

9. (v0.4.6) ~~Removing a palette sprite on animation workbench's playlist should update the playlist's count.~~

10. (v0.4.6) ~~Removing a sprite from the `SpriteList` should decrement the count in the panel header.~~

11. (v0.4.3) ~~Mouse event handling on `SpriteIndicator`~~
    * ~~Tiles: click to select (mouse coords. converted to nearest tile index)~~
    * ~~Frames: click to set upper (x,y), or click and drag to set bounding box~~

&nbsp;

# Credit:
[Meth Meth Method](https://www.youtube.com/channel/UC8A0M0eDttdB11MHxX58vXQ) for the game engine.  His [Super Mario Bros in JavaScript](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx) video series was the starting point for the engine, and has been modified very little so far.  The resulting source from that series is [on his github page](https://github.com/meth-meth-method/super-mario).