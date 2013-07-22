/*!
 * jQuery TinySwitch Plugin v0.1
 * Copyright 2013 darkfe(i@darkfe.com)
 * Released under the MIT license
 * Date: 2013/7/21
 */

(function($){
    /*
        events:
        tinyswitch.beforeswitch
        tinyswitch.afterswitch 
    */
    var EVENT_PREFIX = 'tinyswitch.'

    var JQUERY_DATA_PREFIX = 'tinyswitch' + (+(Math.random()+'').slice(2)).toString(36) + '.';

    var HTML_DATA_PREFIX = 'data-tinyswitch'; 

    var DEBUG = false;

    var log = function(){
        if(DEBUG)
            console.log.apply(console,arguments);
    }

    /*
        解析 data-tinyswitch 属性里的规则

        同时支持两种语法:
        
        1. 
        checked ? action1 : action2 next~#container
        value==1 ? action1 : action2 next~#container

        2.
        if(checked)take({next~#container})do(action1)else(action2)     
        if(value==1)take({next~#container})do(action1)else(action2)     
    */
    var parseRule = function(rule){

        /*
        (?:;\s*)?
        (
        (?:
        (?:value|index)
        [=><!$*^]+
        (?:\d+|'(?:\\'|[^'])+')
        )|
        (?:checked|unchecked)
        )
        \s
        \?
        \s
        (\S+)
        (?:
        \s
        \:
        \s
        (\S+))?
        \s
        (?:((?:\.\w+)*)~)?
        ([^;]+)
        */
        var rulePattern1 = /(?:;\s*)?((?:(?:value|index)[=><!$*^]+(?:\d+|'(?:\\'|[^'])+'))|(?:checked|unchecked))\s\?\s(\S+)(?:\s\:\s(\S+))?\s(?:((?:\w+\.)*\w+)~)?((?:[^;']+|'(?:\\'|[^'])+')+)/ig;

        /*
        (?:;\s*)?if\(
        (
        (?:
        (?:value|index)
        [=><!$*^]+
        (?:\d+|'(?:\\'|[^'])+')
        )|
        (?:checked|unchecked)
        )
        \)
        take\(
        {(?:([^~]*)~)?((?:[^}']|'(?:\\'|[^'])+')+)}
        \)
        do\(
        ([^)]+)
        \)
        (?:else\(
        ([^)]+)
        \))?
        */
        var rulePattern2 = /(?:;\s*)?if\(((?:(?:value|index)[=><!$*^]+(?:\d+|'(?:\\'|[^'])+'))|(?:checked|unchecked))\)take\({(?:([^~]*)~)?((?:[^}']|'(?:\\'|[^'])+')+)}\)do\(([^)]+)\)(?:else\(([^)]+)\))?/ig;

        var exprPattern = /(\w+)(?:([=><!$*^]{1,2})\s*(?:(\d+)|'((?:\\'|[^'])+)'))?/i;

        var rulePattern = rulePattern1;

        var namedGroup = {
            ifDo     : 2,
            elseDo   : 3,
            pos      : 4,
            selector : 5
        }

        if(rule.indexOf('if(') === 0){

            rulePattern = rulePattern2;

            namedGroup = {
                ifDo     : 4,
                elseDo   : 5,
                pos      : 2,
                selector :3
            }
        }

        var current = null;

        var ruleList = [];

        while(current = rulePattern.exec(rule)){

            var expr = current[1].match(exprPattern);

            ruleList.push({
                expr     : {
                    keyword  : expr[1],
                    operator : expr[2],
                    value    : expr[3] || expr[4]
                }, 
                ifDo     : (current[namedGroup.ifDo]||'').split('&'),
                elseDo   : (current[namedGroup.elseDo]||'').split('&'),
                pos      : (current[namedGroup.pos]||'') ? (current[namedGroup.pos]||'').split('.') : [],
                selector : current[namedGroup.selector]
            });
        }

        return ruleList;
    } 

    var runSwitch = function(rule, sender){
 
        var ruleActions = parseRule(rule);

        $.each(ruleActions, function(index, ruleItem){
 
            var result = false;
            var value = $(sender).val();
            var target = $(document); 
            var tempTarget = $(sender);
            var tempLevel;
            var elements = null;
            var runBranch = '';
            var loopTimes = 0;

            switch(ruleItem.expr.keyword){
                case 'checked':
                    result = $(sender).is(':checked');
                break; 
                case 'value':
                case 'index':
                    if(ruleItem.expr.keyword === 'index'){
                        ruleItem.expr.value = parseInt(ruleItem.expr.value,10) || 0;
                        value = $(sender)[0].selectedIndex;
                    }
                    switch(ruleItem.expr.operator){
                        case '==':
                            result = ruleItem.expr.value == value;
                        break;
                        case '!=': 
                            result = ruleItem.expr.value != value; 
                        break;
                        case '>':
                            result = (parseInt(ruleItem.expr.value,10)||0) > (parseInt(value,10)||0);
                        break;
                        case '<':
                            result = (parseInt(ruleItem.expr.value,10)||0) < (parseInt(value,10)||0);
                        break;
                        case '*=':
                            result = (value+'').indexOf(ruleItem.expr.value) != -1;
                        break;
                        case '$=': 
                            result = (value+'').lastIndexOf(ruleItem.expr.value) === (value+'').length - 1;
                        break;
                        case '^=':
                            result = (value+'').indexOf(ruleItem.expr.value) === 0;
                        break;
                    }
                break;
            }
               
            if(ruleItem.pos.length){ 
                while(ruleItem.pos.length){ 
                    tempLevel = ruleItem.pos.shift(); 
                    tempLevel = tempLevel.match(/^(\d*)([a-zA-Z]+)$/);
                    loopTimes = !tempLevel[1] ? 1 : (parseInt(tempLevel[1],10) || 0);
                    tempLevel = tempLevel[2];
                    if(tempTarget[tempLevel]){
                        while(loopTimes){
                            tempTarget = tempTarget[tempLevel]();
                            loopTimes--;
                        }
                    }
                }
                target = tempTarget;
            }

            elements = $(target).find(ruleItem.selector).add($(target).filter(ruleItem.selector))

            if(result && ruleItem.ifDo.length){
                runBranch = 'ifDo';
            }else{
                runBranch = 'elseDo';
            } 

            $.each(ruleItem[runBranch],function(index, item){
                if(TinySwitchActions[item]){
                    TinySwitchActions[item].call(elements, elements)
                }
            });
        });
    }

    /*
        默认支持的四个规则
    */
    var TinySwitchActions = {
        'show' : function(elements){
            $(elements).show();
        },

        'hide' : function(elements){
            $(elements).hide();
        },

        'enabled' : function(elements){
            var target = $(elements).is('input,select,textarea') ? $(elements) : $(elements).find('input, select, textarea');
            target.attr('disabled', false);
        },

        'disabled' : function(elements){ 
            var target = $(elements).is('input,select,textarea') ? $(elements) : $(elements).find('input, select, textarea');
            target.attr('disabled', true);
        },

        'focus' : function(elements){
            $(elements).eq(0).focus();
        }
    }

    /*
        TinySwitch
    */
    var TinySwitch = function(elements){ 

        return $(elements).each(function(){

            var target = $(this);

            var eventType = target.is('select') ? 'change' : 'click';

            //保证不重复绑定
            if(target.data(JQUERY_DATA_PREFIX + 'init') === true){
                return;
            } 

            target 

            //添加上标记
            .data(JQUERY_DATA_PREFIX + 'init',true); 

            //绑定一个 switch 事件,当手动调用控件的checked = true|false 的时候,可以出发switch事件来调用切换逻辑
            .on(EVENT_PREFIX + 'switch',function(){

                var actionType = $(this).is('select') ? 
                    'selected' : 
                    ($(this).is(':checkbox,:radio') ?
                    ($(this).is(':checked') ? 'selected' : 'unselect') :
                    ($(this).attr(HTML_DATA_PREFIX + 'value') === 'true' ? 'selected' : 'unselect'));

                var rule = $(this).attr(HTML_DATA_PREFIX);

                runSwitch(rule, $(this)); 
            })

            .on(eventType,function(){

            	//如果beforeswitch返回false, 停止switch执行
                if($(this).triggerHandler(EVENT_PREFIX + 'beforeswitch') === false){
                    return;
                } 

                $(this)
                .triggerHandler(EVENT_PREFIX + 'switch');

                $(this)
                .triggerHandler(EVENT_PREFIX + 'afterswitch');
            })

            .triggerHandler(EVENT_PREFIX + 'switch');
        });
    } 

    //jQuery 插件 
    $.fn.tinyswitch = function(options){
        return TinySwitch(this, options);
    }; 

    /*
        自定义添加规则
    */ 
    $.tinyswitch = {
        addAction : function(action, handler){

        	//action key只能用数字和字符组成
            if(/^\w+$/.test(action)){
                if($.isFunction(handler)){
                    TinySwitchActions[action] = handler;
                }
            }else{
                window.console && console.log && console.log('action字符中包含了[\w-]之外的字符.');
            }
        }
    }

    //默认加载
    $(function(){
        $('['+ HTML_DATA_PREFIX +']:not(option)').each(function(){
            $(this).tinyswitch();
        });

        $('option['+ HTML_DATA_PREFIX +']').closest('select').tinyswitch();

        $(document).on('click','['+HTML_DATA_PREFIX+']',function(){
            if($(this).data(JQUERY_DATA_PREFIX + 'init') !== true){
                $(this).tinyswitch();
            }
        });

        $(document).on('change','select',function(){
            if($(this).children().is(HTML_DATA_PREFIX) && $(this).data(JQUERY_DATA_PREFIX + 'init') !== true){
                $(this).tinyswitch();
            }

            if($(this).is(HTML_DATA_PREFIX) && $(this).data(JQUERY_DATA_PREFIX + 'init') !== true){
                $(this).tinyswitch();
            }
        });
    });
}(jQuery));