# HTML Image Render API

This is a small Node.js API endpoint to transform `html + css` into a dynamic image you can customize with query parameters.

Pairs well with https://jspen.co/ -- a Codepen-like REPL for HTML / CSS / JS.

## How it Works

Start with an HTML / CSS template (whatever you like):

**HTML**
```html
<div class="mustache">
    <div>
        <h1>{{title}}</h1>
    </div>
    <div>
        <h3>{{subtitle}}</h3>
    </div>
</div>
```

**CSS**
```css
body { 
  font-family: sans-serif; 
  text-align: center; 
  height: 500px;
  width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
}

h1, h3 { 
    display: inline;
    padding: 5px 15px; 
    background: yellow; 
    color: #222;
    line-height: 2;
}

h3 { margin-bottom: 0; }
```

You should add the `.mustache` class to the outermost element that includes mustache template. The data to back this template will come from the query parameters in the URL for the dynamic image.

Then you make a **request** to this API endpoint to get an **image URL**, like:

```js
$.post('http://localhost:5000/img', 
  { 
    html: `<div class="mustache">...`, 
    css: `body { ...`, 
    width: 500, 
    height: 500 
  }, console.log);
```

This package will then generate a key like `ca6407db1a15ea42f90d33eb9b5e1669`, and a dynamic Image URL, like: `http://localhost:5000/img/ca6407db1a15ea42f90d33eb9b5e1669.png?width=500&height=500`.

This Image URL is a dynamic image, which can be manipulated with query parameters, like this:

localhost:5000/img/ca6407db1a15ea42f90d33eb9b5e1669.png?width=500&height=500&**title=Here, we have a full line or two of text, like a tweet&subtitle=- by @author_name**

(You should use `encodeURIComponent()` for the params you add, though)

This will generate an image with some custom text, like the one below:

![Example image](./example.png)


# Installation / Setup

Install with `npm install` & run with `npm start`. 

### Dotenv template

You will need to set some configuration in a dotenv file to run locally, and set up environment variables to run in production.

```
THUM_IO_AUTH_KEY='xxxxx-xxx-xxxxxx-xxxx'
SERVER_URL='http://localhost:5000'
port=5000
debug=0
```
