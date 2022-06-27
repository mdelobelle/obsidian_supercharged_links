## Supercharged Links

This plugin allows you to style the links in your Obsidian vault based on your notes metadata!
You can, for example, automatically add colors and emojis to the links:

<img src=https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/overview-screenshot.png alt="drawing" style="width:700px;"/>

Why is this useful?
For example, when your notes represent something, like a paper, a location, a person or a day in the week. Then you can use Supercharged links to have those notes stand out. Another use case might be to give notes with the `#todo` tag a loud color.
This visual feedback helps you find the right note back quickly!

Setting Supercharged Links up is easier than ever now with the [Style Settings Plugin](https://github.com/mgmeyers/obsidian-style-settings)! See down below for a tutorial to get started. 

## Getting started
Let's say I have a note about Jim called `Jim.md` with the tag `#person` and some [YAML frontmatter](https://help.obsidian.md/Advanced+topics/YAML+front+matter). 

```md
---
status: call soon
age: 42
---

Jim is one of my colleagues

#person

```

I want to change what links to Jim's note look like. In particular, I want links to persons to have a blue background, and I want persons I have to call to have a telephone emoji ☎️  in front: <img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/phone-jim.png" style="height:30px;vertical-align:bottom">.
### Setting up the plugin
Time to set up the plugin to get this work! Let's go to the plugin settings.
First, you have to tell the plugin what front-matter attributes to include for your styling in the `Target Attributes for Styling` option on top. Let's add `status` here, which indicates whether we need to call Jim!

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/target-status.png" alt="drawing" style="width:500px;"/>

Next, we have to tell the plugin to look for notes with the tag `#person`. In the settings, under the Styling header, create a new selector. Under types of selector, select "Tag", and add `person` down below:


<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/tag-person.png" alt="drawing" style="width:700px;"/>

We also want to add an emoji when notes have `call soon` as its `status`. We will tell the plugin to look for the attribute `status`, and that its value should be `call soon`. Note that this will also look for [inline fields called status from DataView](https://blacksmithgu.github.io/obsidian-dataview/data-annotation/). 

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/call-soon.png" alt="drawing" style="width:700px;"/>

One important setting for our use case is that we only enable the "Add content before link" option under "Style options", since otherwise this style would override the one from the tag `#person`! 

In addition to styling based on attributes or tags, we can also style notes based on their 'path' (which includes its name, folders and extension). For example, we can style all notes in the folder `dailies`. Make sure to select 'Contains value' under match here instead of 'Exact match':

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/path-dailies.png" alt="drawing" style="width:700px;"/>

### Time to style!
First, make sure you have the [Style Settings Plugin](https://github.com/mgmeyers/obsidian-style-settings) installed and enabled. Then, under settings, navigate to the settings of Style Settings. Now we are ready to style our links! Let's start with setting up our style for notes with the tag `#person`. We will use a white text color, enable the background, and use a nice blue background there. 

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/style-person.png" alt="drawing" style="width:700px;"/>

Next, let's add emoji's before notes with the call soon status. All we have to do here is copy the ☎️ into the text area "Prepend text".

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/style-call-soon.png" alt="drawing" style="width:700px;"/>

And voila!

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/result-call-jim.png" alt="drawing" style="width:700px;"/>


## Advanced use
While the Style Settings integration provides a huge amount of customizability options, if you are comfortable with CSS and HTML, you can go even further with styling your links. For that, let's explain what this plugin does in the background.

Let's say I have some link to `[[Jim]]` somewhere.
Without the plugin activated, the HTML link element would normally look like this: 

```
<a data-href="Jim" href="Jim" class="internal-link" target="_blank" rel="noopener">Jim</a>
```

This does not give any information about what is in the Jim.md note! So, we wouldn't be able to customize it.

That's where this plugin comes in: it will add two extra properties in the `<a>` element : `data-link-status` and `data-link-tags`. **Importantly**, these attributes are prefixed with `data-link` so that it will not conflict with other attributes in Obsidian.

With the plugin active, the `<a>`element will be supercharged like this: 

```
<a data-href="Jim" href="Jim" class="internal-link data-link-text data-link-icon data-link-icon-after" target="_blank" rel="noopener" data-link-status="call soon" data-link-tags="#person" >Jim</a>
```

### Style your links with CSS!

You can use the flexibility of CSS to customize your links by setting CSS properties in a CSS snippet like `links.css`. To create a CSS snippet, go to the Obsidian settings, then to Appearance and scroll to the CSS snippets section. Click on the little folder icon, then create a new file in the opened folder called `links.css`. 

#### Example CSS snippets

To change the color of every appearance of a link to a note based on the tag in the file:

```css
[data-link-tags*="#topic" i]{
    color: #ff6600 !important;
}
```
This will target all HTML elements that contain the `data-link-tags` property, that is, all supercharged links.

To put a 👤 emoji before the name of each link to a "category: people" note:
```css
.data-link-icon[data-link-category$="People" i]::before{
    content: "👤 "
}
```
<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-in-note.png" style="width:500px">

Selecting specifically `.data-link-icon` is required to prevent bugs in Live Preview.

To highlight the link in a tag-like blue rounded rectangle when the property `status` is in the note:

```css
:not(:empty)[data-link-next-status] {
    color: white;
    background-color: rgb(29, 29, 129);
    border-radius: 18px;
    padding: 5px 15px;
}
```


<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-tag-in-note.png" style="width:500px">

To display the value of the `status` property at the target file, but _only_ whenever you hover on the link:

```css
.data-link-icon-after[data-link-status]:hover::after{
    content: " ► "attr(data-link-status)
}
```

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-hover-in-note.png" style="width:500px">


To hide the display of links with the tag #hide from your notes (that is, from preview mode and live preview):
```css
a.internal-link[data-link-tags *="hide"],
.cm-hmd-internal-link > [data-link-tags *="hide"]{
    visibility: hidden !important;
    display: none;
}

```


### Demos 
NOTE: These demos are somewhat outdated.
#### Live Preview
<img src="https://i.imgur.com/8VJm1TJ.gif" style="width:500px">

#### Internal link simple styling
https://youtu.be/tyEdsmAQb_4

#### Multiple properties
https://youtu.be/Ofm6gIRP-7o

#### Multiple values for a property
https://youtu.be/aaSZnkEuH4w

### Supported plugins
Live preview, source view, reading mode and the file browser are fully supported in core Obsidian. Other plugins are also supported, as listed below:

Core plugins:
- Backlinks (including Backlinks in edit mode)
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
- Dataview (inline fields)
- Omnisearch

Want support for another plugin? Create an issue here in the repo!

## Link context menu extra options
This plugin also adds context menu items to modifiy target note's frontmatter properties and "inline fields" (dataview syntax) by right-clicking on the link
The preset values for those properties can be managed globally in the plugin's settings or on a file-by-file basis thanks to fileClass definition (see section 4)

<img src=https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/e147ac10179d2c351d9a9f222e4637ee7fe32aed/images/superchargeLink.gif alt="drawing" style="width:600px;"/>


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

## Roadmap
- [ ] manage indented lists multi-values frontmatter property
