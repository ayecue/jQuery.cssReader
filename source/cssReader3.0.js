/*
 * Plugin: cssReader
 * Version: 3.0
 *
 * Beschreibung:
 * - Reading a CSS File.
 */
(function ($) {
	"use strict";

	var configuration = {
			reader : {
				property:			/([^:]+):([^;]+);/g,
				name:				/[^,]+(\[[^\]]+\])|[^,]+/g,
				style:				/([^}{]+){([^}{]*)}/g
			},
			staticClass : {
				classSpaces:		/\s+/g,
				priorityId:			/#[^\s\.#]+/g,
				priorityClass:		/\.[^\s\.#]+/g,
				priorityTagReplace: /[#\.][^\s\.#]+/g,
				priorityTag:		/[^\s]+(?=#|\.)?/g,
				trim:				/^\s+|\s+$/g,
				important: 			/!important$/gi,
				removeComments:		/\/\*[\s\S]+?\*\//g,
				removeWhiteSpaces:	/[^\S][\s\n\r]*[^\S]/g,
				removeEmpty:		/[^{}]+{[^\S{}]*?}/g
			}
		},
		staticClass = {
			/*
			 * DOMIndex BLOCK
			 */
			DOMIndex : {
				index:0,
				get: function (q)
				{			
					return q.DOMIndex || (q.DOMIndex=this.index++);
				}
			},
			/*
			 * TYPE BLOCK
			 */
			type : {
				handler : {
					object : function (object) {
						return object instanceof Array ? 'array' : 'object';
					}
				},
				get : function (object) {
					var type=typeof object;
					
					return this.handler[type] ? this.handler[type](object) : type;
				}
			},
			/*
			 * PRIORITY BLOCK
			 */
			priority : {
				stack: {},
				create: function (s) {
					var matches;
				
					return (this.stack[s]=((matches=s.match(configuration.staticClass.priorityId)) ? matches.length*100 : 0)
											+((matches=s.match(configuration.staticClass.priorityClass)) ? matches.length*10 : 0)
											+((matches=s.replace(configuration.staticClass.priorityTagReplace,"").match(configuration.staticClass.priorityTag)) ? matches.length*1 : 0));
				},
				get: function (s)
				{
					return this.stack[s] || this.create(s);
				}
			},
			/*
			 * HASH BLOCK
			 */
			hash : {
				handler: {
					string : function(q){
						var hash=0,
							i=q.length;
							
						while (i--)
						{
							hash = ((hash<<5)-hash)+q.charCodeAt(i);
							hash = hash & hash;
						}
						
						return "d:"+hash.toString();
					},
					array : function (q){
						return "e:"+staticClass.DOMIndex.get(q[0]);
					}
				},
				get: function (q)
				{
					var type=staticClass.type.get(q);

					return this.handler[type] ? this.handler[type](q) : false;
				}
			},
			/*
			 * PATH BLOCK
			 */
			path : {
				get : function (q)
				{
					var vl=q.length || 0;

					if (vl<=1)
						return q[0] ? this.create(q[0]) : false;
				
					var stack=[];
					for (var v=0;v<vl;v++)
						stack.push(this.create(q[v]));
						
					return stack;
				},
				create : function (q)
				{
					if (!q.pathStack)
					{
						var current=q,stack=[];
						
						while (this.selector.get(current))
						{	
							this.nodeIndex.get(current);
							stack.push(current);
							current=current.parentNode;
							
							if (current.pathStack)
								return q.pathStack=stack.concat(current.pathStack);
						}
						
						return q.pathStack=stack;
					}
					
					return q.pathStack;
				},
				selector : {
					create : function (q) {
						var tagName=q.tagName,id,name;
					
						return tagName 
								? (tagName
									+ ((id=q.id).length>0 			? '#'+id 														: '')
									+ ((name=q.className).length>0 	? '.'+name.replace(configuration.staticClass.classSpaces,".") 	: ''))
								: false;
					},
					get : function (q) {
						return q.selectors || this.create(q);
					}
				},
				nodeIndex : {
					create : function (q) {
						var prev=q.previousSibling,
							index=0;
							
						while(prev)
						{   
							if (prev.childNodesIndex)
								return q.childNodesIndex=prev.childNodesIndex+1;
							
							prev=prev.previousSibling;
							index++;
						}
						
						return q.childNodesIndex=index;
					},
					get : function(q){
						return q.childNodesIndex || this.create(q);
					}
				}
			},
			/*
			 * TEXT BLOCK
			 */
			text : {
				isImportant: function (q)
				{
					return configuration.staticClass.important.test(q);
				},
				trimBoth: function (s)
				{
					return s.replace(configuration.staticClass.trim,"")
				}
			},
			/*
			 * TEXT BLOCK
			 */
			remove : {
				create: function (s,filter) 
				{
					var length=filter.length;
				
					while (length--)
						if (this[filter[length]])
							s=this[filter[length]](s);

					return s;
				},
				get: function (s,filter)
				{			
					return filter ? this.create(s,filter) : s;
				},
				comments: function (s)
				{
					return s.replace(configuration.staticClass.removeComments,"");
				},
				whitespaces: function (s)
				{
					return s.replace(configuration.staticClass.removeWhiteSpaces,"");
				},
				empty: function (s)
				{
					return s.replace(configuration.staticClass.removeEmpty,"");
				}
			}
		},
		reader = function(options){
			var settings = $.extend({
					stylesheet:false,
					filter:false
				},options);
		
			return {
				/*
				 * FILTER BLOCK
				 */
				filter : {
					handler : {
						array : function () {return new RegExp('([^;]*(?:'+settings.filter.join('|')+')[^:]*):([^;]+);','g');},
						string : function () {return new RegExp('([^;]*(?:'+settings.filter+')[^:]*):([^;]+);','g');}
					},
					set : function(filter){settings.filter=filter;},
					get : function(){
						var type = staticClass.type.get(settings.filter);
						
						return this.handler[type] ? this.handler[type]() : configuration.reader.property;
					}
				},
				
				/*
				 * CSSStyleSheet BLOCK
				 */
				CSSStyleSheet : {
					set : function(object){settings.stylesheet=object;},
					get : function(){return settings.stylesheet;},
					reset : function(){
						inactive.stack={};
						inactive.ref=[];
						active.stack={};
						active.ref=[];
					},
					inactive : {
						stack : {},
						ref : [],
						add : function(rules) {
							if (!this.stack[rules.hash])
							{
								this.stack[rules.hash]=[];
								this.ref.push(this.stack[rules.hash]);
							}

							this.stack[rules.hash].push({
								property : rules.properties,
								selector : rules.selector
							});
						}
					},
					active : {
						stack : {},
						ref : [],
						add : function(rules) {
							var propertyLength=rules.properties.keys.length,
								propertyPriority=staticClass.priority.get(rules.selector);
								
							if (!this.stack[rules.hash])
							{
								this.stack[rules.hash]={keys:[]};
								this.ref.push(this.stack[rules.hash]);
							}
							
							for (var index=0;index<propertyLength;index++)
							{
								var currentProperty=rules.properties.keys[index];
							
								if (! this.stack[rules.hash][currentProperty])
								{
									this.stack[rules.hash][currentProperty]={
										priority	: propertyPriority,
										property	: rules.properties[currentProperty],
										selector	: rules.selector,
										path		: rules.path
									};
									this.stack[rules.hash].keys.push(currentProperty);
								}
								else if (this.stack[rules.hash][currentProperty].property.important<rules.properties[currentProperty].important
										|| (this.stack[rules.hash][currentProperty].priority<=propertyPriority
										&& this.stack[rules.hash][currentProperty].property.important==rules.properties[currentProperty].important))
								{
									this.stack[rules.hash][currentProperty].priority = propertyPriority;
									this.stack[rules.hash][currentProperty].property = rules.properties[currentProperty];
									this.stack[rules.hash][currentProperty].selector = rules.selector;
								}
							}
						}
					},
					add : function(summary){
						var trimmedSelector=staticClass.text.trimBoth(summary.selector),
							jQueryElement=$(trimmedSelector),
							jQueryPath=staticClass.path.get(jQueryElement) || false;
							
							if (jQueryPath===false)
								return this.inactive.add({
									selector 	: trimmedSelector,
									hash 		: staticClass.hash.get(trimmedSelector),
									properties 	: summary.properties
								});
							
							var jQueryElementLength=jQueryElement.length;
							
							if (jQueryElementLength<=1)
								return this.active.add({
									selector 	: trimmedSelector,
									hash 		: staticClass.hash.get(jQueryPath),
									path 		: jQueryPath,
									properties 	: summary.properties
								});
								
							while (jQueryElementLength--)
								this.active.add({
									selector 	: trimmedSelector,
									hash 		: staticClass.hash.get(jQueryPath[jQueryElementLength]),
									path 		: jQueryPath[jQueryElementLength],
									properties 	: summary.properties
								});
							
							return true;
					}
				},
				
				/*
				 * READER BLOCK
				 */
				read : {
					handler : {
						string : function(options){
							if (options.stylesheet.length>0)
							{
								var matchedClass;
							
								while (matchedClass=configuration.reader.style.exec(options.stylesheet))
									options.callback(options.parent,{
										propertyFilter	: options.propertyFilter,
										properties		: matchedClass[2],
										nameFilter		: options.nameFilter,
										names			: matchedClass[1]
									});
								
								return true;
							}
							
							return false;
						},
						array : function(options){
							var fetchedStringLength=options.stylesheet.length;
							
							if (fetchedStringLenght>0)
							{
								for (var mainIndex=0;mainIndex<fetchedStringLength;mainIndex++)
								{
									var matchedClass=options.stylesheet[mainIndex].match(configuration.reader.style);
								
									options.callback(options.parent,{
										propertyFilter	: options.propertyFilter,
										properties		: matchedClass[2],
										nameFilter		: options.nameFilter,
										names			: matchedClass[1]
									});
								}
								
								return true;
							}
							
							return false;
						},
						object : function(options){
							var styleSheetListLength=options.stylesheet.length;
							
							if (styleSheetListLength>0)
							{
								for (var mainIndex=0;mainIndex<styleSheetListLength;mainIndex++)
									options.callback(options.parent,{
										propertyFilter	: options.propertyFilter,
										properties		: options.stylesheet[mainIndex].style.cssText,
										nameFilter		: options.nameFilter,
										names			: options.stylesheet[mainIndex].selectorText
									});
								
								return true;
							}
							
							return false;
						}
					},
					controller : function(parent,options)
					{
						var properties=options.properties,
							propertiesLength=properties.length;
								
						if (propertiesLength>0)
						{
							var names=options.names,
								matches,
								stack={keys:[]};
								
							while (matches=options.propertyFilter.exec(properties))
							{
								stack[matches[1]]={
									value		:matches[2],
									important	:staticClass.text.isImportant(matches[2])
								};
								stack.keys.push(matches[1]);
							}
						
							if (stack.keys.length>0)
								while (matches=options.nameFilter.exec(names))
									parent.CSSStyleSheet.add({
										selector 	: matches[0],
										properties 	: stack
									});
						}
					},
					exec : function(parent){
						var stylesheet	=parent.CSSStyleSheet.get(),
							type		=staticClass.type.get(stylesheet);
					
						return this.handler[type] ? this.handler[type]({
							stylesheet 		: stylesheet,
							parent 			: parent,
							propertyFilter 	: parent.filter.get(),
							nameFilter 		: configuration.reader.name,
							callback 		: this.controller
						}) : false;
					}
				},
				
				/*
				 * HELPER BLOCK
				 */
				scrape : function(callback)
				{
					var self=this;
				
					$.when(this.read.exec(self)).done(function(){
						if (callback) callback(self,self.CSSStyleSheet);
					});
				}
			}
		};
		
	$.extend(reader.prototype,{
		/*
		 * FETCH FILTER BLOCK
		 */
		fetchFilter : {
			handler : {
				array : function (filter) {return new RegExp('([^}{]+){(?:[^}{]*(?:'+filter.join('|')+')[^}{]*)}','g');},
				string : function (filter) {return new RegExp('([^}{]+){(?:[^}{]*(?:'+filter+')[^}{]*)}','g');}
			},
			get : function(filter){
				var handler = staticClass.type.get(filter);
			
				return this.handler[handler] ? this.handler[handler](filter) : configuration.reader.style;
			}
		}
	});
	
	/*
	 * PUBLIC API
	 */
	String.prototype.readStylesheet = function(options){
		var rules = staticClass.remove.get(this,options.shrink || ['comments']),
			styleReader = new reader({
				stylesheet:options.fetch ? rules.match(reader.fetchFilter.get()) : rules,
				filter:options.filter || false
			});
		
		styleReader.scrape(function(s,css){
			options.callback(css);
		});
		
		return styleReader;
	};
	$.readStylesheet = function (options){
		var rules = options.stylesheet.rules || staticClass.remove.get(options.stylesheet,options.shrink || ['comments']),
			styleReader = new reader({
				stylesheet:rules,
				filter:options.filter || false
			});
		
		styleReader.scrape(function(s,css){
			options.callback(css);
		});
		
		return styleReader;
	};
	$.readStylesheetAjax = function (options) {
		return $.ajax({
			url : options.url,
			success : function (css){
				css.readStylesheet(options);
			}
		});
	};
})(jQuery);