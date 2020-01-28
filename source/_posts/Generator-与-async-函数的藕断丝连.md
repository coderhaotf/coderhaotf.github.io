---
title: Generator-与-async-函数的藕断丝连
date: 2020-01-28 14:31:35
categories:
tags:
---
## 前言 ##
上上篇博文中，我们描述了异步回调的三种形式，相信小伙伴们对此都有了一个全新的认识。不过，一定也有小伙伴心存疑惑，比如第三种的async/await，大多数人可能都是知其然而不知其所以然。今天，就让我们深入探究一下其庐山真面目吧。


## 一个问题 ##
我们来看一个题目： 给document添加一个点击事件，每点击一次则打印一次，依次打印 “吃饭”  - -> “睡觉”  - -> “打豆豆”。

粗心的小伙伴一看就火了，这不是异步回调那一篇的栗子吗？？？

仔细看看啦，上一篇栗子打印的时间间隔是提前确定的，这一次时间间隔则是全由点击事件来控制，至于啥时候点击，则无法确定。


## 传统实现 ##

```js
clickEvent(document,"click",eat); // 吃饭 睡觉 打豆豆
function eat(){
	console.log("吃饭");
    clickEvent(document,"click",sleep,eat);
}
function sleep(){
	console.log("睡觉");
    clickEvent(document,"click",dadoudou,sleep);
}
function dadoudou(){
	console.log("打豆豆");
    clickEvent(document,"click",null,dadoudou);
}
function clickEvent(target,event,fn,rmFn){
    target && target.addEventListener(event,fn);
	target && target.removeEventListener(event,rmFn);
}
```

看着这段代码，你有什么感觉呢？如果是你自己来写，又是什么感觉呢？

先说看，为了摸清打印的顺序，要从clickEvent - -> eat - -> sleep - -> dadoudou四个函数不断跳跃阅读。所幸目前每个业务函数中只有一个打印的操作，想象一下，实际开发中，当业务函数长达几十行甚至更多的时候，要从业务函数中找到clickEvent函数也是一件很辛苦的工作。

再说写，不知道你们是什么样的一个过程，反正我确定了代码思路之后，整个代码顺序调整了不止一次，clickEvent也是后面才抽离出来的，整个过程非常的别扭。

这是为什么呢？很简单，因为代码不符合我们常规的思考过程。

人是一种懒惰的动物，越是简单直接，越会觉得轻松愉快。

那有没有所谓的简单直接的方法呢？


## 划时代的巨变 ##
小伙伴们无语了，“博主，你又标题党了！！”

我承认有的时候是有标题党的嫌疑（只是嫌疑！），不过，这一次的标题，再怎么夸张都不为过！！！

```js
//生成器函数
function* clickEvent(){
	yield console.log("吃饭");
    yield console.log("睡觉");
    yield console.log("打豆豆");
}
//创建一个遍历器
var iterator = clickEvent();
document.onclick = function(){
	//调用遍历器
	iterator.next(); // 吃饭 睡觉 打豆豆
}
```

怎么样？怎么样？怎么样？！！

这可以称得上划时代的巨变了么？可以么？如果你真正比对比上例代码，相信你心里已经有答案了。

平复一下心情，我们来看一下这代码：
 - 生成器函数与普通函数的两个不同，一是function后的 `*` 标识符，二是只能存在与生成器函数里面的 `yield` 关键字。
 - 通过调用生成器函数来创建一个遍历器，遍历器则是通过自带的 `next` 方法，逐步执行。


再对比一下上面两段代码，通过生成器函数书写的代码，显然不需要进行各种跳跃类高难度动作才能摸清执行顺序，整个代码显得更加简单直接，执行思路也一目了然。


## Generator（生成器）与 Iterator（遍历器）的关系
第一次接触生成器的小伙伴，最不解的一点就是：调用生成器函数后，为什么可以调用 `next` 方法？

这就要说到ES6新出的 `Iterator` 接口了。在解释 Iterator 之前，我们先思考一个问题：如何遍历 Array , Set , Map 等数据？遍历的内在机制又是什么呢？

##### for...of
没错，就是这个全新的ES6遍历命令：

```js
var arr = ["吃饭","睡觉","打豆豆"];
for(let val of arr){
	console.log(val); // 吃饭 睡觉 打豆豆
}
var set = new Set(arr);
for(let val of set){
	console.log(val); // 吃饭 睡觉 打豆豆
}
```

有的小伙伴就疑问了，`for...of` 这么厉害，之前的遍历方法还有用吗？？

```js
var obj = {
	name: "张三",
    age: 20
}
for(let key in obj){
	console.log(key); // name age
}
for(let key of obj){
	console.log(key); // Uncaught TypeError: obj is not iterable
}
```
勤快测试的小伙伴就发现了，当用 for...of 遍历对象的时候，竟然报错了， `obj is not iterable` 。

啥是 iterable ？


##### Symbol.iterator
我们先看一段代码：

```js
typeof (new Array())[Symbol.iterator]; //"function"
typeof (new Set())[Symbol.iterator]; //"function"
typeof (new Map())[Symbol.iterator]; //"function"
// 没有该属性
typeof (new Object())[Symbol.iterator]; // "undefined"
```
讲这里，小伙伴们应该有些眉目了，for...of  遍历的机制就是隐藏在这里。

`Symbol.iterator` 属性本身是一个函数，就是当前数据结构默认的遍历器生成函数。执行这个函数，就会返回一个遍历器。

```js
var arr = ["吃饭","睡觉","打豆豆"];
var iterator = arr[Symbol.iterator](); // 执行遍历器生成函数，返回一个遍历器；
iterator.next(); // {value: "吃饭", done: false}
iterator.next(); // {value: "睡觉", done: false}
iterator.next(); // {value: "打豆豆", done: false}
iterator.next(); // {value: undefined, done: true}
```

目前原生具备 Iterator 接口的数据结构如下：

 - Array
 - Map
 - Set
 - String
 - TypedArray
 - 函数的 arguments 对象
 - NodeList 对象

有些小伙伴这时就迷茫了，原生具备的？那我还怎么玩呀！！

额，这就把人家遍历器看的有点小肚鸡肠啦，其实人家还是给了我们发挥空间的:

```js
var obj = {
	[Symbol.iterator](){
    	return {
        	begin: 1,
        	next(){
            	if(this.begin < 4){
                	return {value: this.begin ++, done: false}
                }else{
                	return { value: undefined, done: true}
                }
            }
        }
    }
}
for (let val of obj){
	console.log(val); // 1  2  3
}
```
这样的话，我们就可以自定义一个遍历器了。

##### 水落石出
绕了这么一大圈，相信各位小伙伴此时都心中有数啦，让我回头再看看一开始那个栗子：

```js
//生成器函数
function* clickEvent(){
	yield console.log("吃饭");
    yield console.log("睡觉");
    yield console.log("打豆豆");
}
//创建一个遍历器
var iterator = clickEvent();
// 证明了这是一个遍历器
typeof iterator[Symbol.iterator]; //"function"
```

没有错，就是这么简单，所谓的Generator（生成器），其实就生成 Iterator (遍历器)的一种特殊函数！！


## Generator 函数与 async 函数
讲了这么多，小伙伴们已经急，“天天废话一大摞，你说你，讲了大半天，跟标题有啥子关系哦！”

额，其实我也不想啊！写文章很累的好吧！！！不过考虑到一些基础还不太扎实的小伙伴，循序渐进还是很有必要的，而且这样把整个个知识体系串联了起来，显得更为系统了不是？

我们回到正题。

`async` 函数我们在异步回调的前世今生篇已经有所涉及，但是好事多磨，我们再重写一遍今天这个栗子：

```js
//生成器函数
async function clickEvent(){
	await console.log("吃饭");
    await console.log("睡觉");
    await console.log("打豆豆");
}
//麻烦了,一骨碌全打印出来了
clickEvent(); // 吃饭 睡觉 打豆豆
// 说明 async 函数并不是遍历器
typeof clickEvent[Symbol.iterator]; // "undefined"
```

小伙伴们顿时兴奋了，“露陷了吧！哈哈哈哈哈！”

额，。。。还好我早已对这种充满幸灾乐祸的人生见惯不惯了。

不过，我有说过 `async` 能实现吗？有说过吗？？有证据吗？？

“既然都不能实现，你说这些有啥子意思咧”，小伙伴们一脸不屑。

“我想说”，我一脸严肃，“虽然 async 函数不能实现，但是它却是 Generator 函数的语法糖！”








