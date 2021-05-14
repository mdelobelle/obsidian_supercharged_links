## Obsidian Internal Links supercharger

Internal links adds attributes to <a.internal-link> HTMLElements with the attributes and values of the target file's frontmatter.
Combined with css snippets, it allows a very flexible way to customize the links

![](https://github.com/mdelobelle/obsidian_supercharged_links/blob/master/images/superchargeLink.gif)

### Usage

Set the targetted frontmatter attributes in the settings of the plugin "Internal Links", comma separated.

Then, adding a frontmatter key: value in a note automatically adds the key as a new attribute to the a.internal-link HTMLElements linking to this note.
This works only if the value of the frontmatter attribute is a string, an array, a number or a boolean

#### Example 1 : catch a specific value of a defined property

in target.md
```
---
foo: bar
---
```

in note.md when including a link to target like this:
```
### Some cool stuff about [[target]]
```
will result in a "supercharged" a.internal-link HTMLElement with new properties prefixed with `data-link-`: `<a data-href="target" href="target" class="internal-link" target="_blank" rel="noopener" data-link-foo="bar">target</a>`

Therefore you can customize this type of links with custom css
e.g.
```css
a.internal-link[data-link-foo~="bar"]{
    text-decoration: none
}
```

#### Example 2 : display values of front-matter attributes when hovering the link

in target.md
```
---
next-actions: [👥, ☎️, 🍻, say hello]
---

```

in note.md when including a link to target like this:
```
### Some cool stuff about [[target]]
```
will result in a "supercharged" a.internal-link HTMLElement with new properties prefixed with `data-link-`: `<a data-href="target" href="target" class="internal-link" target="_blank" rel="noopener" data-link-next-actions="">target</a>`

Therefore you can customize this type of links with custom css
e.g.
```css
a.internal-link[data-link-next-actions]{
    color: white;
    background-color: rgb(29, 29, 129);
    border-radius: 18px;
    padding: 5px 15px;
}

a.internal-link[data-link-next-actions]:hover:after{
    content: " ► "attr(data-link-next-actions)
}
```

The link will be diplayed as a blue tag-like rounded rectangle <span style="color: white; background-color: rgb(29, 29, 129); border-radius: 18px; padding: 5px 15px;">Jim</span> and it will display <span style="color: white; background-color: rgb(29, 29, 129); border-radius: 18px; padding: 5px 15px;">Jim ► 👥 ☎️ 🍻 say hello</span> when hovering the link : 

### Roadmap

- [ ] enable translating of array in frontmatter with comma separated values in an attribute
