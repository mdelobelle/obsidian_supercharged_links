## Obsidian Internal Links supercharger

Internal links adds attributes to <a.internal-link> HTMLElements with the attributes and values of the target file's frontmatter.
Combined with css snippets, it allows a very flexible way to customize the links

![](https://github.com/mdelobelle/obsidian_supercharged_links/blob/master/images/superchargeLink.gif)

### Usage

Set the targetted frontmatter attributes in the settings of the plugin "Internal Links", comma separated.

Then, adding a frontmatter key: value in a note automatically adds the key as a new attribute to the a.internal-link HTMLElements linking to this note.
This works only if the value of the frontmatter attribute is a string

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
will result in a "supercharged" a.internal-link HTMLElement `<a data-href="target" href="target" class="internal-link" target="_blank" rel="noopener" foo="bar">target</a>`

Therefore you can customize this type of links with custom css
e.g.
```css
a.internal-link[foo="bar"]{
    text-decoration: none
}
```

### Roadmap

- [ ] enable translating of array in frontmatter with comma separated values in an attribute
