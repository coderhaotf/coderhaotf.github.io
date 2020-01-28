---
title: 你不知道的instanceof
date: 2020-01-28 14:31:46
categories:
tags:
---
## 前言 ##
大伙看了标题，肯定是一头雾水，啥？我不知道的instancof ? 我天天都在用！还有什么不知道的？！

说实话，我也很担心这看似标题党的标题一语成谶，因为此篇东西确实不多。所以，自信已经知道的大佬可以绕道走，剩下的小伙伴来跟我一探究竟吧！

## 一个栗子 ##
按照惯例，我们先来看一个小栗子：
```js
function A(){}
var a = new A();
//100%的小伙伴做对
console.log(a instanceof A);//true
//50%的小伙伴能做对
console.log(a instanceof Object);//true
```
这是 `instanceof` 最常用的一个场景。第一种情况我们就不说了，显而易见的事情，我们来看第二种情况。


## instanceof 与原型链

在看第二种情况之前，我们先来看MDN上面的定义：

> **instanceof运算符用于测试构造函数的prototype属性是否出现在对象的原型链中的任何位置**

说实话，我第一次看到这个定义也很懵，每一个字都能够看懂，放在一起就蒙蔽的典型。

现在我们来分步解析一下：

 - 构造函数的prototype，其实就是 `A.prototype`
 - 对象（实际就是实例）的原型链，其实就是 `a.__proto__`

顺着上面的代码，我们打印验证一下：
```js
function A(){}
var a = new A();
console.log(a.__proto__ === A.prototype); //true
console.log(A.prototype.__proto__ === Object.prototype);
//上面两个组合起来
console.log(a.__proto__.__proto__ === Object.prototype); //true
```
啥叫原型链？这里已经很清晰了，其实就是以一个**实例为起点**，`__proto__` 属性为指引，一步步延伸的一个链条。中间经历过的构造函数，都算是在该实例的原型链上。

为什么要在实例为起点加粗呢？请继续看下文。


## 深入认识 `__proto__`
通过上例，我们已经算是深入到了原型链的实质，但是很有可能认识还不够透彻，下面再看一个栗子：
```js
function A(){}
function B(){}
var a1 = new A();
console.log(a1 instanceof A); //true
//改变原型指向
A.prototype = {constructor :B};
//被影响了，很正常
console.log(a1 instanceof A); //false
//什么鬼，constructor不是B么？
console.log(a1 instanceof B); // false
// 重新构造一个
var a2 = new A();
//什么鬼，constructor不是B么?
console.log(a2 instanceof A); //true
//好吧，99%小伙伴选择放弃！
console.log(a2 instanceof B); //false
```
怎么样，刚刚还信心满满说已经理解了`instanceof`，已经理解了 `__proto__`的小伙伴在哪里呢？

没有做对上面题目的小伙伴，其实也不用灰心，现在我就带你们彻底了解它。

下面我们用原型的视角看这问题：

```js
function A(){}
function B(){}
var a1 = new A();
console.log(a1 instanceof A); //true
console.log(a1.__proto__ === A.prototype); //true
//改变原型指向
A.prototype = {constructor :B};
//此时A.prototype地址已经修改，a1.__proto__指向不变
console.log(a1 instanceof A); //false
console.log(a1.__proto__ === A.prototype); //false
// 重新构造一个
var a2 = new A();
//a2是A最新构造的，a2.__proto__指向修改后的A.prototype
console.log(a2 instanceof A); //true
console.log(a2.__proto__ === A.prototype); //true
//证明跟原型的constructor没一点关系，只看是被哪个构造函数构造！
console.log(a2 instanceof B); //false
console.log(a2.__proto__ === B.prototype); //false
```

好啦，各位有没有拨开云雾见天日，守得云开见月明的感觉呢？认真看到这里的小伙伴，应该已经算是彻底的了解了`instanceof`。若有看不懂的，可以参照[大话西游之原型与继承（上）](http://codedoges.com/article/1536662941125 "大话西游之原型与继承（上）")，必能加深认识。


## 总结 ##
有的小伙伴说，不谈框架，天天搞这些无聊的东西有啥意思？其实很简单，人各有志，道不同则不与为谋。同样，每个人的技术观也不一样，并无高低贵贱之分，技术的汪洋大海中，各取一瓢罢了。



