---
title: 深入理解viewport
date: 2020-01-28 14:32:03
categories:
tags:
---
```js
screen.width && screen.height //设备尺寸

window.innerWidth && window.innerHeight //浏览器CSS像素（CSS pixels），包括滚动条

window.pageXOffset && window.pageYOffset //浏览器滚动CSS像素

document.documentElement.clientWidth && document.documentElement.clientWidth //viewport尺寸，不包括滚动条

document.documentElement.offsetWidth && document.documentElement.offsetHeight //html尺寸

pageX && pageY //鼠标相对html的位置

clientX && clientY //鼠标相对viewport的位置

screenX && screenY //鼠标相对设备的位置
```

```js
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" >
```