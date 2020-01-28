---
title: 探秘Promise的实现原理
date: 2020-01-28 14:32:01
categories:
tags:
---
## 前言
前面写了很多关于异步回调的文章了，大伙对于Promise的认识可谓再也熟悉不过了。今天我们也就不再炒冷饭了，而是换个角度，手动实现一个自己的promise。还不了解Promise的小伙伴，先去了解一番其基本用法再来阅读更佳。

## 提个问题
先看代码：
```js
var promise = new Promise((resolve,reject)=>{
	console.log("I am in promise"); //执行
});
var then1 = promise.then((res) => {
	console.log("I am in then1"); //这句不会执行
});
var then2 = then1.then((res) => {
	console.log("I am in then2"); //这句不会执行
});
console.log(then1 instanceof Promise);//true
console.log(then2 instanceof Promise);//true
console.log(promise === then1);//false
console.log(then1 === then2);//false
```

上面代码是我们再也熟悉不过的了。不过，你们从上面的执行结果中看出了什么了呢？

 - Promise 构造函数里面的参数函数同步执行
 - then 方法每次都返回一个全新的Promise
 - then 方法同步顺序执行，只是方法内的回调函数异步执行

第一，二点我们之前有提过，更多人会忽略的是第三点。

有人不解了，then 方法同步执行确实有人会忽略，因为有的人会粗心大意的以为它是在回调调用的时候才执行，但是你又怎么证明呢？

其实证明已经在上面了， `then1 != then2` 充分证明了then方法已经调用并返回一个全新的 Promise 。

说这些有啥用呢？

对于小伙伴大佬来说，这确实是一段废话，不过对于其他小伙伴来说，认清这个知识点对理解下面代码还是有帮助的。


## 初步实现
对照原生的Promise，我们知道它是一个构造函数，这样的话，照葫芦画瓢就好了：

```js
function MyPromise(executor){
	//初始状态
	this.state = 'pending';
    //存放then方法中的回调函数参数
	this.resolvedCallback = [];
	this.rejectedCallback = [];
    //executor的成功回调函数参数
	function resolve(value){
		this.state = 'fullfilled';
        this.resolvedCallback.forEach(function(item){
            item(value);
        })
	}
    //executor的失败回调函数参数
	function reject(value){
		this.state = 'rejected';
        this.rejectedCallback.forEach(function(item){
            item(value);
        })
	}
	//构造函数执行，executor立即执行
    //因为resolve，reject都是在函数外执行，需要绑定this指向
	executor(resolve.bind(this),reject.bind(this));
}
```

构造函数初步实现，我们看看最关键的then方法。

因为每个Promise对象都有一个then方法，所以，我们需把它定义在原型上：

```js
MyPromise.prototype.then = function(onResolved,onRejected){
	var pendingPromise;
	//当状态为pending时，此时this指向上一个Promise实例
	if (this.state === 'pending') {
    	//返回一个全新的实例 pendingPromise
		return pendingPromise = new MyPromise((resolve,reject) => {
        	//存储then方法中的成功回调函数到上一个实例
			this.resolvedCallback.push(function(value){
            	//通过一个匿名函数包装起来，等待上一个实例resolve执行
				var res = onResolved(value);
                //判断是否返回一个Promise对象
				if (res instanceof MyPromise) {
                	//pendingPromise实例的控制权交由res实例控制
					res.then(resolve,reject);
				}else{
                	//直接改变pendingPromise实例的状态，执行下一个then方法的成功回调函数
					resolve(res);
				}
			});
            //存储then方法中的失败回调函数到上一个实例
			this.rejectedCallback.push(function(value){
				var res = onRejected(value);
				if (res instanceof MyPromise) {
					res.then(resolve,reject);
				}else{
					reject(res);
				}
			});
		})
	}
}
```

这是一段核心代码，而且有点绕，需要小伙伴们仔细阅读注释以助理解。这里我再多解释几句。

##### 一、为什么只需判断 `pending` 状态？

前面我们已经知道，因为 then 方法是顺序同步执行的，在executor函数里面是异步调用 `resolve` 方法的前提下，then 方法调用时，状态都还没改变，也就是都还是 pending 状态。所以无需判断其他状态。

##### 二、`pendingPromise` 实例是一个什么样的状态？

很好，既然你都说是实例，也就是构造函数已经执行了，前面我们同样也已经知道，构造函数一执行，executor函数也是立即执行的。

换句话说

 1.   初始生成一个MyPromise实例
 2.   executor函数执行
 3.   then 方法执行
 4.   生成一个新实例，executor函数执行
 5.   then方法的回调函数被添加到上一个实例resolvedCallback中
 6.   若还有then方法，重复 3，4，5，6

##### 三、then方法中的 `onResolved` 与 `onRejected` 存放在哪里？

为了说明这个问题，我们来看一段伪代码：
```js
new MyPromise(function(){
	//初始生成一个MyPromise实例
}).then(
	//生成一个新实例pendingPromise1，executor函数执行
    //this指向MyPromise实例
    //onResolved被包装在一个匿名函数中，存储到this.resolvedCallback中
    //返回pendingPromise1实例
).then(
	//生成一个新实例pendingPromise2，executor函数执行
    //this指向pendingPromise1实例
    //onResolved被包装在一个匿名函数中，存储到this.resolvedCallback中
     //返回pendingPromise2实例
)
```

##### 四、resolve 调用时发生了什么？

在说明这个过程之前，我们先测试一下上面的代码能不能执行：
```js
new MyPromise(function(resolve,reject){//初始生成一个MyPromise实例
	setTimeout(function(){
		resolve(123)
	},1000)
}).then(function(res){//生成一个新实例pendingPromise1
	console.log(res);
	return new MyPromise(function(resolve,reject){
		setTimeout(function(){
			resolve(456)
		},1000)
	})
}).then(function(res){//生成一个新实例pendingPromise2
	console.log(res)
});
//123
//456
```

很好，经过测试，上例代码完美异步执行了。但是这时小伙伴肯定还是充满疑惑。我们就针对这段代码分析其中的过程。

 - then 方法同步顺序执行，所以在第一个实例的resolve函数执行之前，该段代码已经生成三个MyPromise实例了。
 - 在生成MyPromise实例的同时，把then方法的成功与失败回调函数分别存储到上一个实例中。
 - then中回调函数参数通过匿名函数包装起来，并且还包含着当前实例的 resolve 跟 reject 方法，这也就前后两个实例的联系的桥梁。
 - resolve 函数调用时，执行当前实例存储的回调函数。回调函数又保存着下一个实例的 resolve 与 reject 方法指引，继续触发下一个实例的resolve。
 - 当回调函数返回一个 MyPromise 实例时，则交由该实例控制下一个实例的 resolve 异步调用的时机。


## 进一步完善
好了，认真读到这里的小伙伴，所有的核心代码其实已经接触到了，下面主要是进一步完善而已。

##### 保证 resolve 异步执行
前面已经提到，当resolve 异步执行的时候，then 方法已经全部调用了，并生成了所有的实例。

但是我们也知道，原生的Promise有时并没有异步调用 resolve，这个时候如果按照目前的实现，resolve同步调用时，后面的then方法还没调用，也就是说还没有生成全部的实例，换句话说回调函数还没存储起来，整个流程也就无法进行下去了，所以我们需要做一些处理：
```js
function resolve(value){
	//避免resolve传进MyPromise实例的情况
    if (value instanceof MyPromise) {
      return value.then(resolve, reject)
    }
    //保证回调函数的调用异步执行，此时回调函数已经被存储起来了
    setTimeout(() => {
        this.state = 'fullfilled';
        this.resolvedCallback.forEach(function(item){
            item(value);
        })
    })
}
```

嗯，就是这么简单。不过这里跟原生有个区别，原生的Promise属于微任务，setTimeout却属于宏任务，也就是说，原生Promise的执行优先级是在setTimeout之前的，这也就导致我们的实现跟原生有一丝的区别。

##### 值的传递
原生中经常有这样的场景：
```js
new Promise((resolve,reject)=>{
	setTimeout(() => {
        resolve(123)
    },1000)
}).then().then((res)=>{console.log(res)})
```

所以我们需要保证then方法无参情况下值的传递：
```js
MyPromise.prototype.then = function(onResolved,onRejected){
	//保证有默认的回调函数
	onResolved = typeof onResolved === 'function' ? onResolved : function(res){return res;}
	onRejected = typeof onRejected === 'function' ? onRejected : function(value){return value;}

    //....
}
```

##### catch方法的实现
catch 方法本质上还是then方法：
```js
MyPromise.prototype.catch = function(onRejected){
	//调用then方法即可
	this.then(null,onRejected);
}
```

上面我们实现resolve 与 reject 方法时，是可以接收任何值的，下面我们对then方法做一些修改，reject 方法可以接收报错信息：

```js
//....
//没有 reject 函数处理，则继续抛出错误，等待下一个实例的 reject 函数接收
onRejected = typeof onRejected === 'function' ? onRejected : function(err){throw err;}
return new MyPromise((resolve,reject) => {
    this.resolvedCallback.push(function(value){
        try{
            var res = onResolved(value);
            if (res instanceof MyPromise) {
                res.then(resolve,reject);
            }else{
                resolve(res);
            }
        }catch(e){//报错则调用下一个实例的reject函数
            reject(e)
        }
    });
    this.rejectedCallback.push(function(value){
        try{
            var res = onRejected(value);
            if (res instanceof MyPromise) {
                res.then(resolve,reject);
            }
        }catch(e){//报错则调用下一个实例的reject函数
            reject(e);
        }
    });
})
```

## 完整代码
```js
function MyPromise(executor){
	this.state = 'pending';
	this.resolvedCallback = [];
	this.rejectedCallback = [];

	function resolve(value){
		if (value instanceof MyPromise) {
	      return value.then(resolve, reject)
	    }
		setTimeout(() => {
			this.state = 'fullfilled';
			this.resolvedCallback.forEach(function(item){
				item(value);
			})
		})
	}

	function reject(value){
		setTimeout(() => {
			this.state = 'rejected';
			this.rejectedCallback.forEach(function(item){
				item(value);
			})
		})
	}

	try{
		executor(resolve.bind(this),reject.bind(this));
	}catch(e){
		reject.call(this,e);
	}
}

MyPromise.prototype.then = function(onResolved,onRejected){
	onResolved = typeof onResolved === 'function' ? onResolved : function(res){return res;}
	onRejected = typeof onRejected === 'function' ? onRejected : function(err){throw err;}

	/*if (this.state === 'fullfilled') {
		return new MyPromise(function(resolve,reject){
			var res = onResolved(this.data);
			if (res instanceof MyPromise) {
				res.then(resolve,reject);
			}else{
				resolve(res);
			}
		})
	}

	if (this.state === 'rejected') {
		return new MyPromise(function(resolve,reject){
			var res = onRejected(this.data);
			if (res instanceof MyPromise) {
				res.then(resolve,reject);
			}else{
				reject(res);
			}
		})
	}*/

	if (this.state === 'pending') {
		return new MyPromise((resolve,reject) => {
			this.resolvedCallback.push(function(value){
				try{
					var res = onResolved(value);
					if (res instanceof MyPromise) {
						res.then(resolve,reject);
					}else{
						resolve(res);
					}
				}catch(e){
					reject(e)
				}
			});
			this.rejectedCallback.push(function(value){
				try{
					var res = onRejected(value);
					if (res instanceof MyPromise) {
						res.then(resolve,reject);
					}
				}catch(e){
					reject(e);
				}
			});
		})
	}
}

MyPromise.prototype.catch = function(onRejected){
	this.then(null,onRejected)
}
```

##### 测试代码
```js
new MyPromise(function(resolve,reject){
	setTimeout(function(){
		resolve(123)
	},1000)
}).then(function(res){
	console.log(res);
	throw Error('eee')
	return new MyPromise(function(resolve,reject){
		setTimeout(function(){
			resolve(456)
		},1000)
	})
}).then(function(res){
	console.log(res);
}).catch(function(e){
	console.log(e)
})
```

## 总结
好啦，Promise 的原理探秘就到这里了。有的小伙伴可能就有些纳闷，说我看到过更加细致的实现，比如resolvePromise实现不同Promise之间的交互之类的（有多种Promise库）。但是我们真正的目的并不是要实现一个给我们使用的Promise，毕竟再努力也赶不上原生给我们提供的不是吗？（唉，渣渣的无奈），所以，我们的目标是通过探究其中的原理来开阔一下自己的视野，我觉得这才是最有意义的。

有兴趣的小伙伴可以在前面代码的基础上，尝试扩展一下MyPromise.all,MyPromise.race等静态工具方法，这里就不展开啦，就酱。




