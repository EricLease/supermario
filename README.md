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

# Interpolation Support (<small>`mControl`</small>)

## <table style='margin:auto;'><tr><td><code>{{ [id][:cmd[:args]] }}</code></td></tr></table>

* `id` (optional)
    - string value that can be used as a standalone DOM element id
    - will be used as the basis for constructing ids in some situations 
    - uniqueness will be guaranteed if the element is cloned (e.g. for repeat)
* `cmd` (optional)
    - command to perform on the DOM element
    - currently supported commands: [ `'repeat'` ]
* `args` (conditionally required)
    - see individual commands for more information

## Child binding:

During interpolation, any element containing a valid interpolation string with a binding `id` will be added to the `mControl.children` collection.  The exact location within this collection will vary based on nesting within the document, `repeat` commands, and other factors.  In the simplest scenario, adding an interpolation string with only a binding `id` to a DOM element will allow that DOM element to be accessed as a direct descendant of `mControl.children`.

```html
<!-- myControl.html -->
<span {{mySpan}}>Hi</span>`
```

```javascript
// my-control.js
import mControl from './js/map-editor/m-control.js';

export default class myControl extends mControl {
    constructor() {
        super('myControl');
    }

    bind() {
        // override bind to setup event handlers and modify DOM
        // interpolation has taken place at this point...
        this.children.mySpan.innerText = 'Hello there';
    }
 }
```

```javascript
// app.js
import myControl from './my-control.js';

const ctl = new myControl();

await ctl.load();

console.log(ctl.children.mySpan.innerText);
```

&nbsp;

## Commands

### <table style="width:100%"><tr><td style="float:left">`repeat`</td><td style="float:right">{{ `[id]:repeat:cnt` }}</td></tr></table>
---
Treat the DOM element as a template.  Replace the template with `cnt` clones of the template.  If the binding `id` is specified, each of the clones will have an index appended to its `id`.

Applying the `repeat` command to an element with a binding `id` will cause it to become the context of descendants with binding `id`s.  Take the following example:

```html
<div {{main}}>
    <ul {{child:repeat:2}}>
        <li>
            <a {{myLink}} href="#">Home</a>
        </li>
    </ul>
</div>
```

The generated markup will look similar to the following:

<small>(guids omitted for brevity)</small>

```html
<div id="main">
    <ul id="child_0">
        <li>
            <a id="child_0_myLink" href="#">Home</a>
        </li>
    </ul>
    <ul id="child_1">
        <li>
            <a id="child_1_myLink" href="#">Home</a>
        </li>
    </ul>
</div>
```

The corresponding `mControl.children` collection will be as follows:

```
mControl.children.main === <div id="main"...>
mControl.children.child: [
    0: {
        <ul id="child_0" ...>
        myLink: <a id="child_0_myLink" ...>
    },
    1: {
        <ul id="child_1" ...>
        myLink: <a id="child_1_myLink" ...>
    }
]
```

The structure is flattened whenever possible, such that the `ul` DOM elements are actually merged with the `myLink` variables in the `child` array above.  Therefore, the first occurrence of `myLink` can be accessed as `mControl.children.child[0].myLink`.

When a binding `id` is present under a repeated element without a binding `id`, the element with the binding `id` is translated into a multi-dimensional array of elements on the current `mControl.children` collection's current context.  Taking the previous example, and removing the binding `id` _"child"_, the resulting markup will be as follows:

```html
<div id="main">
    <ul>
        <li>
            <a id="_0_myLink" href="#">Home</a>
        </li>
    </ul>
    <ul>
        <li>
            <a id="_1_myLink" href="#">Home</a>
        </li>
    </ul>
</div>
```

After interpolation, the `mControl.children` collection will be as follows:

```
mControl.children.main === <div id="main"...>
mControl.children.myLink: [
    0: <a id="_0_myLink" ...>
    1: <a id="_1_myLink" ...>
]
```

And the first link would be accessed as, `mControl.children.myLink[0]`.

&nbsp;

# Credit:
[Meth Meth Method](https://www.youtube.com/channel/UC8A0M0eDttdB11MHxX58vXQ) for the game engine.  His [Super Mario Bros in JavaScript](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx) video series was the starting point for the engine, and has been modified very little so far.  The resulting source from that series is [on his github page](https://github.com/meth-meth-method/super-mario).