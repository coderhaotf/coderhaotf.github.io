---
title: 菜鸟解读jQuery源码系列-二-疯狂的链式调用
date: 2020-01-28 14:32:13
categories:
tags:
---
## 引言 ##
&emsp;&emsp;熟悉jQuery的小伙伴应该都知道，链式调用是其特色之一。我们创建了一个jQuery对象之后，就可以链式调用其对象上的方法，从而大大方便了我们的代码书写。这特色写法的背后是怎么实现的呢？本篇就让我们一起来探索其背后的奥秘吧！

## 一点疑问 ##
按照惯例，我们先来看几个常用的场景：
```js
$("#id").find("li").css("background","red");
$("<li></li>").appendTo("body").css("background","red");
//...
```
上例每个例子都可以继续调用jQuery的方法，无穷无尽的调用下去，正所谓海阔凭鱼跃，天高任鸟飞啊！阅读过系列（一）的小伙伴都知道，`$()`方法返回的是一个jQuery构造函数生成的实例，也就是说我们可以接着调用其原型链上的各类方法，甚至`$()`返回的实例都是其原型上的`init`方法生成的。

这到底是如何实现的呢？这时，旁边智商高达150的小伙伴大佬冷笑一声，沉默了几秒钟后，突然额头青筋暴起，粗着脖子朝我怒吼：通过返回`this`啊啊啊！！！你到底懂不懂javaScript！！！方法内的`this`不就是指向调用该方法的对象么！这不是so easy么？？！！额。。。我侧头看了看另一旁也在冷笑的John Resig（jQuery的作者），连忙擦了擦汗：咳咳。。。其实，。。。你说的。。。没错。。。。不过！你只对了一半。。。。（小伙伴大佬刚咧开的嘴巴顿时僵住了）。。。

## 灵魂拷问 ##
为什么John Resig会冷笑不止呢，其实。。。好吧，我也不知道为啥，可能真正的大佬都不是一般人能理解的吧。。。不过小伙伴大佬确实只对了一半，下面看简单模拟代码（不理解本实现的可以回看[系列一](http://codedoges.com/article/1535898268557 "jQuery对象的诞生记")文章）：
```js
//即将继承jQuery的函数
function Fn(){
	return this; //关键点：第一种this；
}
function jQuery(){
	return new Fn(); //返回继承jQuery原型的一个实例
}
//继承jQuery函数
Fn.prototype = jQuery.prototype = {
	construtor: jQuery,
    find: function(){
    	console.log("find方法调用");
        return this;//关键点：第二种this；
    },
    css:function(){
    	console.log("css方法调用");
        return this;//关键点：第二种this；
    }
}
var $ = jQuery;
$().find().css(); //find方法调用  //css方法调用
```
小伙伴大佬看到这里，额头青筋暴突，大脸再度涨红了起来：这。。。这有啥了不起的！！？？

额。。。好吧，确实没啥了不起的。其实这里面两种情况代表了`this`的两种指向：

 - 默认绑定，即指向`window`；
 - 隐式绑定，即指向调用方法的对象；
 - 显示绑定，即通过`call`，`apply`，`bind`显式绑定指向；
 - `new`绑定；

显而易见，小伙伴大佬所指的是隐式绑定的情况，另一种情况则是`new`的绑定；其实上面四种情况中，前三种大家还是非常熟悉的，接下来具体看一下`new`绑定时的发生的过程：

1. 创建（或者说构造）一个全新的对象。
2. 这个新对象会被执行 [[ 原型 ]] 连接。
3. 这个新对象会绑定到函数调用的 this 。
4. 如果函数没有返回其他对象，那么 new 表达式中的函数调用会自动返回这个新对象。

简而言之，构造函数中的`this`一定会绑定到生成的实例对象上，但是这个实例对象却不一定会返回（当构造函数返回一个对象时）：

```js
function jQueryA(){
	this.XXX = 1;
    return ; //没有返回对象时，生成一个实例对象
    //return undefined || null || 1 || "string" || true ;
}
function jQueryB(){
	this.XXX = 1;
    return [1,2,3]; //返回一个对象时，直接把该对象返回，无论构造函数里面是什么
    //return {} || function(){} || new Number(1) || ....
}
var a = new jQueryA();
var b = new jQueryB();
console.log(a); //{XXX: 1}
console.log(b); //[1, 2, 3]
```

对照上面的文字跟代码，相信很多小伙伴都可以理解`new`构造函数时所发生的情况，不过这里还有一个特殊情况：

```js
function jQueryC(){
	this.XXX = 1;
    return this; //返回的是this对象
}
var c = new jQueryC();
console.log(c); //{XXX: 1}
```

哈哈，是不是有点小惊喜！其实这段代码也很好理解，已经说过，无论返回的是不是对象，构造函数中的`this`一定会绑定到生成的实例对象上的，返不返回另说！！！而`this`则是一个赤裸裸的实例对象啊，既然是对象，肯定就是返回咯，只不过它恰好是实例对象而已！

讲到这里，小伙伴大佬眼神带着一丝惊慌，努力轻蔑一笑：即使我说漏了一半，这也没啥出奇的嘛，小失误啦！哈哈哈。。。

## 闭关修炼 ##
正当小伙伴大佬肆无忌惮地狂笑时，John Resig也轻蔑一笑，默默的拿出了源码（简略版，看不懂回看[系列一](http://codedoges.com/article/1535898268557 "jQuery对象的诞生记")）：
```js
// 定义jQuery构造函数
jQuery = function( selector, context ) {
	//返回一个新函数
    return new jQuery.fn.init(/** selector, context, rootjQuery **/);
};
jQuery.fn = jQuery.prototype = {
	constructor: jQuery,
    init: function(/** selector, context, rootjQuery **/){
    	//本篇关键之关键！！！
    	return this;//关键点：第一种this；
    },
    find: function(){//伪造的测试方法
    	console.log("find方法调用");
        return this;//关键点：第二种this；
    },
    css:function(){//伪造的测试方法
    	console.log("css方法调用");
        return this;//关键点：第二种this；
    }
    //...
}
// init其实就是继承jQuery的新函数(Fn)，所以需要手动添加继承
jQuery.fn.init.prototype = jQuery.fn;
var $ = jQuery;
$().find().css(); //find方法调用  //css方法调用
```

空气突然安静。小伙伴大佬：这？？。。这踏马是一回事？？？

其实没错，在我们的印象中，构造函数不是一般是大写的吗？里面不是一般都是各种实例属性方法的挂载吗？怎么这`jQuery.fn.init`也是构造函数？？？

嗯嗯。。。没错，这句话其实是我写本篇唯一想说的一句话，其他都是附带的收获了，逃。。。就酱！！！

> 实质上拥有[[Construct]]方法的函数才能成为构造函数，因此不是所有函数都可以用`new`来调用。例如箭头函数就未拥有该方法。but！who care?

## 修仙秘笈 ##

讲到这里，房间的某处，小伙伴大佬抱着John Resig的大腿正在狂喊大佬云云，暂且不表了，先理一下思路吧。

#### 总结

 - 显而易见，理解构造函数下`this`的指向与`new`构造函数时返回的两种情况是这篇文章的重点；
 - 另一个就是小伙伴们对构造函数要有一个通透的理解，不要被复杂的表象所迷惑，即到底是不是构造函数，就看函数有没有被`new`过。世上本没有构造函数，被`new`了之后，就有了构造函数；

通篇下来，仔细看的小伙伴应该都知道我这是在挂羊头卖狗肉啦，其实这也正是我的初衷，就是通过jQuery源码的解读重现，从中学习到一丝丝有意思的知识，我觉得这就够了，对我来说这也就是jQuery最大的价值所在，相信你们也会感同身受。


