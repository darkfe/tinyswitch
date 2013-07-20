tinyswitch
==========

tinyswitch 是一个无聊的低性能的jquery插件,主要用来解决这种场景下的问题:

1. 点击 radio A, 隐藏一片区域, 点击radio B, 隐藏这篇区域
2. 勾选 checkbox, 启用一部分控件,  取消勾选 checkbox, 禁用一部分控件
3. 一堆单选框,最后一个选项叫自定义,点击自定义,后面出现一个文本框,并且自动获取焦点,点击其他选项,文本框又消失了

这种无聊并且重复的逻辑大量充斥在各种表单中.

tinyswitch 提供了这样的一种方案来试图简化(或者复杂化?)这个鸟玩意儿.

你只需要在控件上配置:

```
data-tinyswitch=".selector@action1:action2"
```

就可以操控对应的内容展示隐藏,或者启用禁用,以及其他一些别的什么逻辑.


`.selector` 为标准的jQuery支持的css选择器, 它告诉`tinyswitch`, 谁是点击后的操作对象
* `@` @是个分界符,表示后面的部分是`行为`
* `action1` 表示`选中时`执行这个行为
* `:` :分界符
* `action2` 表示`非选中时`执行这个行为, 非选中时的行为是可选的.

目前支持的默认行为有:

1. show
2. hide
3. disabled 或者 off
4. enabled 或者 on
5. focus

你可以通过脚本来增加自定义的行为

```javascript
$.tinyswitch.addAction('clearValues',function(elements){
    $(elements).values('');
});
```

关于`选中`和`非选中`的定义:

对于`checkbox`和`radio`来说:

* 当`checked`属性为`true`时, 为`选中`
* 当`checked`属性为`false`时, 为`非选中`

对于`select`来说:

* 当`selected`属性为`true`时, 为`选中`
* 当`selected`属性为`false`时, 为`非选中`

对于其他任意元素来说:

* 当`data-tinyswitchvalue="true"` 时,为`选中`
* 当`data-tinyswitchvalue="true"` 时,为`非选中`

以上展示了基础用法,但`tinyswitch`还支持更多的语法,比如,多串规则

```
data-tinyswitch=".selector@action1:action2, .selector@action3:action4"
```

多行为同时执行

```
data-tinyswitch=".selector@action1&action2:action2&action4"
```

有些情况下(比如插件中), 无法使用全局选择器来定位目标,为此,`tinyswitch`提供了一种相对于绑定事件的元素定位的机制:

```
data-tinyswitch=".selector@~action1"
```

`~` 表示当前元素的父元素中查找`.selector`, `~` 用数量来表示层级, 比如`~~`即表示`.parent().parent.find(".selector")`.

事件支持:

`tinyswitch`目前只提供两个事件:

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
        $(this).attr('data-tinyswitchvalue',function(i,v){ return v==='true'?'false':'true' })
    });
```

例子演示: http://darkfe.com/tinyswitch/demo.html
