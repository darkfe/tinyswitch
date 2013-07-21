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

	var DEBUG = true;

	var log = function(){
		if(DEBUG)
			console.log.apply(console,arguments);
	}

	var parseRule = function(rule, type){
		var placeAction = [];

		var parsePatternForProxyMode = /;?\s*(?:([!^+-~\d]+)\$)?([^@]+)\@((?:\w+(?:\((?:value|index)?[=><!$*^]{1,2}\s*(?:\d+|'(?:\\'|[^'])+')\))?&?)*)/ig;

		var parsePatternSimple = /;?\s*([!^+-~\d]+\$)?([^@]+)\@([\w\-&]+)(?::([~!+\d]*)([\w\-&]+))?/ig;

		var isSelectMode = type === 'selectmode';

		var parsePattern = isSelectMode ?  parsePatternForProxyMode : parsePatternSimple;
 
		var currentRule;

		while(currentRule = parsePattern.exec(rule)){
			placeAction.push({

				isSelectMode      : isSelectMode,
				selectedRelative : currentRule[1], 
				selectedSelector : currentRule[2],
				selectedAction   : currentRule[3],

				unselectSelector : currentRule[2],
				unselectRelative : currentRule[1],
				unselectAction   : currentRule[5]
			});
		}

		log(placeAction);

		return placeAction;
	}
 

	/*
		执行规则
	*/
	var runSwitch = function(placeAction, sender, type){
		 
		$.each(placeAction,function(index, item){ 

			/*
				定义:
				! 父级    [number]!    0! 表示无   ! 表示 1!
				+ 当前对象的下一个  [number]+
				- 当前对象的上一个  [number]-
				^ 等同当前对象的prevAll()
				~ 等同当前对象的nextAll()
			*/
			var scope = $(document);
			var parentLevel = 0;
			var chars;
			var exprPattern = /(\d*)([!+^~-])/g;
			var current;
			var times = 0;
			var method = '';
			if(this[type + 'Relative']){
				scope = sender;   
				while(current = exprPattern.exec(this[type + 'Relative'])){ 
					times = current[1] ? parseInt(current[1],10) : 1;

					switch(current[2]){
						case '!':  
							method = 'parent'; 
						break;
						case '+':
							method = 'next'; 
						break;
						case '-': 
							method = 'prev';
						break;
						case '~':
							method = 'nextAll';
							times = 1;
						break;
						case '^':
							method = 'prevAll';
							times = 1;
						break;
					}

					while(times){
						scope = scope[method]();
						times--;
					}
				} 

				log('current scope offset:', this[type + 'Relative'], scope);
			}
			
			var actionType = this[type + 'Action'];

			if(!actionType){
				return;
			}

			var currentType;
			var actionTypePattern = /(\w+)(?:\((value|index)?([=><!$*^]{1,2})\s*(?:(\d+)|'(\\'|[^']+)'\)))?&?/ig;
			var actionTypes = [];

			while(currentType = actionTypePattern.exec(actionType)){
				actionTypes.push({
					action : currentType[1],
					prop   : currentType[2],
					expr   : currentType[3],
					value  : currentType[4] || currentType[5]
				});
			}

			log('current action types:', actionType, actionTypes);

			//这里选中的元素要包含scope自己,否则 + - 这种就不能工作了
			var elements = scope.find(this[type + 'Selector']).add(scope.filter(this[type + 'Selector']));

			if(item.isSelectMode){
				$.each(actionTypes,function(index, typeItem){ 
					var result = false;
					var value = $(sender).val();
					if(typeItem.prop == 'index'){
						typeItem.value = parseInt(typeItem.value,10) || 0;
						value = $(sender)[0].selectedIndex;
					} 
					/*
						定义:
						==	相等
						!=  不等
						>   大于
						<   小于
						*=  包含
						$=  结尾等于
						^=  开头等于
					*/
					switch(typeItem.expr){
						case '==':
							result = typeItem.value == value;
						break;
						case '!=': 
							result = typeItem.value != value; 
						break;
						case '>':
							result = (parseInt(typeItem.value,10)||0) > (parseInt(value,10)||0);
						break;
						case '<':
							result = (parseInt(typeItem.value,10)||0) < (parseInt(value,10)||0);
						break;
						case '*=':
							result = (value+'').indexOf(typeItem.value) != -1;
						break;
						case '$=': 
							result = (value+'').lastIndexOf(typeItem.value) === (value+'').length - 1;
						break;
						case '^=':
							result = (value+'').indexOf(typeItem.value) === 0;
						break;
					}

					if(result){ 
						var currentAction = TinySwitchActions[typeItem.action];
						if(currentAction){
							currentAction.call(elements, elements);
							return false;
						}
					}
				});
			}else{
				$.each(actionTypes,function(index, typeItem){ 
					var currentAction = TinySwitchActions[typeItem.action];
					if(currentAction){
						currentAction.call(elements, elements);
					}
				});
			}
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

	//为enabled 和 disabled 做个别名
	TinySwitchActions['off'] = TinySwitchActions['disabled'];
	TinySwitchActions['on'] = TinySwitchActions['enabled'];

	/*
		TinySwitch
	*/
	var TinySwitch = function(elements){ 

		return $(elements).each(function(){

			var target = $(this);

			if(target.data(JQUERY_DATA_PREFIX + 'init') === true){
				return;
			} 

			target 

			.data(JQUERY_DATA_PREFIX + 'init',true); 

			var eventType = target.is('select') ? 'change' : 'click';

			target
			
			.on(EVENT_PREFIX + 'switch',function(){

				var actionType = $(this).is('select') ? 
					'selected' : 
					($(this).is(':checkbox,:radio') ?
					($(this).is(':checked') ? 'selected' : 'unselect') :
					($(this).attr(HTML_DATA_PREFIX + 'value') === 'true' ? 'selected' : 'unselect'));

				var rule = $(this).attr(HTML_DATA_PREFIX);
				var placeAction;

				if($(this).is('select') && rule){ 
					placeAction = parseRule(rule, 'selectmode');
				}else{
					placeAction = parseRule(rule);
				} 

				log(placeAction)

				runSwitch(placeAction, $(this), actionType); 
			})

			.on(eventType,function(){
				if($(this).triggerHandler(EVENT_PREFIX + 'beforeswitch') === false){
					return;
				} 

				$(this)
				.triggerHandler(EVENT_PREFIX + 'switch');

				$(this)
				.triggerHandler(EVENT_PREFIX + 'afterswitch');
			})

			.triggerHandler(EVENT_PREFIX + 'switch')
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
			if(/^[\w\-]+$/.test(action)){
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

			if($(this).is(HTML_DATA_PREFIX)){
				$(this).tinyswitch();
			}
		});
	});
}(jQuery))
