
(function($){
	/*
		events:
		tinyswitch.beforeswitch
		tinyswitch.afterswitch 
	*/
	var EVENT_PREFIX = 'tinyswitch.'

	var JQUERY_DATA_PREFIX = 'tinyswitch' + (+(Math.random()+'').slice(2)).toString(36) + '.';

	var HTML_DATA_PREFIX = 'data-tinyswitch'; 

	/*
		解析 data-tinyswitch="" 属性中的规则
	*/
	var parseRule = function(rule){
		var placeAction = [];

		var parsePattern = /,?\s*([^@]+)\@(~*)([\w\-&]+)(?::(~*)([\w\-&]+))?/ig;

		var currentRule;

		while(currentRule = parsePattern.exec(rule)){

			placeAction.push({
				selectedSelector : currentRule[1],
				selectedRelative : currentRule[2],
				selectedAction   : currentRule[3],

				unselectSelector : currentRule[1],
				unselectRelative : currentRule[4],
				unselectAction   : currentRule[5]
			});
		}

		return placeAction;
	}

	/*
		执行规则
	*/
	var runSwitch = function(placeAction, sender, type){
		 
		$.each(placeAction,function(index, item){
			var scope = $(document);
			var parentLevel = 0;
			if(this.relative){
				scope = sender; 
				parentLevel = this.relative.split('~').length;
				while(parentLevel--){
					scope = scope.parentNode();
				}
			}
			
			var actionTypes = this[type + 'Action'];

			if(!actionTypes){
				return;
			}
			actionTypes = actionTypes.split('&');

			var elements = scope.find(this[type + 'Selector']);

			$.each(actionTypes,function(index, type){
				var currentAction = TinySwitchActions[type];
				if(currentAction){
					currentAction.call(elements, elements);
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

	//为enabled 和 disabled 做个别名
	TinySwitchActions['off'] = TinySwitchActions['disabled'];
	TinySwitchActions['on'] = TinySwitchActions['enabled'];

	/*
		TinySwitch
	*/
	var TinySwitch = function(elements){ 

		return $(elements).each(function(){

			var eventType = $(this).is('select') ? 'change' : 'click';

			if($(this).data(JQUERY_DATA_PREFIX + 'init') === true){
				return;
			}

			$(this) 

			.data(JQUERY_DATA_PREFIX + 'init',true)
			
			.on(EVENT_PREFIX + 'switch',function(){

				var actionType = $(this).is('select') ? 
					'selected' : 
					($(this).is(':checkbox,:radio') ?
					($(this).is(':checked') ? 'selected' : 'unselect') :
					($(this).attr(HTML_DATA_PREFIX + 'value') === 'true' ? 'selected' : 'unselect'));
				var rule = $(this).attr(HTML_DATA_PREFIX);

				if($(this).is('select')){
					rule = $(this).find('option:selected').attr(HTML_DATA_PREFIX);
				}

				var placeAction = parseRule(rule);

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
			
			.triggerHandler(EVENT_PREFIX + 'switch');
		});
	}

	

	//jQuery 插件 
	$.fn.tinyswitch = function(){
		return TinySwitch(this);
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
		});
	});
}(jQuery))
