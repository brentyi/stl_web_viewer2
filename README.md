# stl_web_viewer2

Friendly utility for embedding 3D models into webpages.

Basically the same as the [original](https://github.com/brentyi/stl_web_viewer), but with less nodejs nonsense.

### Usage:

```html
<!doctype html>
<html>
  <head>
    <script src="https://code.jquery.com/jquery-1.12.4.min.js" integrity="sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/106/three.min.js" integrity="sha256-tAVw6WRAXc3td2Esrjd28l54s3P2y7CDFu1271mu5LE=" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://brentyi.github.io/stl_web_viewer2/build/stlwebviewer2.css" />
  </head>
  <body>
    <div class="stlwv2-model" data-model-url="models/planet_gear.stl"></div>
    <script src="https://brentyi.github.io/stl_web_viewer2/build/stlwebviewer2.js"></script>
  </body>
</html>
```
