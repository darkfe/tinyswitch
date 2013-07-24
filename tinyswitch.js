/*!
 * jQuery tinySwitch Plugin v0.2
 * Copyright 2013 darkfe(i@darkfe.com)
 * Released under the MIT license
 * Date: 2013/7/21
 */

(function($){  

    var FLAG = 'tinySwitch_' +new Date(); 
 
    /*
        解析 data-tinySwitch 属性里的规则

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
                    }).sort()
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
        var groupName = sender.attr('name');
        var selectedControls = groupName ? 
        (   
            sender.is(':radio') ? 
            sender : 
            $('[name="' + groupName + '"]')
        ) : sender;

        var value =
        (sender.is('select') ? sender.find(':selected') : selectedControls.filter(':checked'))
        .map(function(){ 
            return $(this).val();
        }).get().sort(); 
 

        $.each(ruleActions, function(index, ruleItem){

            var result = false; 
            var target = $(document); 
            var tempTarget = sender;
            var tempLevel;
            var elements = null;
            var loopTimes = 0; 

            var compare = function(valueA, operator, valueB){  

                var result = true;
                
                if($.type(valueA) == 'array' && $.type(valueB) == 'array'){ 
                    if(valueA.length != valueB.length){
                        return false;
                    }
                    $.each(valueA,function(index, value){  
                        if(compare(value, operator, valueB[index]) === false){
                            return result = false;
                        }
                    }); 
                    return result;
                }
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
                    //case '*=':
                        //return strValueA.indexOf(valueB) != -1; 
                    //case '$=': 
                        //return strValueA.lastIndexOf(valueB) === strValueA.length - 1;
                    //case '^=':
                        //return strValueA.indexOf(valueB) === 0;
                    case '~' :
                        return new RegExp(valueB).test(strValueA); 
                    case '!~' :
                        return !(new RegExp(valueB).test(strValueA)); 
                } 
            }

            switch(ruleItem.expr.keyword){
                case 'selected' :
                    result = true;
                break;
                case 'checked':
                    result = sender.is(':checked');
                break; 
                case 'value':
                    result = compare(value, ruleItem.expr.operator, ruleItem.expr.value);
                break;
            }

            while(ruleItem.pos.length){ 
                tempLevel = ruleItem.pos.shift().match(/^(\d*)([a-zA-Z]+)$/);  
                loopTimes = !tempLevel[1] ? 1 : (parseInt(tempLevel[1],10) || 0); 
                if(tempTarget[tempLevel = tempLevel[2]]){
                    while(loopTimes){
                        tempTarget = tempTarget[tempLevel]();
                        loopTimes--;
                    }
                }
                target = tempTarget;
            }  
 
            elements = $(target).find(ruleItem.selector).add($(target).filter(ruleItem.selector)); 

            $.each(ruleItem[(result && ruleItem.ifDo.length) ? 'ifDo' : 'elseDo'],function(index, item){
                if(ACTIONS[item]){ 
                    ACTIONS[item].call(elements, elements, sender)
                }
            });
        });
    }

    /*
        tinySwitch
    */
    var tinySwitch = function(elements){  

        return $(elements).each(function(){
  
            var target = $(this);

            //保证不重复绑定
            if(target.data(FLAG)){
                return;
            } 

            target

            //添加上标记
            .data(FLAG,'1')

            .on(tinySwitch.eventSwitching,function(){  

                var that = $(this);

                var groupName = that.attr('name');

                var rule =  
                that.find(':selected').attr(tinySwitch.propRule) ||
                that.attr(tinySwitch.propRule);  
 
                if(groupName && GROUP[groupName]){
                    rule = GROUP[groupName];
                }
 
                runSwitch(rule, that);
            })

            .on(target.is('select') ? 'change' : 'click',function(){  
 
                var th = 'triggerHandler', that = $(this);
            
                //如果beforeswitch返回false, 停止switch执行
                if(that[th](tinySwitch.eventBeforeSwitch) === false){
                    return;
                } 

                that[th](tinySwitch.eventSwitching);

                that[th](tinySwitch.eventAfterSwitch);
            })

            .filter('select, :checkbox, :radio:checked')

            .triggerHandler(tinySwitch.eventSwitching); 
        });
    } 

    
    var CONTROLS = 'input,select,textarea';

    /*
        默认支持的四个规则
    */  
    var ACTIONS = {
        'show' : function(elements){
            elements.show();
        },

        'hide' : function(elements){
            elements.hide();
        },

        'enabled' : function(elements){ 
            elements.filter(CONTROLS).add(elements.find(CONTROLS)).attr('disabled', false);
        },

        'disabled' : function(elements){  
            elements.filter(CONTROLS).add(elements.find(CONTROLS)).attr('disabled', true);
        },

        'focus' : function(elements){
            elements.eq(0).focus();
        }
    };

    /*
        Group rules
    */
    var GROUP = {}; 

    $.extend(tinySwitch,{ 
        propRule    : 'data-tsrule', 

        eventSwitching : 'switching',
        eventBeforeSwitch : 'beforeswitch',
        eventAfterSwitch  : 'afterswitch',

        //eventGroupSwitching : 'group.switching',
        //eventGroupBeforeSwitch : 'group.beforeswitch',
        //eventGroupAfterSwitch  : 'group.afterswitch',

        formNameGroup : true,

        action : function(config){
            $.extend(ACTIONS,config);
        },

        group  : function(config){
            $.extend(GROUP, config);
        }
    }); 

    //jQuery 插件 
    $.fn.tinyswitch = function(){
        tinySwitch(this);
        return this;
    }; 
    
    /*
        attach to jQuery object
    */
    $.tinyswitch = tinySwitch;
 
    //默认加载
    $(function(){ 

        var nameElements = $(); 

        if(tinySwitch.formNameGroup){ 
            nameElements = $('[name]'); 
            $.each(GROUP, function(name){ 
                nameElements.filter('[name="' + name + '"])').tinyswitch();
            });
        } 
        /*
            收集group
        */
        $('[' + tinySwitch.propRule + ']').each(function(){ 
            var ruleStr = $(this).attr(tinySwitch.propRule); 
            var groupName = '';
            if(groupName = ruleStr.match(/^@(\w+)/i)){ 
                GROUP[groupName[1]] = ruleStr.split(/^@\w+\s/)[1];
                $(nameElements).filter('[name="' + groupName[1] + '"]').tinyswitch();
            }else{
                if($(this).is('option')){
                    $(this).closest('select').tinyswitch();
                }else{
                    $(this).tinyswitch();
                }
            }
        });
        
    });
}(jQuery));