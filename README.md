## Supercharged Links

This plugin allows you to style the links in your Obsidian vault based on your notes metadata!
You can, for example, automatically add colors and emojis to the links:

<img src=https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-workspace.png alt="drawing" style="width:600px;"/>

Why is this useful?
Let's take an example, where the notes in your vault represent something, like a paper, a location, a person or a day in the week. Then you can use Supercharged links to make sure that those different links stand out. Another use case might be to give notes with the `#todo` tag a loud color.
This visual feedback helps you find the right link back quickly!


Now how does this work? The plugin adds CSS attributes to the links.
Those attributes will be based on the tags, frontmatter and Dataview inline links in your notes.
Combined with css snippets, you will have full control over customizing your links! 
It supports note preview, live preview (!), backlinks panel, the file browser, the search panel, and supports the Breadcrumbs plugin.


It also adds context menu items to modifiy target note's frontmatter properties and "inline fields" (dataview syntax) by right-clicking on the link
The preset values for those properties can be managed globally in the plugin's settings or on a file-by-file basis thanks to fileClass definition (see section 4)

<img src=https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/e147ac10179d2c351d9a9f222e4637ee7fe32aed/images/superchargeLink.gif alt="drawing" style="width:600px;"/>

## Basic link styling

The plugin scans your workspace to find links to your files. For each of those links, it will use the front-matter and tags, and adds them as CSS attributes to the html element of the link. 

This might sound a bit complicated! So let's break it down step by step :)

### Front-matter

The front-matter section is an optional section of your note written in Yaml. It can be used to add meta-data to your notes.
For documentation, see https://help.obsidian.md/Advanced+topics/YAML+front+matter

Let's say I have a note about Jim : Jim.md

```md
---
next-actions: [👥, ☎️, 🍻, say hi]
age: 42
---

Jim is one of my colleagues

#person

```

I want to have a specific display of the places in Obsidian that link to Jim's note. In particular, I wantjk to display a blue tag-like rounded rectangle <img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/simple-styling.png" style="height:30px;vertical-align:bottom">  and display <img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/simple-styling-hover.png" style="height:30px;vertical-align:bottom">  when hovering the link

### Plugin settings

First, you have to tell the plugin what front-matter properties you want your internal-link to be supercharged with in the `Target Attributes for Styling` section of the plugin's settings.

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-settings.png" alt="drawing" style="width:400px;"/>

So in this case the plugin will only include `category` and `next-actions` and `tags` in the internal-links.

You can choose not to search for Dataview inline fields, which will improve performance if you are not using those.

By default, it will also add the tags in your note as a property.

### Supercharged links!

When a file is opened or when one of the files of your vault has changed, the plugin is "supercharging" all internal links with the front-matter properties set previously. This only happens if these properties are present in the file targeted by the link.

Let's say that I have a file daily.md like this:

Daily.md

```md
[[Jim]] will be organizing the weekly steering committee
```

Without the plugin activated, the HTML link element would normally look like this: 

```
<a data-href="Jim" href="Jim" class="internal-link" target="_blank" rel="noopener">Jim</a>
```

This does not give any information about what is in the Jim.md note! So, we wouldn't be able to customize it.

That's where the plugin comes in: it will add two extra properties in the `<a>` element : `data-link-next-actions` and `data-link-tags`. `data-link-tags` is a special property, which will also include tags like `#person` that might be in your file. 

**Importantly**, the plugin adds these properties by prefixing them with `data-link` so that it will not conflict with other attributes in other plugins or Obsidian itself.

So... with the plugin activated the `<a>`element will be supercharged like this: `<a data-href="Jim" href="Jim" class="internal-link" target="_blank" rel="noopener" data-link-next-actions="👥 ☎️ 🍻 say hi" data-link-tags="#person" >Jim</a>`

Although `category` is included in settings as a property to track, since it's not included in Jim.md front-matter section, the property `data-link-category` is not included in the `<a>` element

### Style your links with CSS!

Now you can enjoy the flexibilty of css to customize your links by setting CSS properties in a CSS snippet like `links.css`. To create a CSS snippet, go to the Obsidian settings, then to Appearance and scroll to the CSS snippets section. Click on the little folder icon, then create a new file in the opened folder called `links.css`. 

#### Examples

To change the color of every appearance of a link to a note based on the tag in the file:

```css
[data-link-tags*="#topic" i]{
    color: #ff6600 !important;
}
```
This will target all HTML elements that contain the `data-link-tags` property, that is, all supercharged links.

To put a fancy 👤 emoji before the name of each link to a "category: people" note:
```css
.data-link-icon[data-link-category$="People" i]::before{
    content: "👤 "
}
```
<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-in-note.png" style="width:500px">

Selecting specifically `.data-link-icon` is required to prevent bugs in Live Preview.

To highlight the link in a tag-like blue rounded rectangle when there is a property next-actions in the target file:

```css
:not(:empty)[data-link-next-actions]{
    color: white;
    background-color: rgb(29, 29, 129);
    border-radius: 18px;
    padding: 5px 15px;
}
```



<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-tag-in-note.png" style="width:500px">

This will only change this in the preview view, because we are explicitly targetting `a.internal-link`.

To display the value of the next actions property at the target file,  whenever you hover on the link:

```css
a.internal-link[data-link-next-actions]:hover::after{
    content: " ► "attr(data-link-next-actions)
}
```

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-hover-in-note.png" style="width:500px">

A small caveat: `::after` may not be completely supported in Live Preview!

To hide the display of links with the tag #hide from your notes (that is, from preview mode and live preview):
```css
a.internal-link[data-link-tags *="hide"],
.cm-hmd-internal-link > [data-link-tags *="hide"]{
    visibility: hidden !important;
    display: none;
}

```


### Demos 

#### Live Preview
<img src="https://i.imgur.com/8VJm1TJ.gif" style="width:500px">

#### Internal link simple styling
https://youtu.be/tyEdsmAQb_4

#### Multiple properties
https://youtu.be/Ofm6gIRP-7o

#### Multiple values for a property
https://youtu.be/aaSZnkEuH4w

### Supported plugins
Core plugins:
- Backlinks
- Outgoing links
- Search
- Starred files
- Quick Switcher

Community plugins:
- Breadcrumbs
- Graph Analysis
- Recent files
- Quicker Switcher++
- Another Quick Switcher

Want support for another plugin? Create an issue here in the repo!

## Link context menu extra options

Right click on a link will automatically display an item per target note's frontmatter property and "inline fields" (dataview syntax)

these options are accessible from:
- the context menu of a link, 
- the context menu of a calendar day, 
- the context menu of a file in the file explorer,
- the "more options" menu of a file
- the command palette "Cmd+P" or by typing the hotkey Alt+O (can be customized in hotkeys settings) 

### Update text property

1. Right-click on the link
1. Click on "Update .... " to change the property's value
1. Change the value in the modal's prompt
1. Type `enter` to save or click X or `esc` to cancel

demo: 
https://youtu.be/qhtPKstdnhI

### Update boolean property

1. Right-click on the link
1. Toggle the swith in the modal to change the value 
1. Press `esc` to leave the modal

demo: 
https://youtu.be/iwL-HqvoNOs

### Update multiple values property

1. Right-click on the link
1. Change values comma-separated
1. Press `enter`, the values will be displayed as an array of values in the target note's frontmatter property

**this doesn't work with indented lists YAML format**

demo:
https://youtu.be/WaW6xElq0T4

### Preset values for property

1. Add a new Property Manager in the settings
2. Enter the property name
3. Add preset values (you can order them once the property has been created)

Back in a note Right-click on the link

4. Click on "Update .... " to change the property's value
5. The modal will display a dropdown list with preset values
6. Change the value in the modal's dropdown
7. Click on the save button to save or click X or `esc` to cancel

demo:
https://youtu.be/GryvvJ6qIg4

### Multi select preset values for property

1. In the settings, follow the steps 1 to 3 of previous section
2. Toggle the `isMulti` switch

Back in a note Right-click on the link

3. Click on "Update .... " to change the property's value
4. The modal will display a grid of switches for preset values
5. Change the values by toggling the switches in the modal
6. Click on the save button to save or click X or `esc` to cancel

demo:
https://youtu.be/iyIG6LmCcuc

### Cycle through preset values

1. In the settings, follow the steps 1 to 3 of previous section
2. Toggle the `isCycle` switch

Back in a note Right-click on the link

3. Click on " .. > .. " to change the property's value for the next one in the settings list

demo:
https://youtu.be/7BqG4sG15jc

### Add a new property at section

1. Right-click on the link
2. Click on "Add field at section"
3. Select the line in the target file where you want to insert the new field
4. Select the field
5. Select/input the value for this field (if the field has preset values, you will be prompted to choose one)

demo:
https://youtu.be/JYURK2CM3Es

## Manage Authorized / Ignored fields

### Disable field options in context menu

In the settings

1. toggle "display field option in context menu"
If toggled on, the context menu will include field options
If toggled off, the context menu wont include field options

demo:
https://youtu.be/PC3MC0CfG0E

### Ignore fields globally

In the settings

1. Add the fields you don't want to see in your context menu, comma separated

demo:
https://youtu.be/eFkxECqBvvY

## Manage preset values based on the context of a file (fileClass)

### Define a class for a file and authorized fields for this class

a class file is basically a simple note
the name of the file will be the name of the class
the lines of the file will be the fields managed for this class

1. Define the folder where you want to store your class files
2. Create a note in this folder, let's say `music.md`, containing lines with the name of fields that you want to manage for this class
```md
music.md
=========
genre
difficulty
artist
tone
```
3. In a regular note, let's say `Black Dog.md`, insert a frontmatter field named `fileClass`
4. The value of `fileClass` has to be the name of the file Class where you have the fields that you want to manage for this note. e.g in our case
```yaml
---
fileClass: music
---
```
5. when right-clicking on a link to `Black Dog.md`, the fields in the context menu will be filter to show only the ones that are also included in `music.md`

demo:
https://youtu.be/Av7DeYZILUk

### Define preset values for a class

You can specify the type of an attribute in a fileClass, and its options. Type and Options are called "attributes settings"

Type can be one of:
- "input" (default) : this field can take any value
- "select" : this field can take one value out of a list of items preset in options (see below)
- "multi" : this field can take 0,1 or multiple values out of a list of items preset in options (see below)
- "cycle" : this field can take one value that can "progress" within a list of items preset in options (see below)

Options is an array of options

An attribute settings is written in JSON and must be written as a value of and "inline (dataview) field"

example: Say you want to set "genre" attribute in `music.md` fileClass as a "multi" with "rock", "pop" and "jazz" as options, and you want to set "difficulty", "artist" and "tone" as fields that can take any value, your `music.md` will look like this:

```md
music.md
=========
genre:: {"type":"multi", "options":["rock", "pop", "jazz"]}
difficulty
artist
tone
```

NB: "input" type attributes dont need a setting, leaving the name of the attribute only will categorize this attribute automatically as an "input" type.

Because it can be overwhelming to remember this syntax, you can manage "type" and "options" for each fields from:
- the context menu of a note that has this fileClass as a frontmatter's fileClass attribute : click on [`⚙️ Manage <music> fields`] for `music.md` from any file with `fileClass: music` set in frontmatter
- the more-options menu of a fileClass file
- a command within a fileClass file (`alt+P`)

demo:
https://youtu.be/U0Bo_x1B2TM

## 5. Roadmap

- [x] link context menu to modify frontmatter attributes
- [ ] manage indented lists multi-values frontmatter property
- [x] extend options management to iinline-fields
- [x] fileClass fields types and validators
