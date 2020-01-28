---
title: 菜鸟解读jQuery源码系列-六-函数管理专家Callback
date: 2020-01-28 14:32:16
categories:
tags:
---
## 前言 ##
从这一篇开始，我们就要真正进入jQuery的奥秘大陆了！之前的五个系列虽然略显拖沓，但毕竟是打开新世界的钥匙，详细一点是很有必要的。相信仔细看过一遍的小伙伴也会感同身受。

那有的小伙伴就担心了，我前面都没看，这一篇能不能看呢？额，我有说过不能看吗？有说过吗？ 唉，显然是没有的事嘛！正所谓即使你不知道你是如何来到这世界的，也不影响你在这片土地快乐的生活呀。

好啦，废话到此为止，进入正题。

## 一个栗子 ##
先看一个jQuery的API，也就是今天的主题 `Callback` (自行引入库测试)：

```js
function fn1( value ) {
  console.log( "新书发行啦" );
}
function fn2( value ) {
  console.log( "新电影上映啦" );
}
//创建一个callback对象
var cb = $.Callbacks();
//添加回调函数
cb.add( fn1,fn2 );
//触发回调函数
cb.fire();// "新书发行啦" "新电影上映啦"
```

这时有的小伙伴就郁闷了，不是上一篇才讲的异步回调么，怎么这次又是回调？

好吧，事实上，回调在JavaScript中是一个比较广泛的概念，就比如现实生活中的美食一样，上次讲的是“中华美食上下五千年”，并不妨碍这次讲“满汉全席”对不对？至于其中区别，本人也懒得厘清了，各位自行体会就好。


## 简单的实现 ##
按照惯例，我们目的并不是学习这个API，这对我们并没有什么太大的意义。模拟源码的实现，才是我们所追求的。继续看代码：

```js
function Callbacks(){
	// 每次调用Callbacks函数都要返回一个实例，很容易想到这样的实现。
	return {
    	//用一个数组装回调函数
    	list:[],
        //添加回调函数
    	add: function(){
            //把回调函数存到list数组中
            Array.prototype.push.apply(this.list,arguments);
        },
        //触发回调函数
        fire:function(){
        	// 逐一调用回调函数
        	this.list.forEach((item) => {
            	item();
            })
        }
    }
}
var cb = Callbacks();
cb.add(fn1,fn2);
cb.fire(); //新书发行啦 新电影上映啦
```

好啦，jQuery中的Callbacks就实现啦，收工！！

小伙伴们顿时兴奋了起来，这么简单呀，John Resig不过如此嘛！！


#### 做人还是要谦虚一点
好吧，这句话其实是对我自己说的，我可不是在说你们啊，别瞎猜啊（否认三连）。

其实呢，原理就是这么简单，不过，复杂的是需求。接下来我们就尝试着给它提需求吧。


## 回调函数的唯一性（unique）
上面的实现，如果我们这样调用：
```js
//重复添加fn1
cb.add(fn1,fn1,fn2);
cb.fire();//新书发行啦 新书发行啦 新电影上映啦
```
显然，这不是我们想要的，但是无意中重复添加回调函数是常有的情况，这要如何避免呢？这个需求对很多小伙伴来说还是很简单的：
```js
function Callbacks(option){
	// 设置默认配置
    option = option || {unique: false};
	return {
    	//用一个数组装回调函数
    	list:[],
        //添加回调函数
    	add: function(){
            // 收集回调函数
            var fns = Array.prototype.slice.call(arguments);
            if(option.unique){
            	fns.forEach( item => {
                    //判断回调函数是否已经存在，不存在则添加
                    if(!this.list.includes(item)){
                        this.list.push(item)
                    }
                })
            }else{
            	Array.prototype.push.apply(this.list,fns);
            }
        },
        //触发回调函数
        fire:function(){
        	// 逐一调用回调函数
        	this.list.forEach((item) => {
            	item();
            })
        }
    }
}
var cb = Callbacks({unique:true});
cb.add(fn1,fn2,fn1,fn2);
cb.fire(); //新书发行啦 新电影上映啦
```


## 回调函数的记忆功能（memory）
真正的开发中，比较头疼的一个问题就是，我们不得不注意函数的调用先后顺序，比如上面的栗子：
```js
var cb = Callbacks({unique:true});
cb.add(fn1);
cb.fire();//新书发行啦
cb.add(fn2); // fn2没有触发
```
能不能实现一个功能，无论`add(fn2)`在前还是在后，都能够触发所有的回调函数呢？

```js
function Callbacks(option){
	// 设置默认配置
    option = option || {unique: false,memory:false};
    //触发回调函数的起点
    var firingStart = 0;
    // 有没有触发过回调函数
    var fired = false;
	return {
    	//用一个数组装回调函数
    	list:[],
        //添加回调函数
    	add: function(){
        	//添加回调函数前，记住原数组的长度；
        	firingStart = this.list.length;
            // 收集回调函数
            var fns = Array.prototype.slice.call(arguments);
            if(option.unique){
            	fns.forEach( item => {
                    //判断回调函数是否已经存在，不存在则添加
                    if(!this.list.includes(item)){
                        this.list.push(item)
                    }
                })
            }else{
            	Array.prototype.push.apply(this.list,fns);
            }
            //若开启记忆功能
            if(option.memory && fired){
            	// 手动触发回调
            	this.fire();
            }else{
            	firingStart = 0; //没有记忆功能跟还没触发，则永远是0；
            }
        },
        //触发回调函数
        fire:function(manual){
        	//表示函数已经触发过
        	fired = true;
        	// 逐一调用回调函数
        	for(var i = firingStart || 0; i < this.list.length; i++ ){
            	(this.list[i])();
            }
        }
    }
}
var cb = Callbacks({memory:true});
cb.add(fn1);
cb.fire();//新书发行啦 新电影上映啦
cb.add(fn2);
```


## 修复重复调用功能 ##
实现了回调函数的记忆功能之后，我们又面临了一个全新的问题（修不完的bug）,就是此时重复调用功能失效了！

```js
var cb = Callbacks({memory:true});
cb.add(fn1);
cb.fire();//新书发行啦 新电影上映啦
cb.add(fn2);
//firingStart不是0了，所以不再从头开始调用了
cb.fire(); // 新电影上映啦
```

所以这个时候需要重构一下，把`fire`方法抽离出来，这样就能轻易的控制其调用的初始状态了：

```js
function Callbacks(option){
	// 设置默认配置
    option = option || {unique: false,memory:false};
    //触发回调函数的起点
    var firingStart = 0;
    // 有没有触发过回调函数
    var fired = false;
    //抽离成一个公共函数
    function fire(data){
        //表示函数已经触发过
        fired = true;
        for(var i = firingStart || 0; i < data.length; i++ ){
            (data[i])();
        }
    }
	return {
    	//用一个数组装回调函数
    	list:[],
        //添加回调函数
    	add: function(){
        	//添加回调函数前，记住原数组的长度；
        	firingStart = this.list.length;
            // 收集回调函数
            var fns = Array.prototype.slice.call(arguments);
            if(option.unique){
            	fns.forEach( item => {
                    //判断回调函数是否已经存在，不存在则添加
                    if(!this.list.includes(item)){
                        this.list.push(item)
                    }
                })
            }else{
            	Array.prototype.push.apply(this.list,fns);
            }
            //若开启记忆功能
            if(option.memory && fired){
            	// 手动触发回调,调用公共fire
            	fire(this.list);
            }else{
            	firingStart = 0; //没有记忆功能跟还没触发，则永远是0；
            }
        },
        //触发回调函数
        fire:function(){
            //从0开始
            firingStart = 0;
            fire(this.list);
        }
    }
}
var cb = Callbacks({memory:true});
cb.add(fn1);
cb.fire();//新书发行啦 新电影上映啦
cb.add(fn2);
cb.fire();//新书发行啦 新电影上映啦
```

## 回调函数跳出（stopOnFalse）
我们经常看到一种场景，就是回调返回 `false` 的时候，接下来的一系列函数将不再继续执行，这也很简单：
```js
function Callbacks(option){
	//省略代码
    function fire(data){
        //表示函数已经触发过
        fired = true;
        for(var i = firingStart || 0; i < data.length; i++ ){
            if ((data[i])() === false){//等于false时跳出循环
            	break;
            }
        }
    }
    //省略代码
}
```


## 源码实现
总的来说，jQuery里面的回调还是有些复杂，上面的只是主要思路的重现，并不代表源码也是这样实现：
```js
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// ... 省略部分代码
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			}
		};

	return self;
};
```

## 结尾
jQuery源码通过闭包形式返回一个callback对象，可以通过该对象对一系列函数进行管理控制。在动画运动，事件绑定，延迟对象等功能中，都是以回调对象为基础进行实现，所以，理解该API源码的实现对于接下来源码的阅读都有着重要的作用。

好啦，先这样吧。因为这一篇代码贴的有点长，所以大家看得可能并不是太爽，不过没有关系，代码的实现是有多种方式的，这里主要是重现了一下思路吧，大伙提纲挈领的看看即可，若要深究，去看看源码就好啦。








