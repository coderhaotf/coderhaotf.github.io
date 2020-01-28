---
title: 菜鸟解读jQuery源码系列-五-海纳百川的extend
date: 2020-01-28 14:32:15
categories:
tags:
---
## 引言 ##
看过前几章的小伙伴看到这里时，应该都有些火大了，不是说源码吗，讲了大半天了，怎么还是那一点东西！！！提起这一茬，不说你们了，其实我都有点火大！想当年啊，我也幻想从源码中获取到那么一丝丝不为人知，独步天下的武林秘籍，可是呢？！可是呢？！好啦好啦，吹水到此为止，其实吧，我一开始就说了，我这个系列是新瓶装旧酒，说是读jQuery源码，本质还是为了从中学习JavaScript的，而且呢，到底要写多少，我自己也没个数，写到哪算哪这种（想通过这个系列熟读jQuery源码的小伙伴别打我！！！）其中到底有多少干货，大伙心里自有一杆秤，我呢，不求普度众生，只求问心无愧，尽一点微薄之力，让各位小伙伴看个乐呵就可以了。

废话少说，进入今天正题。


## 一些栗子 ##
在平时的开发中，我们面对最多的就是对象了，正如一句口头禅，处处皆对象，是一点也不夸张。针对对象的操作也是经常要面对的，下面就看看jQuery提供的一个针对对象的API：
```js
var object1 = {
  apple: 0,
  banana: { weight: 52, price: 100 },
  cherry: [1,2,3]
};
var object2 = {
  banana: { price: 200 },
   cherry: [4,5]
};
$.extend( object1, object2 );
//{"apple":0,"banana":{"price":200},"cherry":[4, 5]}
$.extend( true, object1, object2 );
//{"apple":0,"banana":{"weight":52,"price":200},"cherry":[4, 5, 3]}
```
有些小伙伴肯定觉得很眼熟，没错，其实这就是传说中的浅拷贝与深拷贝。显而易见，浅拷贝只是针对对象的第一层属性做拷贝，后面对象的属性值完全覆盖掉前面对象的属性值，深拷贝则表现得更为宽容一些，它会层层递归，把每一层的非对象属性值覆盖掉。

## 班门弄斧 ##
#### 浅拷贝
按照惯例，在看源码之前，我们先思考一下，看看能不能自己实现一个啦：

```js
//浅拷贝
function simpleExtend(){
	//arguments是类数组，所以即使无参数也不会报错，undefined,null调用则报错，其他非类数组类型值则返回空数组；
	var arr = Array.prototype.slice.call(arguments);
    //当参数小于两个时,直接返回；
    if(arr.length < 2){ return arr[0]; }
    //获取目标对象
    var target = arr[0];
    //从第二个参数开始，for-in遍历每个参数的每一个属性，把它赋值到目标对象;
    for(var i = 1; i < arr.length; i++){
    	for(var key in arr[i]){
        	target[key] = arr[i][key]; //赋值到目标对象
        }
    }
    return target;
}
simpleExtend( object1, object2 );
//{"apple":0,"banana":{"price":200},"cherry":[4, 5]}
```

从上面可以看出，浅拷贝还是很简单的，双重循环即可。


#### 深拷贝
在贴出代码之前，我们先思考一下，深拷贝跟浅拷贝的区别究竟在哪里呢？

其实不难看出，只有当目标对象与被拷贝对象的属性都是对象（或数组）时，才会考虑要不要深拷贝，如果两个属性的类型不一致或者都是基本类型值，肯定就直接覆盖了。

而且属性肯定是会多层嵌套的，所以使用递归是自然而然的思路：

```js
//判断是否是全对象或者全数组
function isObjectOrArray(a,b){
	//排除掉null后，只有非函数的引用类型才进入if;
	if(a && b && typeof a === "object" && typeof b === "object"){
    	var aType = Object.prototype.toString.call(a);
        var bType = Object.prototype.toString.call(b);
        if(aType === bType){//保证类型一致，且是数组或者对象
        	return aType === "[object Object]" || aType === "[object Array]"
        }else{
        	return false;
        }
    }else{
    	return false;
    }
}
//深拷贝
function deepExtend(){
	//arguments是类数组，所以即使无参数也不会报错，undefined,null调用则报错，其他非类数组类型值则返回空数组；
	var arr = Array.prototype.slice.call(arguments);
    //当参数小于两个时,直接返回；
    if(arr.length < 2){ return arr[0]; }
    //获取目标对象
    var target = arr[0];
    //从第二个参数开始，for-in遍历每个参数的每一个属性，把它赋值到目标对象;
    for(var i = 1; i < arr.length; i++){
    	for(var key in arr[i]){
        	//判断是不是都是对象（或者数组）
        	if(isObjectOrArray(target[key],arr[i][key])){
            	//把目标对象与拷贝对象的属性值都取出来，递归操作；因为属性值都是对象，也就是都只是保留内存地址引用，递归赋值时，修改的也还是原对象
            	deepExtend(target[key],arr[i][key]);
            }else{
            	target[key] = arr[i][key]; //赋值到目标对象
            }
        }
    }
    return target;
}
deepExtend( object1, object2 );
//{"apple":0,"banana":{"weight":52,"price":200},"cherry":[4, 5, 3]}
```

好吧，这段代码显得长了一点点，主要是为了方便大家自己测试，也加上了类型判断的函数，类型判断不熟悉的小伙伴，可以参考[系列四](http://codedoges.com/article/1535984499369 "遍地黄金的工具函数")的文章。

下面来分析一下该段代码：对照一下浅拷贝，深拷贝其实只做了一处的修改，就是在赋值之前，先判断该属性值是否同时是对象或者数组，如果是，就递归拷贝操作；

基础不是太好的小伙伴可能就有疑问了，为什么递归调用时传的是 `target[key]` 跟 `arr[i][key]` 呢？下面看个小例子：

```js
var obj = {
	a: {name: "李四"}
};
function ex(x){
 	x.name = "张三";
}
ex(obj.a);
console.log(obj.a.name); //"张三"
```

看到这里，小伙伴们应该明白了，因为 `ex` 函数调用时，传的实参是 `obj.a` ，而 `obj.a` 是一个对象，既然是对象，那意味着传进去的只是一个对象引用而已，函数里面修改该对象时，其实实质还是修改外面的 `obj`；

同理，`deepExtend(target[key],arr[i][key])` 这两个参数也都是对象（或数组），对它们递归赋值修改时，其实修改的还是最开始传进去的目标对象。


## 源码实现 ##
好啦，说了这么多，相信有些小伙伴已经急不可耐想知道jQuery源码里面是如何实现了，现在就让我们来看看John Resig大佬的实现吧：

```js
function extend() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},//获取目标对象，默认为第一个参数
		i = 1, // 被拷贝对象下标，默认从第二个开始
		length = arguments.length,
		deep = false; // 默认浅拷贝

	// 当第一参数为布尔值时
	if ( typeof target === "boolean" ) {
		deep = target; // 调整默认拷贝的状态
		target = arguments[1] || {}; // 目标对象变为第二个参数
		i = 2; // 被拷贝对象改从第三个参数开始
	}

	// 当目标对象为非 null 的基本类型值时，为了防止报错，给它一个空数组
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// 此时没有被拷贝对象
	if ( length === i ) {
		target = this; // 目标对象指向调用extend方法的对象
		--i; // 此操作意味着被拷贝对象在参数位置前移一位，即无布尔值时，被拷贝对象是第一个参数，有布尔值时，为参数第二位；
	}

    /*上面都是非核心代码，主要是为了对多种情况的参数传入进行处理，提高代码健壮性 */

    //开始遍历被拷贝参数
	for ( ; i < length; i++ ) {
		// 被拷贝参数不为 null 与 undefined 时，进入；
		if ( (options = arguments[ i ]) != null ) {
			// 遍历被拷贝对象的属性值
			for ( name in options ) {
				src = target[ name ]; //目标对象的属性值
				copy = options[ name ]; //被拷贝对象的属性值

				// 一个重要的处理，当被拷贝对象的属性值指向目标对象时，跳出本次遍历，避免陷入死循环
				if ( target === copy ) {
					continue;
				}

				// 当被拷贝对象属性值为对象或者数组时，进行递归操作
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) { //被拷贝对象属性值为数组时
						copyIsArray = false; //置否，等待下次遍历
						clone = src && jQuery.isArray(src) ? src : []; //目标对象属性值不是数组时，给个空数组，保持类型一致
					} else {//被拷贝对象属性值为对象时
						clone = src && jQuery.isPlainObject(src) ? src : {};//目标对象属性值不为对象时，给个空对象，保持类型一致
					}

					// 传入目标对象属性值与被拷贝对象属性值，递归操作
					target[ name ] = extend( deep, clone, copy );

				// 当被拷贝对象属性值不为为对象或者数组时，直接拷贝覆盖
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// 返回被拷贝完成的目标对象
	return target;
};
```

看完源码的注释的小伙伴可以先坐下来缓口气了。我们趁热打铁，对比一下源码跟上面深拷贝代码的区别。

有没有区别呢？啥区别？

  - 对多种参数情况的处理，譬如兼容布尔值参数，对基本类型参数的处理，可能出现的报错的情况的处理。
  - 最关键的一点，对潜在对象互相引用导致死循环的处理，虽然这种情况较少出现。

哈哈，总的来说，思路是一致的，实现源码更胜一筹。


## 结尾 ##
通过这一篇文章，认真思考过的小伙伴应该可以逐步体会到，大神写的代码跟凡人写的代码的一丝区别了。同样的代码，同一个实现思路下，John Resig大佬的实现显得更具健壮性，防止了各种可能出现的报错，甚至考虑到了潜在的死循环情况，虽然仅仅加了一句代码。

看来，我们跟大佬的差距不小啊，不过至少已经看到前方的方向了不是吗，让我们继续前进吧！







