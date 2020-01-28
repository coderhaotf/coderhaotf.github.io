---
title: 前端面试经典问题汇总-JS篇
date: 2020-01-28 14:31:49
categories:
tags:
---
## 对象的属性 ##
ECMAScript 中有两种属性：数据属性和访问器属性。

描述符可同时具有的键值

|      |configurable |	enumerable |	value |	writable |	get |	set|
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
|数据描述符 |	Yes |	Yes |	Yes |	Yes |	No |	No |
|存取描述符 |	Yes |	Yes |	No | No |	Yes |	Yes |

##### 数据属性：
```js
var obj = {};
Object.defineProperty(obj, "key", {
  enumerable: false,
  configurable: false,
  writable: false,
  value: "static"
});
```

##### 访问器属性：

```js
var obj = {
  _year:2001,
  get year() {
	return this._year;
  },
  set year(val){
    this._year = val
  }
}
console.log(obj._year); //2001
console.log(obj.year); //2001
obj.year = 'hello';
console.log(obj._year); // hello
console.log(obj.year); // hello
```

## 事件委托 ##
##### 为什么要事件委托：

 - 绑定事件越多，浏览器内存占用越大，严重影响性能。
 - ajax的出现，局部刷新的盛行，导致每次加载完，都要重新绑定事件
 - 部分浏览器移除元素时，绑定的事件并没有被及时移除，导致的内存泄漏，严重影响性能
 - 大部分ajax局部刷新的，只是显示的数据，而操作却是大部分相同的，重复绑定，会导致代码的耦合性过大，严重影响后期的维护。

##### 事件委托的简单实现：
```js
function _addEvent(obj,type,fn){
    obj.addEventListener(type,fn,false);
}
function _delegate(obj,tag,fn){
    function cb(e){
        var target = e.target || e.srcElement;
        var tags = obj.getElementsByTagName(tag);
        if(tags.length === 0){return;}
        while(e.nodeName.toLowerCase() !== tag){
        	target = target.parentNode;
        }
        for(var i = 0; i < tags.length; i++){
        	if(tags[i] === target){
            	alert(i);
                break;
            }
        }
    }
    _addEvent(obj,"click",cb);
}
```

##### 事件委托的缺点：
通过jQuery的源码可以获知，事件委托的性能受下面三个因素所影响：

 - DOM遍历的次数
 - DOM结构的层数
 - 事件委托绑定的个数

##### 提高事件委托性能的解决方案：

 - 降低层级，尽量在父级绑定
 - 减少绑定的次数


## 图片预加载与懒加载 ##

##### 预加载

######方法一：用CSS和JavaScript实现预加载
使用纯CSS:
```css
background: url(http://domain.tld/image-01.png) no-repeat -9999px -9999px; }  
```
使用该法加载的图片会同页面的其他内容一起加载，增加了页面的整体加载时间。为了解决这个问题，我们增加了一些JavaScript代码，来推迟预加载的时间，直到页面加载完毕。
```js
function preloader() {
    if (document.getElementById) {
        document.getElementById("preload-01").style.background = "url(http://domain.tld/image-01.png) no-repeat -9999px -9999px";
    }
}
function addLoadEvent(func) {
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    } else {
        window.onload = function() {
            if (oldonload) {
                oldonload();
            }
            func();
        }
    }
}
addLoadEvent(preloader);
```

###### 方法二：仅使用JavaScript实现预加载
上述方法有时确实很高效，但我们逐渐发现它在实际实现过程中会耗费太多时间。相反，我更喜欢使用纯JavaScript来实现图片的预加载。
```js
var images = new Array()
function preload() {
    for (i = 0; i < preload.arguments.length; i++) {
        images[i] = new Image()
        images[i].src = preload.arguments[i]
    }
}
preload(
    "http://domain.tld/gallery/image-001.jpg",
    "http://domain.tld/gallery/image-002.jpg",
    "http://domain.tld/gallery/image-003.jpg")
```

###### 方法三：使用Ajax实现预加载
```js
window.onload = function() {
setTimeout(function() {
    // XHR to request a JS and a CSS
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://domain.tld/preload.js');
    xhr.send('');
    xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://domain.tld/preload.css');
    xhr.send('');
    // preload image
    new Image().src = "http://domain.tld/preload.png";
}, 1000);
};
```

##### 懒加载

 - 第一种是纯粹的延迟加载，使用setTimeOut或setInterval进行加载延迟。
 - 第二种是条件加载，符合某些条件，或触发了某些事件才开始异步下载。
 - 第三种是可视区加载，即仅加载用户可以看到的区域，这个主要由监控滚动条来实现。

```js
(function($) {
    $.fn.scrollLoading = function(options) {
        var defaults = {
            attr: "data-url",
            container: $(window),
            callback: $.noop
        };
        var params = $.extend({}, defaults, options || {});
        params.cache = [];
        $(this).each(function() {
            var node = this.nodeName.toLowerCase(), url = $(this).attr(params["attr"]);
            var data = {
                obj: $(this),
                tag: node,
                url: url
            };
            params.cache.push(data);
        });
        var callback = function(call) {
            if ($.isFunction(params.callback)) {
                params.callback.call(call.get(0));
            }
        };
        var loading = function() {
            var contHeight = params.container.height();
            if ($(window).get(0) === window) {
                contop = $(window).scrollTop();
            } else {
                contop = params.container.offset().top;
            }
            $.each(params.cache, function(i, data) {
                var o = data.obj, tag = data.tag, url = data.url, post, posb;
                if (o) {
                    post = o.offset().top - contop, post + o.height();
                    if (o.is(':visible') && (post >= 0 && post < contHeight) || (posb > 0 && posb <= contHeight)) {
                        if (url) {
                            if (tag === "img") {
                                callback(o.attr("src", url));
                            } else {
                                o.load(url, {}, function() {
                                    callback(o);
                                });
                            }
                        } else {
                            callback(o);
                        }
                        data.obj = null;
                    }
                }
            });
        };
        loading();
        params.container.bind("scroll", loading);
    };
})(jQuery);
```

## mouseover和mouseenter的区别
 - mouseover 事件具有冒泡特性，也就是说无论鼠标是从别的元素移动到element或者是从element的子元素移动到element都会触发mouseover事件。
 - mouseenter 事件，该事件没有冒泡特性，也就是说只有鼠标穿过该事件的时候才会触发mouseenter

###### mouseover 模拟 mouseenter
```js
var selector = document.getElementById('test');
  selector.addEventListener("mouseover", function( event ) {
    var target = event.target,
        related = event.relatedTarget,//触发事件前所在的节点
        match;
    // 通过触发事件节点找到绑定事件节点
    while ( target && target !== document && target!== this ) {
        target = target.parentNode;
        if (target === this) {match = true;}
    }
    // 没找到绑定事件的节点
    if ( !match ) { return; }
    // 判断是不是冒泡触发的节点，如果是则related置为target
    while ( related && related != target && related != document ) {
        related = related.parentNode;
    }
    // 冒泡触发，也就是子节点触发
    if ( related == target ) { return; }

    //......mouseenter事件代码
  }, false);

```

## 闭包
```js
function f1(){
    var n = [1,2];
    add = function(){
        n.unshift(0);
        return n;
    }
    function f2(){
        n.push(3);
        return n;
    }
    return f2;
}
var result1 = f1();//拷贝一份
var result2 = f1();//拷贝一份
var result3 = f1();//拷贝一份
var a1 = result1();add();console.log(a1);//[1, 2, 3]
var a2 = result2();add();console.log(a2);//[1, 2, 3]
var a3 = result3();add();console.log(a3);//[0, 0, 0, 1, 2, 3]
var a4 = add();
console.log(a1 === a2);//false
console.log(a2 === a3);//false
console.log(a3 === a4);//true
```

## new 命令的原理

##### 原理
使用new命令时，它后面的函数依次执行下面的步骤。

 - 创建一个空对象，作为将要返回的对象实例。
 - 将这个空对象的原型，指向构造函数的prototype属性。
 - 将这个空对象赋值给函数内部的this关键字。
 - 开始执行构造函数内部的代码。

实现代码：
```js
function _new(/* 构造函数 */ constructor, /* 构造函数参数 */ params) {
  // 将 arguments 对象转为数组
  var args = [].slice.call(arguments);
  // 取出构造函数
  var constructor = args.shift();
  // 创建一个空对象，继承构造函数的 prototype 属性
  var context = Object.create(constructor.prototype);
  // 执行构造函数
  var result = constructor.apply(context, args);
  // 如果返回结果是对象，就直接返回，否则返回 context 对象
  return (typeof result === 'object' && result != null) ? result : context;
}
// 实例
var actor = _new(Person, '张三', 28);
```

##### 保证构造函数使用new
###### 方法一，严格模式
```js
function Fubar(foo, bar){
  'use strict';
  this._foo = foo;
  this._bar = bar;
}
Fubar()
// TypeError: Cannot set property '_foo' of undefined
```

###### 方法二，new.target
```js
function f() {
  if (!new.target) {
    throw new Error('请使用 new 命令调用！');
  }
  // ...
}
f() // Uncaught Error: 请使用 new 命令调用！
```


## call 、 apply 、bind 的实现
##### call 的实现
```js
if(!Function.prototype.call){
	Function.prototype.call = function(args){
		if (typeof this !== "function") {
			throw Error("函数才能调用call方法");
		}
		//this绑定的指向
		var context = arguments[0];
		//调用call的函数
		var fn = this;
		//call调用时的传参
		var param = Array.prototype.slice.call(arguments,1);
		//创建一个唯一key;
		var key = 'fn' + Math.random();
		if (context == undefined) {
			//return eval("fn(" + param + ")");
			return fn(...param);
		}else{
			//保证是对象
			context = Object(context);
			//将函数变为context的方法
			context[key] = fn;
			//通过对象方法的形式调用
			//return eval("context[key](" + param + ")");
			return context[key](...param);
		}
	}
}
```

##### apply 的实现
```js
if(!Function.prototype.apply){
	Function.prototype.myapply = function(args){
		if (typeof this !== "function") {
			throw Error("函数才能调用appy方法");
		}
		//this绑定的指向
		var context = arguments[0];
		//调用apply的函数
		var fn = this;
		//apply调用时的传参
		var param = arguments[1] instanceof Array ? arguments[1] : [];
		//创建一个唯一key;
		var key = 'fn' + Math.random();
		if (context == undefined) {
			//return eval("fn(" + param + ")");
			return fn(...param);
		}else{
			//保证是对象
			context = Object(context);
			//将函数变为context的方法
			context[key] = fn;
			//通过对象方法的形式调用
			//return eval("context[key](" + param + ")");
			return context[key](...param);
		}
	}
}
```


##### bind 的实现
```js
if (!Function.prototype.bind) {
	Function.prototype.mybind = function(args){
		if (typeof this !== "function") {
			throw Error("函数才能调用bind方法");
		}
		//this绑定的指向
		var context = arguments[0];
		//调用bind的函数
		var fn = this;
		//bind调用时的传参
		var param = Array.prototype.slice.call(arguments,1);
		//返回的函数，等待下一步调用
		var callback = function(){
			//判断callback是直接调用还是new调用
			fn.apply(this instanceof callback ? this : context,
				//合并参数
				param.concat(Array.prototype.slice.call(arguments))
			);
		}
		//维护原型关系
		if (fn.prototype) {
			callback.prototype = Object.create(fn.prototype);
		}
		//返回待调用的函数
		return callback;
	}
}
```

## 异步加载js的方法
defer属性和async属性到底应该使用哪一个？

一般来说，如果脚本之间没有依赖关系，就使用async属性，如果脚本之间有依赖关系，就使用defer属性。

如果同时使用async和defer属性，后者不起作用，浏览器行为由async属性决定。

##### defer：
有了defer属性，浏览器下载脚本文件的时候，不会阻塞页面渲染。下载的脚本文件在DOMContentLoaded事件触发前执行（即刚刚读取完</html>标签），而且可以保证执行顺序就是它们在页面上出现的顺序。

对于内置而不是加载外部脚本的script标签，以及动态生成的script标签，defer属性不起作用。

 - 浏览器开始解析 HTML 网页。
 - 解析过程中，发现带有defer属性的script元素。
 - 浏览器继续往下解析 HTML 网页，同时并行下载script元素加载的外部脚本。
 - 浏览器完成解析 HTML 网页，此时再回过头执行已经下载完成的脚本。

##### async:
async属性可以保证脚本下载的同时，浏览器继续渲染。需要注意的是，一旦采用这个属性，就无法保证脚本的执行顺序。哪个脚本先下载结束，就先执行那个脚本。

 - 浏览器开始解析 HTML 网页。
 - 解析过程中，发现带有async属性的script标签。
 - 浏览器继续往下解析 HTML 网页，同时并行下载script标签中的外部脚本。
 - 脚本下载完成，浏览器暂停解析 HTML 网页，开始执行下载的脚本。
 - 脚本执行完毕，浏览器恢复解析 HTML 网页。

##### ES6 模块(type="module")

浏览器对于带有type="module"的`<script>`，都是异步加载，不会造成堵塞浏览器，即等到整个页面渲染完，再执行模块脚本，等同于打开了`<script>`标签的defer属性。

`<script>`标签的async属性也可以打开，这时只要加载完成，渲染引擎就会中断渲染立即执行。执行完成后，再恢复渲染。


##### 动态创建script标签


## Ajax解决浏览器的缓存问题
Ajax能提高页面载入速度的主要原因是通过Ajax减少了重复数据的载入，也即在载入数据的同时将数据缓存到内存中，一旦数据被加载，只要没有刷新页面，这些数据就会一直被缓存在内存中，当提交的URL与历史的URL一致时，就不需要提交给服务器，也即不需要从服务器获取数据，虽然降低了服务器的负载，提高了用户体验，但不能获取最新的数据。为了保证读取的信息都是最新的，需要禁止其缓存功能。

 - 在ajax发送请求前加上 anyAjaxObj.setRequestHeader("If-Modified-Since","0")。
 - 在ajax发送请求前加上 anyAjaxObj.setRequestHeader("Cache-Control","no-cache")。
 - 在URL后面加上一个随机数： "fresh=" + Math.random()。
 - 在URL后面加上时间搓："nowtime=" + new Date().getTime()。
 - 如果是使用jQuery，直接这样就可以了 $.ajaxSetup({cache:false})。这样页面的所有ajax都会执行这条语句就是不需要保存缓存记录。


## 防抖与节流
##### 防抖
根据用户输入信息发请求的时候，为了防止频繁触发请求，需要等待用户最后输入的时候再发送请求，也就是防抖：
```js
function debounce(fn,delay){
	//利用闭包，保留定时器的指引
	var timer = null;
	return function(){
    	//每调用一次就取消上一次回调。
		clearTimeout(timer);
        //重新开启定时器，过一段时间后若无操作，则执行回调
		timer = setTimeout(fn,delay)
	}
}
var scroll = debounce(function(){
	console.log('do something!!!')
},500)
window.onscroll = scroll;
```

##### 节流
当滚动鼠标时，因为滚动事件触发间隔极短，需要限制其在某个时间段内，只执行一次。
```js
function throttle(fn,interval){
	//设定初始时间
	var begin = new Date();
	//定时器指引
	var timer = null;
	return function(){
		//总是清除上一次回调
		clearTimeout(timer);
		//获取当前时间
		var now = new Date();
		//当时间间隔大于设定，执行回调
		if (now - begin > interval) {
			//重置开始时间
			begin = now;
			fn();
		}else{
			timer = setTimeout(function(){
				//若距离上一次触发大于时间间隔，执行一次回调
				begin = now;
				fn();
			},interval)
		}
	}
}
var scroll = throttle(function(){
	console.log('do something!!!')
},500)
window.onscroll = scroll;
```


## js监听对象属性的改变
##### 在ES5中可以通过Object.defineProperty来实现已有属性的监听
```js
Object.defineProperty(user,'name',{
    set：function(key,value){
    }
})
```
缺点：如果属性不在user对象中，则不能监听该属性的变化

##### 在ES6中可以通过Proxy来实现
```js
var  user = new Proxy({}，{
 set：function(target,key,value,receiver){
  }
})
```
这样即使有属性在user中不存在，通过user.id来定义也同样可以这样监听这个属性的变化。


## Object.is
```js
// 特例
Object.is(0, -0);            // false
Object.is(-0, -0);           // true
Object.is(NaN, 0/0);         // true

if (!Object.is) {
  Object.is = function(x, y) {
    if (x === y) {
      // +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // NaN == NaN
      return x !== x && y !== y;
    }
  };
}
```

## requestAnimationFrame 与 cancelAnimationFrame
大多数电脑显示器的刷新频率是60Hz，大概相当于每秒钟重绘60次。大多数浏览器都会对重绘操作加以限制，不超过显示器的重绘频率，因为即使超过那个频率用户体验也不会有提升。因此，最平滑动画的最佳循环间隔是1000ms/60，约等于16.6ms

而setTimeout和setInterval的问题是，它们都不精确。它们的内在运行机制决定了时间间隔参数实际上只是指定了把动画代码添加到浏览器UI线程队列中以等待执行的时间。如果队列前面已经加入了其他任务，那动画代码就要等前面的任务完成后再执行。

requestAnimationFrame采用系统时间间隔，保持最佳绘制效率，不会因为间隔时间过短，造成过度绘制，增加开销；也不会因为间隔时间太长，使用动画卡顿不流畅，让各种网页动画效果能够有一个统一的刷新机制，从而节省系统资源，提高系统性能，改善视觉效果。

特点

 - requestAnimationFrame会把每一帧中的所有DOM操作集中起来，在一次重绘或回流中就完成，并且重绘或回流的时间间隔紧紧跟随浏览器的刷新频率
 - 在隐藏或不可见的元素中，requestAnimationFrame将不会进行重绘或回流，这当然就意味着更少的CPU、GPU和内存使用量
 - requestAnimationFrame是由浏览器专门为动画提供的API，在运行时浏览器会自动优化方法的调用，并且如果页面不是激活状态下的话，动画会自动暂停，有效节省了CPU开销

```js
var a = 1;
var cb = function(){
	console.log(a++);
	if (a > 100) {
		cancelAnimationFrame(timer);
	}else{
		requestAnimationFrame(cb)
	}
}
var timer = requestAnimationFrame(cb);
```


## 用 setTimeout 模拟 setInterval
```js
function interval(func, wait, times){
    var interv = function(w, t){
        return function(){
            if(typeof t === "undefined" || t-- > 0){
                setTimeout(interv, w);
                try{
                    func.call(null);
                }
                catch(e){
                    t = 0;
                    throw e.toString();
                }
            }
        };
    }(wait, times);
    setTimeout(interv, wait);
};
```


## 任务队列

 - 先主线程，后任务队列；
 - 先微任务（promise,nextTick），后宏任务(setTimeout)；
 - 先nextTick，后promise（then）



## 数组去重

###### 利用对象的属性不能相同（有漏洞，数组值是引用类型时做键值会先调用toString）

```js
Array.prototype.distinct = function (){
 var arr = this,
  i,
  obj = {},
  result = [],
  len = arr.length;
 for(i = 0; i< arr.length; i++){
  if(!obj[arr[i]]){ //如果能查找到，证明数组元素重复了
   obj[arr[i]] = 1;
   result.push(arr[i]);
  }
 }
 return result;
};
var a = [1,2,3,4,5,6,5,3,2,4,56,4,1,2,1,1,1,1,1,1,];
var b = a.distinct();
```

###### 利用indexOf以及forEach

###### 利用数组sort方法先排序

```js
Array.prototype.distinct = function(){
 var len = this.length,res = [];
 if(len < 2){ return this;}
 this.sort(); //先排序
 for(var i = 0; i < len - 1; i++){
  if(this[i] !== this[i+1]){
   res.push(this[i]);
  }
 }
 //最后那位不会重复
 res.push(this[this.length-1])
 return res;
}
```


###### 利用ES6的set

```js
//利用Array.from将Set结构转换成数组
function dedupe(array){
 return Array.from(new Set(array));
}
dedupe([1,1,2,3]);

//拓展运算符(...)内部使用for...of循环
let arr = [1,2,3,3];
let resultarr = [...new Set(arr)];
console.log(resultarr); //[1,2,3]
```



```js
Array.prototype.distinct = function (){
 var arr = this,
  result = [],
  len = arr.length;
 arr.forEach(function(v, i ,arr){  //这里利用map，filter方法也可以实现
  var bool = arr.indexOf(v,i+1);  //从传入参数的下一个索引值开始寻找是否存在重复
  if(bool === -1){
   result.push(v);
  }
 })
 return result;
};
var a = [1,1,1,1,1,1,1,2,3,2,3,2,3];
var b = a.distinct();
```




## 排序算法

##### 冒泡排序

```js
function swap(arr,i,j){
	var temp = arr[i];
	arr[i] = arr[j];
	arr[j] = temp;
}

//冒泡排序
function bubbleSort(arr){
	for (var i = arr.length - 1; i > 0; i--) {
		for (var j = 0; j < i; j++) {
			if (arr[j] > arr[j+1]) {
				swap(arr,j,j+1)
			}
		}
	}
	return arr;
}
```

##### 选择排序

```js
//选择排序
function selectionSort(arr){
	for (var i = 0; i < arr.length - 1; i++) {
		var index = i;
		for (var j = i + 1; j < arr.length; j++) {
			if (arr[j] < arr[index]) {
				index = j;
			}
		}
		swap(arr,i,index);
	}
	return arr;
}
```

##### 插入排序

```js
//插入排序
function insertionSort(arr){
	for (var i = 1; i < arr.length; i++) {
		var temp = arr[i];
		var j = i;
		while(j > 0 && arr[j - 1] > temp){
			swap(arr,j,j-1);
			j--;
		}
	}
	return arr;
}
```


##### 希尔排序

```js
//希尔排序
function shellSort(arr){
	var interval = Math.floor(arr.length/2);
	while(interval > 0){
		for (var i = 0; i < interval; i++) {
			for (var j = i + interval; j < arr.length; j = j + interval) {
				var temp = arr[j];
				var index = j;
				while(index > 0 && arr[index - interval] > temp){
					swap(arr,index,index - interval);
					index = index - interval;
				}
			}
		}
		if (interval == 1) {
			return arr;
		}
		interval = Math.floor(interval/3) + 1;
	}
	return arr;
}
```

##### 归并排序

```js
//归并排序

function mergeSort(arr){
	if (arr.length < 2) {return;}
	var step = 1;
	var left,right;
	while(step < arr.length){
		left = 0;
		right = step;
		while(right + step <= arr.length) {
			mergeArr(arr,left,left+step,right,right+step);
			left = right + step;
			right = left + step;
		}
		if (right < arr.length) {
			mergeArr(arr,left,left+step,right,arr.length)
		}
		step *= 2;
	}
	return arr;
}

function mergeArr(arr, startLeft, stopLeft, startRight, stopRight){
	var leftArr = new Array(stopLeft - startLeft + 1);
	var rightArr = new Array(stopRight - startRight + 1);
	var k = startLeft;
	for (var i = 0; i < leftArr.length; i++) {
		leftArr[i] = arr[k++];
	}
	k = startRight;
	for (var i = 0; i < rightArr.length; i++) {
		rightArr[i] = arr[k++];
	}
	rightArr[rightArr.length-1] = Infinity; // 哨兵值
    leftArr[leftArr.length-1] = Infinity; // 哨兵值
    var n = 0,m = 0;
    for (var i = startLeft; i < stopRight; i++) {
    	if (leftArr[m] > rightArr[n]) {
    		arr[i] = rightArr[n++];
    	}else{
    		arr[i] = leftArr[m++];
    	}
    }
}
```


##### 快速排序

```js
//快速排序
function qSort(list) {
	if (list.length == 0) {
		return [];
	}
	var lesser = [];
	var greater = [];
	var pivot = list[0];
	for (var i = 1; i < list.length; i++) {
		if (list[i] < pivot) {
			lesser.push(list[i]);
		} else {
			greater.push(list[i]);
		}
	}
	return qSort(lesser).concat(pivot, qSort(greater));
}

//递归型
function recurQuickSort(arr,startIndex,endIndex){
	if (startIndex >= endIndex) {return;}
	var pivotIndex = partition(arr,startIndex,endIndex);
	recurQuickSort(arr,startIndex,pivotIndex);
	recurQuickSort(arr,pivotIndex + 1,endIndex);
	return arr;
}

//非递归型
function  quickSort(arr){
	var stack = [];
	var param = {
		start:0,
		end:arr.length - 1
	}
	stack.push(param);
	while(stack.length > 0){
		var curParam = stack.pop();
		var pivotIndex = partition(arr,curParam.start,curParam.end);
		if (curParam.start < pivotIndex) {
			stack.push({
				start:curParam.start,
				end:pivotIndex
			})
		}
		if (curParam.end > pivotIndex) {
			stack.push({
				start:pivotIndex + 1,
				end:curParam.end
			})
		}
	}
	return arr;
}

//交换左右位置
function partition(arr,startIndex,endIndex){
	var pivot = arr[startIndex];
	var start = startIndex,end = endIndex;
	while(start < end){
		while(start < end){
			if (arr[end] < pivot) {
				break;
			}else{
				end--;
			}
		}
		while(start < end){
			if (arr[start] > pivot) {
				break;
			}else{
				start++;
			}
		}
		swap(arr,start,end);
	}
	swap(arr,startIndex,start);
	return start;
}
```


## [javascript 中常见的内存泄露陷阱](http://web.jobbole.com/88463/)

 - 意外的全局变量
 - 被遗漏的定时器和回调函数，回调函数中保持着外部变量的引用
 - js对DOM 的引用，即使该DOM节点被移除，若依然保持着引用，则该DOM节点依然在内存中
 - 闭包




## babel把ES6转成ES5或者ES3之类的原理

它就是个编译器，输入语言是ES6+，编译目标语言是ES5。

 - 解析：将代码字符串解析成抽象语法树
 - 变换：对抽象语法树进行变换操作
 - 再建：根据变换后的抽象语法树再生成代码字符串




## 前端工程与性能优化

| 优化方向 |	优化手段 |
| --------   | -----  |
| 请求数量 |	合并脚本和样式表，CSS Sprites，拆分初始化负载，划分主域 |
|请求带宽 	| 开启GZip，精简JavaScript，移除重复脚本，图像优化|
|缓存利用 	| 使用CDN，使用外部JavaScript和CSS，添加Expires头，减少DNS查找，配置ETag，使AjaX可缓存|
|页面结构 	|将样式表放在顶部，将脚本放在底部，尽早刷新文档的输出|
|代码校验 	|避免CSS表达式，避免重定向|




## ES6模块与CommonJS模块的差异

 - CommonJs 模块输出的是一个值的拷贝，ES6模块输出的是一个值的引用
 - CommonJS 模块是运行时加载，ES6模块是编译时输出接口
 - ES6输入的模块变量，只是一个符号链接，所以这个变量是只读的，对它进行重新赋值就会报错

CommonJs所谓值的拷贝类似于对module.exports对象的一个浅拷贝，基本类型值无法被修改，引用类型值则依然保存着对模块的引用，类似闭包。

ES6模块输出的是值的引用，指的是import的对象保存着对模块的作用域的引用，并且该作用域是可以共享的。换句话说ES6模块export唯一一个实例，被所有import的对象共享。

##### ES6 模块加载 CommonJS 模块

Node 的import命令加载 CommonJS 模块，Node 会自动将module.exports属性，当作模块的默认输出，即等同于export default xxx。

```js
// a.js
module.exports = {
  foo: 'hello',
  bar: 'world'
};
// 等同于
export default {
  foo: 'hello',
  bar: 'world'
};
```

##### CommonJS 模块加载 ES6 模块

CommonJS 模块加载 ES6 模块，不能使用require命令，而要使用import()函数。ES6 模块的所有输出接口，会成为输入对象的属性。

```js
// es.js
export let foo = { bar:'my-default' };
export { foo as bar };
export function f() {};
export class c {};

// cjs.js
const es_namespace = await import('./es');
// es_namespace = {
//   get foo() {return foo;}
//   get bar() {return foo;}
//   get f() {return f;}
//   get c() {return c;}
// }
```



## 浅拷贝和深拷贝的问题

 - 深拷贝和浅拷贝是只针对Object和Array这样的复杂类型的
 - 也就是说a和b指向了同一块内存，所以修改其中任意的值，另一个值都会随之变化，这就是浅拷贝
 - 浅拷贝， ”Object.assign() 方法用于将所有可枚举的属性的值从一个或多个源对象复制到目标对象。它将返回目标对象
 - 深拷贝，JSON.parse()和JSON.stringify()给了我们一个基本的解决办法。但是函数不能被正确处理


## 函数柯里化

```js
function curry(fn){
    var args = Array.prototype.slice.call(arguments, 1);
    return function(){
    	var innerArgs = Array.prototype.slice.call(arguments);
        var finalArgs = args.concat(innerArgs);
        return fn.apply(null, finalArgs);
    };
}
```



## 原生Ajax书写

```js
function createXHR(){
	if (typeof XMLHttpRequest != "undefined"){
		return new XMLHttpRequest();
	} else if (typeof ActiveXObject != "undefined"){
		var versions = [ "MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0", "MSXML2.XMLHttp"],
		i, len,xml;
		for (i=0,len=versions.length; i < len; i++){
			try {
				xml = new ActiveXObject(versions[i]);
				break;
			} catch (ex){//跳过
			}
		}
		return xml;
	} else {
		throw new Error("No XHR object available.");
	}
}
var xhr = createXHR();
xhr.onreadystatechange = function(){
    // 通信成功时，状态值为4
    if (xhr.readyState === 4){
	  	if (xhr.status === 200){
	  		console.log(xhr.responseText);
	  	} else {
	  		console.error(xhr.statusText);
	  	}
    }
};
xhr.onerror = function (e) {
	console.error(xhr.statusText);
};
xhr.open('GET', '/endpoint', true);
xhr.send(null);
```



## ES5继承与Class继承的区别
ES5 的继承，实质是先创造子类的实例对象this，然后再将父类的方法添加到this上面（Parent.apply(this)）。

ES6 的继承机制完全不同，实质是先将父类实例对象的属性和方法，加到this上面（所以必须先调用super方法），然后再用子类的构造函数修改this。

如果子类没有定义constructor方法，这个方法会被默认添加。也就是说，不管有没有显式定义，任何一个子类都有constructor方法。


