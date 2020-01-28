---
title: 菜鸟解读jQuery源码系列-一-jQuery对象的诞生记
date: 2020-01-28 14:32:08
categories:
tags:
---
## 引言 ##
作为整个jQuery源码解读系列的开篇，不说点啥怪不好意思的（讨打脸）。

 - 首先老生常谈，现在VUE都大行其道了，为啥还要阅读jQuery源码？其实我只想反问一句，春秋战国，唐宋盛世都过去无数年了，你怎么不用草泥马来写高考作文？
 - 其次，jQuery真的过时了么？确定？说过时的不要慌，我不会打你的，不过请你多去看看各类插件的源码，你会发现，jQuery源码的影子无处不在；
 - 其三，jQuery源码是使用原生js写成的，阅读它有助于提高我们的原生能力，也就是传说中的修内功；
 - 最后，很令人忧伤，目前我就只读过jQuery源码啊。。。别打我！这里先定个目标，一年内我会写一个VUE的源码解读系列！！

还有一点温馨提示：这个系列不在于解读源码，也就是说，我会尽量用简单的代码来模拟源码的实现，这样，大伙看过之后既便于理解，独自去阅读源码时，自然也就心中有数了。

现在，就让我们开始吧！

## 一点疑问 ##
让我们先来看几个常用的场景
```js
$(document).ready(...) //等待DOM渲染完成
$("#id").find(...) //查找id下的某元素
$("<li></li>").appendTo(...) //创建元素添加到某元素
// ...
```
这些场景我们都是见怪不怪了，不过有没有人思考过，`$(...)`这个东西是如何产生的呢？很显然它是一个对象，但是它为何可以调用各种我们常见的方法？这里想必有很多聪明的小伙伴已经发怒了，原型啊！这不是侮辱我高达150的智商么！！！额。。。好吧！算你聪明，接下来让我们看一段代码：
```js
function jQuery(){
	this.name = "jquery";
    //...
}
jQuery.prototype = {
	construtor: jQuery,
    find: function(){
    	console.log('find方法执行');
    }
}
var $ = new jQuery();
$.find() //find方法执行; 终于可以开始愉快的调用$.find方法了
```
写到这里，各位小伙伴大佬微微点头：不错不错，我就是这个意思！！这个时候John Resig(jQuery的作者)跳了出来：我可没这样写，不要侮辱我的智商！！！小伙伴大佬：咦，你不就是这样写的吗，有啥了不起的，切！

## 灵魂拷问 ##
上面John Resig跟小伙伴大佬的争论我就不管了，先看其中有什么猫腻吧：
```js
$("#id").find() //John Resig
$.find() //小伙伴大佬
```
咦，好像还真有点不一样！！John Resig是通过`$("#id")`函数调用后才调用`find`，小伙伴大佬是直接通过`$`对象调用了`find`；

说到这里，小伙伴大佬不服气了，这有啥了不起啊？！！

嗯嗯。。。这貌似是个问题，这有啥了不起呢？？

文明人还是多上代码少上手吧：
```js
//John Resig：看我的 $ 能变几样！
$(document) === $(document) //false
//小伙伴大佬：难道我的 $ 就虚你？
$ === $ //true  哟，沃德天，咋就一模一样了？...
```
显而易见，John Resig的`$()`方法调用时,内部一定是生成并返回了一个新对象，其实也就是每调用一次，`new jQuery()`都会执行一次并放回，这其实也就是源码内部所做的事情，从而省掉了每次都要手动`new`一个jQuery实例对象的操作。这个非常精妙的设计是怎么实现的呢？小伙伴大佬陷入了沉思。。。

## 闭关修炼 ##
#### 第一次尝试
不就是返回一个`new jQuery`吗？
```js
function jQuery(){
	return new jQuery(); //so easy!!
}
jQuery.prototype = {
	construtor: jQuery,
    find: function(){
    	console.log('find方法执行');
    }
}
var $ = jQuery;
//造成了循环调用，内存溢出，失败
$().find();//Uncaught RangeError: Maximum call stack size exceeded...
```

显而易见，构造函数里面使用同一个构造函数来生成实例是行不通的，这样会造成循环调用导致内存溢出。


#### 第二次尝试
显然直接返回`new jQuery()`对象是行不通的了，那就返回一个新函数吧，只要新函数的原型继承了原有的jQuery对象，不也就可以了吗？
```js
function Fn(){} //即将继承jQuery的函数
function jQuery(){
	return new Fn(); //so easy!!
}
//继承jQuery函数
Fn.prototype = jQuery.prototype = {
	construtor: jQuery,
    find: function(){console.log("成功")}
}
var $ = jQuery;
$().find(); //成功！！
```

这段代码跟第一次有啥区别呢，其实只是转换了一下思路。我们创建jQuery实例对象的目标，不就是为了使用jQuery原型对象上面的各种方法吗？

是不是一定要jQuery构造函数才可以可以继承呢？显然不是，随便创建一个构造函数，只需要使其继承jQuery构造函数的原型，不是一样可以做到吗？（不熟悉原型继承的小伙伴先移步去了解相关知识点）；



#### 源码实现
下面是jQuery源码中的具体实现，小伙伴们请对比上例代码来理解：
```js
// 定义jQuery构造函数
jQuery = function( selector, context ) {
	//返回一个新函数
    return new jQuery.fn.init(/** selector, context, rootjQuery **/);
};
jQuery.fn = jQuery.prototype = {
	constructor: jQuery,
    init: function(/** selector, context, rootjQuery **/){},
    find:function(){console.log("成功")},//伪造的测试方法
    //...
}
// init其实就是继承jQuery的新函数(Fn)，所以需要手动添加继承
jQuery.fn.init.prototype = jQuery.fn;
//测试
var $ = jQuery;
$().find(); //成功！！
```

看到这里，可能有的小伙伴有点蒙，这。。这是类似的代码？没有错，这里的`init`函数跟上例的`Fn`函数都是同一个东西，发挥着同样的作用。不理解的小伙伴请继续阅读系列二，那里会做一个深入的分析，这里先不展开了。


## 修仙秘笈 ##
上文的源码实现其实就是第二次尝试的升级版本而已，原理是一模一样的，只不过显得有些绕，慢慢琢磨应该都可以领会。因为这是jQuery源码解读的第一篇，所以有必要把一些细节继续讲述一下：

#### 框架结构
jQuery的框架结构其实也非常简单，就是一个立即执行函数：
```js
//简化版本
(function( window, undefined ) {
	//...定义一些常用变量
    //定义jQuery构造函数
	var jQuery = function(){};
    //添加各类原型方法
    jQuery.extend({...});
    //构造函数上面挂载各类工具方法
    jQuery.xxx = function(){...}
    //抛出构造函数，把jQuery注册为全局方法
    window.jQuery = window.$ = jQuery;
})( window );//传入window，缩短作用域链，函数内部可以更快访问到window
```

#### 细节

   - window传入
     之所以要在立即执行函数传入window变量，是因为js的作用链机制是层层由内而外查找的，传入window可以缩短查找window时的路径；
   - undefined
   	立即执行函数接收两个参数，第二个参数undefined永远是undefined，这样处理是为了避免undefined在外部被修改：
    ```js
    undefined = "hello";
    console.log(undefined);//hello (某些版本浏览器下可以修改，如ie8)
    ```

好了，这篇到这就暂告一个段落了，下一篇我们会继续探究jQuery对象的秘密，让我们继续下去吧！









