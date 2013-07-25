TinySwitch
==========

TinySwitch 是一个无聊的低性能的jquery插件,主要用来解决这种场景下的问题:

1. 点击 radio A, 隐藏一片区域, 点击radio B, 隐藏这篇区域
2. 勾选 checkbox, 启用一部分控件,  取消勾选 checkbox, 禁用一部分控件
3. 一堆单选框,最后一个选项叫自定义,点击自定义,后面出现一个文本框,并且自动获取焦点,点击其他选项,文本框又消失了

这种无聊并且重复的逻辑大量充斥在各种表单中.

TinySwitch 提供了这样的一种方案来试图简化(或者复杂化?)这个鸟玩意儿.

你只需要在控件上配置:

```
data-tsrule="expr ? action1 : action2 selector"
```

就可以操控对应的内容展示隐藏,或者启用禁用,以及其他一些别的什么逻辑.

* `expr`     为判断执行`action`方式, 目前支持判断`checked`,`value`和`index`.
* `selector` 为标准的jQuery支持的css选择器, 它告诉`TinySwitch`, 谁是点击后的操作对象
* `action1`  当`expr`结果为`true`时执行这个行为 
* `action2`  当`expr`结果为`false`时执行这个行为 

### 单选框

由于单选框自己不会主动触发`取消选中`这个行为, 所以单选框只需要配置`选中`行为, 例如:

```html
<label>
  <input type="radio" data-tsrule="checked ? show #box"> 显示box
</label>

<label>
  <input type="radio" data-tsrule="checked ? hide #box"> 隐藏box
</label>

<div id="box">我是box</div>
```

### 复选框

复选框本身会触发两个行为: `勾选` 和 `取消勾选`, 所以复选框可以配置两个`行为`, 例如:


```html
<label>
  <input type="checkbox" data-tsrule="checked ? show : hide #box"> 显示或者隐藏box
</label> 

<div id="box">我是box</div>
<div id="list">list</div>
```

### 下拉列表

```html
<select data-tsrule="value==1 ? show : hide #box"> 
  <option value="1">value is 1</option>
  <option value="2">value is 2</option>
</select>

<div id="box">我是box</div>
```

`value==1 ? show : hide #box` 表示:

* 当`select`的`value == 1`的时候,执行`show`这个行为
* 当`select`的`value != 1`的时候,执行`hide`这个行为 

`value==1` 表达式中的`value`关键字表示当前`select`的`value`值
 

表达式中目前支持如下运算符:

* `==`  相等
* `!=`  不等
* `>`   大于
* `<`   小于
* `~`   正则匹配
* `!~`  正则不匹配

当与`value`比较的值不是数字时,需要使用**单引号**将内容包裹起来.

如果在单引号中包含单引号,需要为单引号增加转义符`value='a\'b`.

### 更复杂的选择器

`TinySwitch` 可以使用`jQuery`支持的所有`css`选择器来进行全局的元素定位, 比如:

```html
<label>
  <input type="checkbox" data-tsrule="checked ? show : hide #box,#list"> 显示或者隐藏box 和 list
</label> 

<div id="box">我是box</div>
<div id="list">list</div>
```


### 同时使用多个配置

以上的例子中为了简化, 都使用了一个`action`, `TinySwitch`也支持用分号分隔多个`action`按序执行, 例如:


```html
<label>
  <input type="checkbox" data-tsrule="checked ? show : hide #box; checked ? show : hide #list"> 显示或者隐藏box 和 list
</label> 

<div id="box">我是box</div>
<div id="list">list</div>
```

### 多个`action`同时执行

`TinySwitch` 支持多个用`&`隔开的`action`, 按序执行

```html
<label>
  <input type="checkbox" data-tsrule="checked ? show&disabled : hide #box"> 显示box,并且禁用box中的控件, 或者隐藏box
</label> 

<div id="box">
  我是box
  <input type="text">
</div> 
```

### 全局定位和相对定位元素

默认情况下,写在`@`前的`selector`是全局定位的, 即:

`#box@show` 实际上会执行 `$('#box').show()`

但有很多场景中, 我们需要相对于当前控件对目标的容器进行定位, 比如下例:

```html 
<select data-tsrule="value==1 ? show : hide .list"> 
  <option value="1">启用</option>
  <option value="2">禁用</option> 
</select>  
<div class="list">
  <input type="text" value="我是一个文本框">
</div>

<select data-tsrule="value==1 ? show : hide .list"> 
  <option value="1">启用</option>
  <option value="2">禁用</option> 
</select>
<div class="list">
  <input type="text" value="我是一个文本框">
</div>
```

我们希望每个`select`都只控制它下面的`.list`,但这样做会导致两个`.list`同时被控制.

针对这种场景 `TinySwitch` 提供了一种简单的标记方式来实现相对于当前控件的定位方式:

```
data-tsrule="value==1 ? show : hide next~.list"
```
 
* `next` 表示当前控件的`.next()`节点
* `~` 表示相对定位规则结束

相对定位规则支持如下标记:

* `next` 
* `prev`
* `nextAll`
* `prevAll`
* `parent`

你可以组合使用它们,比如:


```
data-tsrule="value==1 ? show : hide parent.next.next~.list"
```
 

对于上面的例子,我们可以写成这样来实现需求:


```html 
<select data-tsrule="value==1 ? show : hide next~.list"> 
  <option value="1">启用</option>
  <option value="2">禁用</option> 
</select>  
<div class="list">
  <input type="text" value="我是一个文本框">
</div>

<select data-tsrule="value==1 ? show : hide next~.list"> 
  <option value="1">启用</option>
  <option value="2">禁用</option> 
</select>
<div class="list">
  <input type="text" value="我是一个文本框">
</div>
```
### TinySwitch 默认自带的`action` 

1. `show`:   显示这个容器
2. `hide`:   隐藏这个容器
3. `disabled` 或者 `off`:  禁用这个控件, 或者禁用这个容器中的所有控件
4. `enabled`  或者 `on`:  启用这个控件, 或者启用这个容器中的所有控件
5. `focus`:    让当前的控件获得焦点

你可以通过脚本来增加自定义的`action`

```javascript
$.tinyswitch.addAction('clearValues',function(elements){
    $(elements).values('');
});
```

### TinySwitch 的事件

`TinySwitch`目前只提供两个事件:

1. `tinyswitch.beforeswitch` 事件, 如果在这个事件中返回`false`, 将停止执行`switch`的操作.
2. `tinyswitch.afterswitch` 事件, `switch`完成之后触发

例子:

```javascript
  $('#xxoo').on('tinyswitch.beforeswitch',function(){
    if(location.href.indexOf('xxoo=1')){
      alert('也不知道这么地,反正当前选项对你禁用了.');
      this.checked = true;
      return false;
    }
  })
```

```javascript
    //使用按钮模拟一个switch
    $('#xxoo').on('tinyswitch.beforeswitch',function(){
        $(this).attr('data-tsrulevalue',function(i,v){ return v==='true'?'false':'true' })
    });
```


### 更新日志

**v0.2**

1. 增加 `group` 支持
2. 支持多值比较,可以在多`checkbox`和`select`的`multiple`模式下工作
3. 移除所有看似很强大的,其实很少用不东西
4. 移除`^=`,`$=`,`*=`操作符, 增加`~`和`!~`正则支持
5. 移除`data-tsgroup`,支持使用表单的`name`属性
6. 优化性能

演示: http://darkfe.com/tinyswitch/demo.html