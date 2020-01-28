---
title: 菜鸟解读jQuery源码系列-四-遍地黄金的工具函数
date: 2020-01-28 14:32:18
categories:
tags:
---
## 引言 ##
平时写代码是，一些公共的代码是必不可少的，这个时候，每一个成熟的开发者相信都会选择把这类代码抽离出来，成为一个公共的工具函数。这样的好处不言自明，不仅仅显著减少了代码量，还便于管理与优化，避免牵一发而动全身。jQuery库开发版本长达8000多行，里面封装了各种各样的工具函数，今天就让我们来挖掘这块宝藏吧！

## 先睹为快 ##
先看几个常用的小栗子（自行引入jQuery）：
```js
//判断类型
$.type({a:1}); // "object"
$.type($); // "function"
//判断是否是window
$.isWindow(window); // true
//判断是否是纯粹的对象
$.isPlainObject({a:1}); // true
$.isPlainObject([]); // false
```

小伙伴们有没有感到一丝小激动？这些都是开发中常用到的工具函数啊，要是能收为己有，该是一件多么美妙的事情啊！

## 黄金宝藏 ##

#### 判断类型（$.type）

判断一个值或者对象的类型，应该算是开发中最常见的操作之一了，为什么呢？最简单的一个原因是，我们拿到一个对象，肯定不仅仅只是为了拥有它，正所谓爱她就请给她自由；同样的道理，拿到一个对象，更多是要利用它来创造价值啊！

但是，很多时候，我们拿到一个对象时，就像拿着一个潘多拉的盒子，因为我们并不确定它是什么对象，数组？正则？还是仅仅是一个纯对象，这个时候，如果贸然调用某种类型的API，当并不是这个类型的对象时，程序报错也就不可避免了。

##### 数据类型
在说到如何判断类型之前，我们应该先了解一下js的数据类型；最新的 ECMAScript 标准定义了 7 种数据类型:

- **原始类型（基本类型）**:
    Boolean
    Null
    Undefined
    Number
    String
    Symbol (ECMAScript 6 新定义)

- **Object**（引用类型 - - Function Array Date RegExp Object Error Map Set 内置对象）


##### 循规蹈矩的 typeof

typeof 应该是最先想到的方法，而且也确实很好用，先看对**基本类型**值的判断：
```js
typeof true; //"boolean"
typeof 111; // "number"
typeof "a"; // "string"
typeof undefined; // "undefined"
typeof Symbol.for("name"); //"symbol"
//判断基本类型唯一的例外
typeof null; "object"
```
再看typeof对**引用类型**的判断：
```js
typeof [1,2,3]; // "object"
typeof /aa/g ; // "object"
typeof Math ; // "object"
typeof document ; // "object"
//判断引用类型唯一的例外
typeof setTimeout; // "function"
```
从上可以看出，typeof的判断存在许多的问题：

 - 基本类型无法判断出`null`；
 - 引用类型只能判断出`Function`对象，其他引用类型全部判断为`object`;


##### 另辟蹊径的 instanceof
我们先看`instanceof`的含义，`a instanceof A` === "对象a是构造函数A的实例吗"；换一种文明的写法即是： `object instanceof constructor`;

从中可见，当我们想要判断基本类型数据的类型的时候，第一个不需要考虑的就是instanceof方法了，因为它只能用来判断对象的类型。当然，你硬是要用也没关系，只是没啥意义：
```js
1 instanceof Number; // "false"
"aaa" instanceof String; // "false"
true instanceof Boolean; // "false"
//此时报错，因为 undefined 根本不是构造函数
undefined instanceof undefined; // "Uncaught TypeError: Right-hand side of 'instanceof' is not an object"
undefined instanceof {}; //"Right-hand side of 'instanceof' is not callable"
undefined instanceof function(){}; // false
// null 与 undefined 情形类似，请自行测试
```
接下来看 `instanceof` 具体的用法：
```js
({}) instanceof Object; // true, 注意括号；
[] instanceof Array; // true
/aa/g instanceof RegExp; // true
document.getElementsByTagName("body") instanceof HTMLCollection; // true
// ...
```
从上可以了解到，`instanceof` 一般是用来判断某个引用类型对象的类型的。

> instanceof 运算符用来检测 constructor.prototype 是否存在于参数 object 的原型链


##### 无所不能 Object.prototype.toString
每一个数据类型都有自己实现的`toString`方法:
```js
[1,2,3].toString(); // "1,2,3"
/aa/g.toString(); // "/aa/g"
Symbol.for("name").toString(); // "Symbol(name)"
(1).toString(); // "1"
```
从上可看出，基本数据类型与引用数据类型都有自己的一套`toString`方法（当然要排除`undefined`,`null`，因为两者身上根本没有方法），因此我们不能直接通过toString方法得出该数据的类型，那还有没有方法呢？

答案已经在上头啦！正所谓万物皆对象（仅仅口头禅），了解原型链的小伙伴应该都知道，每一个引用类型对象，其实都继承了`Object`构造函数上的原型方法，即使是基本数据类型，也可以通过**包装类型对象**调用相关的方法；换句话说，任何类型数据，都可以调用`Object`构造函数上的原型方法，也就是可以调用`toString`方法；(其实这一段是废话，只是想说明不同原型上的toString方法是不一样的而已)

这个时候，有小伙伴就急了，那`undefined`跟`null`呢？

问得好，这个时候，我们就要注意调用方法的形式了：

```js
 Object.prototype.toString.call(undefined) // "[object Undefined]"
 Object.prototype.toString.call(null) // "[object Null]"
 Object.prototype.toString.call([1,2,3]); // "[object Array]"
 Object.prototype.toString.call(/aa/g); // "[object RegExp]"
 Object.prototype.toString.call(document.getElementsByTagName("body")); // "[object HTMLCollection]"
```
熟悉`call`方法的小伙伴们都知道，`a.call(b)` === "a方法调用啦，不过a方法内的this记得换成b哦！" 这就是为什么说上一段话是废话，因为通过call调用的话，跟是不是原型继承是没一点关系的。这也就是为什么`undefined`跟`null`也能调用了，因为这两者是没有所谓的原型链的。


##### 源码实现
废话说了这么多，有些小伙伴已经急了，“这些别人都写过啦，快说jQuery源码是怎么实现的！”
```js
//代码有稍微的整理
var class2type = {};
//小伙伴可以自行加上Set Map
("Boolean Number String Function Array Date RegExp Object Error").split(" ").forEach(function(item) {
	class2type[ "[object " + item + "]" ] = item.toLowerCase();
});
function type( obj ) {
    if ( obj == null ) {//如果是null，直接返回"null"
        return String( obj );
    }
    //判断是否是引用类型，是则用toString;基本类型则用typeof判断即可
    return typeof obj === "object" || typeof obj === "function" ?
        class2type[ Object.prototype.toString.call(obj) ] || "object" :
        typeof obj;
}
//测试
type([1,2,3]); // "array"
```


#### 判断是否是window对象（isWindow）
jQuery里面判断是否是window对象的源码非常简单：
```js
function isWindow( obj ) {
	//window对象有一个window属性等于自身
    return obj != null && obj === obj.window;
}
```

#### 判断是否是类数组
js中判断数组是非常方便的，jQuery源码判断数组，直接是调用了原生的`isArray`方法：
```js
isArray: Array.isArray,
```
不过在js中还有一种常见的对象- -**类数组**，譬如`arguments`，`HTMLCollection`实例都是类数组对象。下面是jQuery源码的实现：
```js
function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );//即上文的判断类型方法
     //判断是不是window对象，是则返回false
	if ( jQuery.isWindow( obj ) ) {
		return false;
	}
    //判断是否是节点，节点必是类数组；
	if ( obj.nodeType === 1 && length ) {
		return true;
	}
	//数组肯定属于类数组；
    //当不是函数时，length === 0 或者 length > 0 且有邻近数字属性，也可归为类数组
	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}
```
类数组并没有固定的定义，所以jQuery里面的实现并非唯一的标准。


## 尾声 ##
不知不觉，才写了三个工具方法已经这么长了，像`each`,`map`等常用的工具方法看来只能是另起一章啦。文章篇幅个人感觉短小精悍是最合适的，写的不累，看的各位小伙伴也轻松，就酱先！

