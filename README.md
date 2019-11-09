# TODO:
### (Scheduled for v0.5.0)

## sprite-tool

1. Implement `DeleteSprite`.
    * drag/drop 
        1. expand current drag/drop functionality, add `allowedDropzones` to data being transfered, and verify `tgt` is in `allowedDropzones`
        2. in `SpriteList`, make `li`s draggable but only add `window` to their `allowedDropzones` list
        3. pass `cb` in transfered data as well, triggered by `drop` handler on `allowedDropzones`

2. Allow `Save` of an existing sprite to create a new sprite when the name has changed, rather than changing the name of the existing sprite. **Still warn user if it would overwrite an existing sprite!**

3. Allow selection of `DefaultSpriteType` (e.g. _"solid"_).

4. Change behavior of `Cancel` action when creating a new sprite to do one of the following 
    * return to the previously selected sprite
    * hide the `ActiveWorkbench`, like when the `SheetEditor` is first built.

    Note: the first option would have to fall back to the second in some scenarios

5. Prevent removal/renaming of sprites that are part of an animation in the current `SpriteSheet`.

6. Replace all js `alert()` and `confirm()` with instances of `Modal`