---
title: webpack深入与实战
date: 2020-01-28 14:31:44
categories:
tags:
---
##webpack深入与实战
#### 一、webpack的安装
1. 创建项目根目录文件夹，`npm init`，一路按回车键，初始化文件夹，此时生成默认package.json文件；
2. `npm install webpack --save-dev -g`，安装webpack;此时有可能会报一下错误：
```js
npm ERR! code ENOSELF
npm ERR! Refusing to install package with name "webpack" under a package
npm ERR! also called "webpack". Did you name your project the same
npm ERR! as the dependency you're installing?
```
则表示项目名称与webpack冲突，只需重新npm init,回车到`package name`的时候，输入其他的名称即可；
3. 此时目录下有`node_modules`、`package.json`、`package-lock`三个文件，则安装成功；
4. `webpack hello.js hello.bundle.js`,即可成功开始编译文件；注如果提示=='webpack' 不是内部或外部命令，也不是可运行的程序==，则环境变量配置有问题，全局安装即可；


#### 二、webpack实例入门
###### 1，js中引入js文件
在根目录文件夹下，创建`hello.js`与`world.js`文件，在前者中引入后者，如图：
```js
require("./world.js");
function hello (){
	alert("hello")
}
```
运行`webpack hello.js hello.bundle.js`命令，即可发现根目录下生成`hello.bundle.js`文件；里面代码截图如下：
```js
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {
	__webpack_require__(1);
	//require("css-loader!./style.css");
	function hello (){
		alert("hello")
	}
/***/ },
/* 1 */
/***/ function(module, exports) {
	function world(){
		return {
			name:"hhh"
		}
	}
/***/ }
/******/ ]);
```
######2、js文件中引入css文件
引入css文件不同于引入js，引入前需要安装相关的`loader`，否则回报错，如图：
```js
ERROR in ./style.css
Module parse failed: C:\Users\haotengfei\Desktop\study\webpack\style.css Unexpected token (1:4)
You may need an appropriate loader to handle this file type.
SyntaxError: Unexpected token (1:4)
    at Parser.pp$4.raise (C:\Users\haotengfei\Desktop\study\webpack\node_modules\acorn\dist\acorn.js:2221:15)
    at Parser.pp.unexpected (C:\Users\haotengfei\Desktop\study\webpack\node_modules\acorn\dist\acorn.js:603:10)
```
根目录下新建一个`style.css`文件，在`hello.js`文件中引入(引入方式也区别于js，注：`css-loader`让webpack可以处理css文件，`style-loader`让打包后的css起作用，插入的html中)：
```js
require("./world.js");
require("style-loader!css-loader!./style.css");
function hello (){
	alert("hello world")
}
hello();
```
先安装相关`loader`，运行`npm install css-loader style-loader --save-dev`；接着运行`webpack hello.js hello.bundle.js`，即可生成新的`hello.bundle.js`文件；如图：
```js
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {
	__webpack_require__(1);
	__webpack_require__(2);
	function hello (){
		alert("hello")
	}
    hello();
/***/ },
/* 1 */
/***/ function(module, exports) {
	function world(){
		return {
			name:"hhh"
		}
	}
/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {
	exports = module.exports = __webpack_require__(3)(false);
	// imports
	// module
	exports.push([module.id, "body{\r\n\tpadding: 0;\r\n\theight: 0;\r\n}", ""]);
	// exports
/***/ },
/* 3 */
/***/ function(module, exports) {
```
######3、这个时候，在根目录创建一个index.html文件，引入打包后的`hello.bundle.js`，即可发现弹窗`hello world`，页面也变红了，即是打包的文件涵括了所有被打包文件的功能作用；
######4、显而易见，每个文件引入css如果都需要指定`style-loader!css-loader!`，文件一多，会变得非常麻烦，此时也可以通过命令行指令，更加快捷的针对文件进行打包，例如上例同样可以这样处理，如图：
```js
require("./world.js");
require("./style.css");
function hello (){
	alert("hello world")
}
hello();
```
运行`webpack hello.js hello.bundle.js --module-bind 'css=style-loader!css-loader'`，也可以正常打包，达到相同的效果；














