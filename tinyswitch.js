/*!
 * jQuery TinySwitch Plugin v0.1
 * Copyright 2013 darkfe(i@darkfe.com)
 * Released under the MIT license
 * Date: 2013/7/21
 */

(function($){  

    var FLAG = 'TINYSWITCH_' +new Date();
    var DEBUG = false;

    var log = function(){
        if(DEBUG)
            console.log.apply(console,arguments);
    }

    /*
        解析 data-tinyswitch 属性里的规则

        语法: 
        checked ? action1 : action2 next~#container
        value==1 ? action1 : action2 next~#container   
    */
    var parseRule = function(rule){

        var exprPattern = /(\w+)(?:([=><!$*^~]{1,2})((?:&?(?:\d+|'(?:\\'|[^'])+'))+))?/;

        var mutipleValue = /(?:\d+|'(?:\\'|[^'])+')/g;

        var rulePattern = /(?:;\s*)?(?:@(\w+)\s)?((?:(?:value|index)[=><!$*^~]{1,2}(?:\d+|'(?:\\'|[^'])+')(?:&(?:\d+|'(?:\\'|[^'])+'))*)|(?:checked|selected))\s\?\s(\S+)(?:\s\:\s(\S+))?\s(?:((?:\w+\.)*\w+)~)?((?:[^;']+|'(?:\\'|[^'])+')+)/ig;
        
        var current = null;

        var ruleList = [];

        while(current = rulePattern.exec(rule)){ 
            var expr = current[2].match(exprPattern);
            ruleList.push({
                group    : current[1],
                expr     : {
                    keyword  : expr[1],
                    operator : expr[2],
                    value    : $.map((expr[3] || '').match(mutipleValue) || [], function(value, index){  

                        if(value.indexOf('\'')===0){
                            return value.slice(1,-1);
                        }else{
                            return value;
                        }
                    })
                }, 
                ifDo     : (current[3]||'').split('&'),
                elseDo   : (current[4]||'').split('&'),
                pos      : (current[5]||'') ? (current[5]||'').split('.') : [],
                selector : current[6],
                rule     : rule
            });
        } 
        return ruleList;
    } 

    var runSwitch = function(rule, sender){
 
        var ruleActions = parseRule(rule);
        var valueProp = TinySwitch.propValue;
        var checkedProp = TinySwitch.propChecked;
        var value = sender.is('[' + valueProp + ']') ? sender.attr(valueProp) : sender.val(); 

        $.each(ruleActions, function(index, ruleItem){

            var result = false; 
            var target = $(document); 
            var tempTarget = sender;
            var tempLevel;
            var elements = null;
            var loopTimes = 0; 

            var compare = function(valueA, operator, valueB){ 
                var result = true;
                if($.isArray(valueB)){ 
                    $.each(valueB, function(index, value){
                        if(compare(valueA, operator, value) === false){ 
                            result = false;
                            return false;
                        }
                    });  
                    return result;
                }else{  
                    var intValueA = parseInt(valueA,10)||0;
                    var intValueB = parseInt(valueB,10)||0;
                    var strValueA = valueA+'';
                    switch(operator){
                        case '==':
                            return valueA == valueB; 
                        case '!=': 
                            return valueA != valueB;  
                        case '>':
                            return intValueA > intValueB; 
                        case '<':
                            return  intValueA < intValueB; 
                        case '*=':
                            return strValueA.indexOf(valueB) != -1; 
                        case '$=': 
                            return strValueA.lastIndexOf(valueB) === strValueA.length - 1;
                        case '^=':
                            return strValueA.indexOf(valueB) === 0;
                        case '~' :
                            return new RegExp(valueB).test(strValueA); 
                        case '!~' :
                            return !(new RegExp(valueB).test(strValueA)); 
                    }
                }
            }

            switch(ruleItem.expr.keyword){
                case 'checked':
                    result = (sender.attr(checkedProp) === 'true') || sender.is(':checked');
                break; 
                case 'value':
                    result = compare(value, ruleItem.expr.operator, ruleItem.expr.value);
                break;
            }
 
            if(ruleItem.pos.length){ 
                while(ruleItem.pos.length){ 
                    tempLevel = ruleItem.pos.shift().match(/^(\d*)([a-zA-Z]+)$/);  
                    loopTimes = !tempLevel[1] ? 1 : (parseInt(tempLevel[1],10) || 0); 
                    if(tempTarget[tempLevel = tempLevel[2]]){
                        while(loopTimes){
                            tempTarget = tempTarget[tempLevel]();
                            loopTimes--;
                        }
                    }
                }
                target = tempTarget;
            } 
 
            elements = $(target).find(ruleItem.selector).add($(target).filter(ruleItem.selector)); 

            $.each(ruleItem[(result && ruleItem.ifDo.length) ? 'ifDo' : 'elseDo'],function(index, item){
                if(ACTIONS[item]){
                    ACTIONS[item].call(elements, elements)
                }
            });
        });
    }

    /*
        TinySwitch
    */
    var TinySwitch = function(elements){ 
        console.log(elements)
        return $(elements).each(function(){
  
            var target = $(this);

            var eventType = target.is('select') ? 'change' : 'click';

            //保证不重复绑定
            if(target.data(FLAG) === 'true'){
                return;
            } 

            target

            //添加上标记
            .data(FLAG,'true')

            .on(TinySwitch.eventSwitching,function(){  

                var groupName = $(this).attr(TinySwitch.propGroup);

                var rule = $(this).attr(TinySwitch.propRule);
 
                if(groupName && GROUP[groupName]){

                    if($(this).is('[' + TinySwitch.propChecked + ']')){ 
                        $('[' + TinySwitch.propChecked + '="' + groupName + '"]').attr(TinySwitch.propChecked, 'false');
                        $(this).attr(TinySwitch.propChecked, 'true'); 
                    } 
                    rule = GROUP[groupName];  
                }
 
                runSwitch(rule, $(this));
            })

            .on(eventType,function(){ 

            	//如果beforeswitch返回false, 停止switch执行
                if($(this).triggerHandler(TinySwitch.eventBeforeSwitch) === false){
                    return;
                } 

                $(this)
                .triggerHandler(TinySwitch.eventSwitching);

                $(this)
                .triggerHandler(TinySwitch.eventAfterSwitch);
            })

            .filter('select, :checkbox, :radio:checked, [' + TinySwitch.propChecked + '==true]')

            .triggerHandler(TinySwitch.eventSwitching); 

        });
    } 

     /*
        默认支持的四个规则
    */ 

    var ACTIONS = {
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
    };

    var GROUP = {}; 

    var LAST_STATE = {};

    $.extend(TinySwitch,{
        propGroup   : 'data-tsgroup',
        propRule    : 'data-tsrule',
        propChecked : 'data-tschecked',
        propValue   : 'data-tsvalue',

        eventSwitching : 'switching',
        eventBeforeSwitch : 'beforeswitch',
        eventAfterSwitch  : 'afterswitch',

        eventGroupSwitching : 'group.switching',
        eventGroupBeforeSwitch : 'group.beforeswitch',
        eventGroupAfterSwitch  : 'group.afterswitch',

        formNameGroup : true,

        action : function(config){
            $.extend(ACTIONS,config);
        },

        group  : function(config){
            $.extend(GROUP, config);
        }
    }); 

    //jQuery 插件 
    $.fn.tinyswitch = function(options){
        return TinySwitch(this, options);
    }; 
 
    $.tinyswitch = TinySwitch;
 
    //默认加载
    $(function(){ 
        $('[' + TinySwitch.propRule + ']').each(function(){ 
            var ruleStr = $(this).attr(TinySwitch.propRule); 
            var groupName = '';
            if(groupName = ruleStr.match(/^@(\w+)/i)){ 
                GROUP[groupName[1]] = ruleStr.split(/^@\w+\s/)[1];
            }else{
                $(this).tinyswitch();
            } 
        });

        $('[' + TinySwitch.propGroup + ']').tinyswitch();

        if(TinySwitch.formNameGroup){ 
            $.each(GROUP, function(name){ 
                $('[name="' + name + '"]:not([' + TinySwitch.propGroup  + '])').attr(TinySwitch.propGroup, name).tinyswitch();
            });
        } 
    });
}(jQuery));