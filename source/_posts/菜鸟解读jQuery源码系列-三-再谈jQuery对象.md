---
title: 菜鸟解读jQuery源码系列-三-再谈jQuery对象
date: 2020-01-28 14:32:11
categories:
tags:
---
## 引言 ##
&emsp;&emsp;经过前两个系列的洗礼，小伙伴们大概都大概了解jQuery对象是个啥了。两个系列通篇口水，总结下来无非就是两句话：系列一讲jQuery是如何通过构造函数生成，系列二讲的是jQuery为啥能链式调用。稍微用点心思，认真一点读一遍的小伙伴，应该都能读懂了，哈哈哈（难道还要质疑我的写作能力？?）。

## 灵魂拷问 ##
我笑音未落，旁边一个小伙伴脸色铁青，咬着牙气狠狠地对我吼道：你骗人！！！啥？啥？？正当我百思不得其解时，天空飘来一段代码：
```js
//系列一，系列二的代码
var $ = jQuery;
$().find().css(); //find方法调用  //css方法调用

//实践中的jq代码
$("ul").find("li").css("background","red");
```
“你骗人！！！”，旁边小伙伴的怒火有点大，我不禁捂住了耳朵，“我没骗人！！！”，“那你狗屁代码怎么跟人家正宗的不一样？？”，“那。。那是因为我还没写完！！！”我长舒了一口气，有点傲然地撇了一眼脸胀的通红的小伙伴，紧接着低咳了两声，“接下来才是见证奇迹的时刻！！”。

##### 问题所在
之前的问题在哪呢？一眼可见，之前实现的代码，方法是正常调用了，jQuery对象原型上的方法也能愉快的继承下来了，但是还没解决两个问题：
  - 第一个问题，jQuery原型倒是继承下来，实例对象呢？实例对象长啥样？
  - 第二个问题，方法中的`DOM`元素是如何选中并进行操作的？

好吧，其实是我啰嗦了，这看似是两个问题，其实只是一个问题，接下来，就让我们去收割真正的`jQuery`对象吧！

## 闭关修炼 ##
通过前两个系列，我们已经知道`$()`返回的是一个jQuery实例对象，既然这样，我们就先打印一下该实例对象：

```
//...省略代码
<ul>
	<li></li>
    <li></li>
    <li></li>
</ul>
<script>
console.log($("li"));
/*{
	0:li,
    1:li,
    2:li,
    context:document,
    length:3,
    selector:"li",
    prevObject：init [document, context: document]//上一个jQuery实例
    //...
}*/
//为了避免使用图片，我就手打代码了，大伙可以自行打印一下。
</script>
//...省略代码
```

这，，，这不是传说中的类数组对象吗？让我们再看一段代码：

```js
//get方法即是传说中把jQuery对象转换成DOM对象的方法
$("li").get(0).nodeType;
//1 ; 元素节点
```

显而易见，实例对象里面，把选择到的元素节点，一个个都存起来了啊！！！
旁边的小伙伴怒气稍减，脸也没那么红了，“有点意思，但是怎么实现呢？”
好吧，看来不拿出真本事是不行了，直接看代码吧（看不懂回看[系列一](http://codedoges.com/article/1535898268557 "jQuery对象的诞生记")）：
```js
// 定义jQuery构造函数
jQuery = function( selector, context ) {
	//返回一个新函数
    return new jQuery.fn.init( selector /**, context, rootjQuery **/);
};
jQuery.fn = jQuery.prototype = {
	constructor: jQuery,
    init: function( selector /** , context, rootjQuery **/){
    	if(typeof selector === "string"){//假设这里只传标签名字符串，实际上会有多种情况需要判断
        	var arr = document.getElementsByTagName(selector);
            for(var i = 0; i < arr.length; i++){
            	this[i] = arr[i];
            }
        }
    	return this;//第一种this；
    },
    get: function(index){//伪造的测试方法
        return this[index];//第二种this
    },
    //...
}
// init其实就是继承jQuery的新函数(Fn)，所以需要手动添加继承
jQuery.fn.init.prototype = jQuery.fn;
var $ = jQuery;
$("body").get(0).nodeName; //"BODY"
```
nice ！！！
整个系列走到这里，jQuery对象的神秘面纱终于被彻底揭开了！！！
这时，旁边的小伙伴由怒转喜，一猛扑就想要过来抱我大腿，我吓得猛地跳开，用手直指正在角落打瞌睡的John Resig，“是他，是他，大佬就是他！！”

正当场面一片喧闹时，一反常态已沉默许久的小伙伴大佬突然发话了，“你所说的好像挺有道理的，不过，jQuery对象里面的那个`prevObject`是啥回事？”

其他小伙伴这时也缓过神来了，顿时七嘴八舌起来，“对啊，啥回事捏，怎么刚刚没见说？？？又想掺水么？”

眼看刚刚营造的和谐氛围马上就要荡然无存，我也急了，“大家安静，安静，听我继续说！”

## 渡劫化神 ##
好吧，其实每次小标题都是乱起的，发现内容严重不符还请手下留情。接下来请看一段代码：
```js
//实践中的用法，大伙自行验证效果
$('ul').find('li').css('background','red').end().css('border','1px solid #000000');//重点关注 .end() 方法；
```
这段代码的结果就是`li`元素背景变红，`ul`元素则加上了边框。

这是为什么呢？按照链式调用，`css`方法调用时，方法内的`this`不是指向`li`元素的么（暂且这么理解，实质是指向包含`li`元素的jQuery对象）？

疑点的指向小伙伴们应该都能够猜到了，这一切都是`.end()`方法搞的鬼！

现在就让我们看看`end`方法是如何做到这一点的：
```js
// 定义jQuery构造函数
jQuery = function( selector, context ) {
	//返回一个新函数
    return new jQuery.fn.init( selector /**, context, rootjQuery **/);
};
jQuery.fn = jQuery.prototype = {
	constructor: jQuery,
    init: function( selector /** , context, rootjQuery **/){
    	this[0] = selector; //假装选中该元素（模拟一下就好啦，不要打我！）
    	return this;//第一种this；
    },
    find: function(selector){//伪造的测试方法
    	var ret = $(selector);//假装选中了子元素，生成全新的jQuery对象；
        //此时的this是指向上一个jQuery对象的，此处把它存起来！
        ret['prevObject'] = this;//关键点！！！
        return ret;//返回了包装子元素的jQuery对象
    },
    end: function(){//伪造的测试方法
        return this.prevObject;//很简单，把当前jQuery对象存的上一个对象返回；
    },
    //...
}
// init其实就是继承jQuery的新函数(Fn)，所以需要手动添加继承
jQuery.fn.init.prototype = jQuery.fn;
var $ = jQuery;
//赶紧测试一下吧！！！看看里面的结构。
console.log($("body").find('ul').find('li'));
//jQuery对象通过end方法进行回溯调用
var obj = $("body").find('ul');
obj.find('li').end() === obj;//true !!!
```

讲到这里，相信一路看下来的小伙伴应该都差不多明白了，所谓的`prevObject`属性其实就是存储了当前jQuery对象的上一个jQuery对象，并通过`end`方法进行回溯查找，从而实现了传说中的链式调用的灵活使用。

这时，方才还在打瞌睡的John Resig适时睡醒了，在众多小伙伴的注视下走了过来，用手轻轻拍了我的肩膀，说道，“盗版虽好，不可贪杯哦”。

## 羽化登仙 ##
(｡･∀･)ﾉﾞ嗨！上面的小伙伴，你们还好吗？
好吧，其实我只是想多水两句。不过，如果是神情还有点恍惚的小伙伴，还请移步系列一，把这三部曲按照顺序看一遍，相信对传说中的jQuery对象就能够有一个深入的理解了。有没有信心？

##### 为什么这么水？
我也不想啊！！！
好吧，虽然听起来有点言不由衷，不过确实是有苦衷的。

 - 苦衷一：个人切身体验。在深入理解jQuery源码之前，给我最大神秘感的，最难以理解的，其实就是这个`jQuery`对象，它是如何产生的？里面包含了写什么？是结构是怎样的？。。。这些问题一直是我心中最大的疑惑；
 - 苦衷二：理解源码之门槛。啥？门槛不是那些无穷无尽的API吗？是的，真正的门槛其实就是理解`jQuery`对象，它才是贯穿整个源码的主线，其他无穷无尽的API，都不过是游戏中的一个个副本而已。所以理解它是重中之重；
 - 苦衷三：本人控水能力不足（做欲哭状，旁边小伙伴呕吐声，叫骂声不绝于耳）；

##### 结尾
系列一到系列三，其实讲的是都是jQuery对象，只不过采取的是循序渐进的方式而已，所以小伙伴们最好是放一起来阅读，小伙伴大佬则请自便。

接下来的系列则是关于一系列API的另类解读，敬请期待哈！










