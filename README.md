## Obsidian Internal Links supercharger

Internal links adds attributes to <a.internal-link> HTMLElements with the attributes and values of the target file's frontmatter.
Combined with css snippets, it allows a very flexible way to customize the links

It also adds context menu items to modifiy target note's frontmatter properties by right-clicking on the link

<img src=https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/e147ac10179d2c351d9a9f222e4637ee7fe32aed/images/superchargeLink.gif alt="drawing" style="width:600px;"/>

## Basic link styling

The plugin basically scans the target file of each internal link of the files that are currently opened in your workspace.

It gathers some specific front-matter properties and includes them in the html element of the link, with the value of the property contained in the target note's front matter section.

Complicated 😰.... let's break it down step by step

### Front-matter

As a reminder, front-matter section is an optional section of your note written in Yaml. 
Here is the documentation about front-matter on Obsidian help website https://help.obsidian.md/Advanced+topics/YAML+front+matter

Let's say I have a note about Jim : Jim.md

```md
---
category: people
next-actions: [👥, ☎️, 🍻, say hi]
age: 42
---

Jim is one of my colleagues

```

Let's say that I want to have a specific display of the internal-links linking to Jim's note to display a blue tag-like rounded rectangle <img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/simple-styling.png" style="height:30px;vertical-align:bottom">  and display <img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/simple-styling-hover.png" style="height:30px;vertical-align:bottom">  when hovering the link

### Settings

First you'll have to tell the plugin which front-matter kind of properties you want your internal-link to be supercharged with in the `Target Attributes for Styling` section of the plugin's settings

here are my settings

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-settings.png" alt="drawing" style="width:400px;"/>

So in this case the plugin will only include `category`, `next-actions` and `tags` in the internal-links

### a.internal-links

When a file is opened or when one of the files of your vault has changed, the plugin is "supercharging" all internal-links with the front-matter properties set in the settings, if there are such properties in the file targeted by the link.

Let's say that I have a file daily.md like this:

Daily.md

```md
[[Jim]] will be organizing the weekly steering committee
```

Without the plugin activated, the html link element would normally look like this: 

```
<a data-href="Jim" href="Jim" class="internal-link" target="_blank" rel="noopener">Jim</a>
```

You wouldn't really know anything about Jim.md's specificity here and therefore wouldn't be able to customize it a lot.

That's where the plugin comes in: it will add two extra properties in the `<a>` element : `category` and `next-actions`. 
Since `tags` is not existing in Jim.md front-matter section, it won't be included.

**heads-up** the plugin is not adding directly `category` and `next-actions` property. Instead, it will prefix them with `data-link` in order not to potentially conflict with other attribute management ssystem made by other plugins or Obsidian itself.

So... with the plugin activated the `<a>`element will be supercharged like this: `<a data-href="Jim" href="Jim" class="internal-link" target="_blank" rel="noopener" data-link-category="people" data-link-next-actions="👥 ☎️ 🍻 say hi">Jim</a>`

As you can see, even if `tags` is included in settings as a property to track, since it's not included in Jim.md front-matter section, the property `data-link-tags` isn't included in the `<a>` element

### css

Now you can enjoy the flexibilty of css to customize your links by setting css properties in a snippet like `links.css`

exemple: 

to put a fancy 👤 emoji before the name of each link to a "category: people" note:
```css
a.internal-link[data-link-category$="People" i]::before{
    content: "👤 "
}
```
<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-in-note.png" style="width:500px">

to highlight the link in a tag-like blue rounded rectangle when there is a property next-actions in the target file:

```css
a.internal-link[data-link-next-actions]{
    color: white;
    background-color: rgb(29, 29, 129);
    border-radius: 18px;
    padding: 5px 15px;
}
```

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-tag-in-note.png" style="width:500px">

to display the next actions contained in the next-actions property of the target file when hovering the link:

```css
a.internal-link[data-link-next-actions]:hover::after{
    content: " ► "attr(data-link-next-actions)
}
```

<img src="https://raw.githubusercontent.com/mdelobelle/obsidian_supercharged_links/master/images/link-styling-hover-in-note.png" style="width:500px">

### Some videos examples

#### Internal link simple styling
https://youtu.be/tyEdsmAQb_4

#### Multiple properties
https://youtu.be/Ofm6gIRP-7o

#### Multiple values for a preperty
https://youtu.be/aaSZnkEuH4w

## Link context menu extra options

Right click on a link will automatically display an item per target note's frontmatter property

### Update text property

1. Right-click on the link
1. Click on "Update .... " to change the property's value
1. Change the value in the modal's prompt
1. Type `enter` to save or click X or `esc` to cancel

example: 
https://youtu.be/qhtPKstdnhI

### Update boolean property

1. Right-click on the link
1. Toggle the swith in the modal to change the value 
1. Press `esc` to leave the modal

example: 
https://youtu.be/iwL-HqvoNOs

### Update multiple values property

1. Right-click on the link
1. Change values comma-separated
1. 1. Press `enter`, the values will be displayed as an array of values in the target note's frontmatter property

**this doesn't work with indented lists YAML format**

example:
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

example:
https://youtu.be/GryvvJ6qIg4

### Multi select preset values for property

1. In the settings, follow the steps 1 to 3 of previous section
2. Toggle the `isMulti` switch

Back in a note Right-click on the link

3. Click on "Update .... " to change the property's value
4. The modal will display a grid of switches for preset values
5. Change the values by toggling the switches in the modal
6. Click on the save button to save or click X or `esc` to cancel

example:
https://youtu.be/iyIG6LmCcuc

### Cycle through preset values

1. In the settings, follow the steps 1 to 3 of previous section
2. Toggle the `isCycle` switch

Back in a note Right-click on the link

3. Click on " .. > .. " to change the property's value for the next one in the settings list

example:
https://youtu.be/7BqG4sG15jc

## Roadmap

- [X] link context menu to modify frontmatter attributes
- [ ] manage indented lists multi-values frontmatter property
- [ ] extend options management to iinline-fields
