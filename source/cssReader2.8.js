/*
 * Plugin: cssReader
 * Version: 2.8
 *
 * Beschreibung:
 * - Reading a CSS File.
 */
var cssReader = function (options){
  var generic = {
		targetUrl	: "",
		plainCss	: "",
		fetchedCss	: ""
	};
	
	cssReader.extend(this,{
		d:$.extend(generic,options),
		patternFetch:{},
		patternRead:{},
		classIns:{
			container:{keys:[]},
			add:function(name,hash,path,properties,refIns)
			{
				if (!(hash in this.container))
				{
					this.container[hash]=[];
					this.container.keys.push(hash);
				}

				this.container[hash].push({
					priority: 	name.getPriority(),
					name: 		name,
					path: 		path,
					properties: typeof properties == "number" ? properties : false
				});
				
				refIns.add(name,hash);
			}
		},
		refIns:{
			container:{keys:[]},
			add:function(name,hash)
			{
				if (!(name in this.container))
				{
					this.container[name]=[];
					this.container.keys.push(name);
				}
				
				this.container[name].push(hash);
			}
		},
		compiledIns:{
			container:{keys:[]},
			get:function(hash,classIns,attrIns)
			{
				if (!(hash in classIns.container)) return false;
					
				if (!(hash in this.container))
				{
					var c=classIns.container[hash];
					this.container[hash]={keys:[]};	
					this.container.keys.push(hash);
					
					for (g=0,gl=c.length;g<gl;g++)
					{
						var a=attrIns.container[c[g].properties].keys,
							j=a.length;
						
						while (--j>=0)
						{
							var ac=attrIns.container[c[g].properties][a[j]],
								ai=ac.isImportant();
							
							if (!(a[j] in this.container[hash]))
							{
								this.container[hash].keys.push(a[j]);
								this.container[hash][a[j]]={
									priority:c[g].priority,
									value:ac,
									path:c[g].path,
									name:c[g].name,
									important:ai
								};
							}
							else if (this.container[hash][a[j]].important<ai
									|| (this.container[hash][a[j]].priority<=c[g].priority
									&& this.container[hash][a[j]].important==ai))
							{
								this.container[hash][a[j]].priority=c[g].priority;
								this.container[hash][a[j]].value=ac;
								this.container[hash][a[j]].path=c[g].path;
								this.container[hash][a[j]].name=c[g].name;
								this.container[hash][a[j]].important=ai;
							}
						}
					}
							
					return this.container[hash];
				}
				else
					return this.container[hash];
			}
		},
		attrIns:{
			container:[],	
			add:function(index,name,value)
			{		
				if (!(index in this.container))
					this.container[index]={keys:[]};
					
				if (typeof this.container[index][name] == "function")
					name='db_'+name;
				
				if (!(name in this.container[index]))
				{
					this.container[index][name]=[];
					this.container[index].keys.push(name);
				}
				
				this.container[index][name].push(value);
			}
		},
		setUrl:function (url)
		{
			this.d.targetUrl=url;
		},
		setCss:function (css)
		{
			this.d.plainCss=css.compressCss();
		},
		fetchCss:function ()
		{
			this.d.fetchedCss=this.d.plainCss.match(cssReader.patternFetch);
		},
		fetchCssFilter:function(filterArray)
		{
			var filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
			
			if (!(filterString in this.patternFetch))
				this.patternFetch[filterString]=new RegExp("([#.\\w\\s:,>\\-_*\"=\\[\\]]+){(?:[^}]*(?:"+filterString+")+[^}]*)}","gi");

			this.d.fetchedCss=this.d.plainCss.match(this.patternFetch[filterString]);
		},
		get:function (filter)
		{
			var self=this;
			if (this.d.targetUrl)
			{
				return $.ajax({
							url: this.d.targetUrl,
							success: function (css) { 
								self.setCss(css);
								filter ? self.fetchCssFilter(filter) : self.fetchCss();
							}
				});
			}
		},  
		read:function (cssString)
		{
			var currentCssString=cssString ? cssString : this.d.fetchedCss;

			for (var i=0,il=currentCssString.length;i<il;i++)
			{
				if (matches=cssReader.patternRead.exec(currentCssString[i]))
				{
					var classNames=matches[1],
						classAttr=matches[2];
					
					if (classAttr && classAttr.length>0)
					{
						var attrSplit=classAttr.split(";"),
							attrContainerLength=this.attrIns.container.length,
							classAttrSize=attrSplit.length;
						
						while (--classAttrSize>=0)
						{
							var attrString=attrSplit[classAttrSize];
							
							if (cssReader.patternProperty.test(attrString))
							{
								var splittedAttrString=attrString.split(":"),
									splittedKey=splittedAttrString[0].trimBoth(),
									splittedValue=splittedAttrString[1].trimBoth();						
								
								if (splittedKey.length>0 && splittedValue.length>0)
									this.attrIns.add(attrContainerLength,splittedKey,splittedValue);
							}
						}

						var classParentFilter=classNames.indexOf(",")!=-1 ? classNames.split(",") : [classNames],
							g=classParentFilter.length;
						
						while (--g>=0)
						{
							var classString=classParentFilter[g];
							
							if (classString.length>0)
							{
								var trimmedClass=classString.trimBoth(),
									currentElement=$(trimmedClass),
									fullPath=currentElement ? currentElement.getPath() : false;

								if (fullPath === false)
									this.classIns.add(trimmedClass,trimmedClass.getStringHash(),false,attrContainerLength,this.refIns);
								else
								{
									if (currentElement.length>1)
									{
										var y=currentElement.length;
										while (--y>=0)
											this.classIns.add(trimmedClass,fullPath[y].getStringHash(),fullPath[y],attrContainerLength,this.refIns);
									}
									else
										this.classIns.add(trimmedClass,fullPath.getStringHash(),fullPath,attrContainerLength,this.refIns);
								}						
							}
						}
					}
				}
			}
			
			return true;
		},
		readFilter:function(filterArray)
		{
			var filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
			
			if (!(filterString in this.patternRead))
				this.patternRead[filterString]=new RegExp("("+filterString+"):[^;]+;","gi");
			
			var filterReg=this.patternRead[filterString],
				filteredCss=[],
				i=this.d.fetchedCss.length;
				
			while (--i>=0)
			{
				if (filterReg.test(this.d.fetchedCss[i]))
					filteredCss.push(this.d.fetchedCss[i]);
			}
			
			return this.read(filteredCss);
		},
		search:function(callback,searchStr)
		{
			var i=this.refIns.container.keys.length;
			while (--i>=0)
			{
				var j=this.refIns.container[this.refIns.container.keys[i]].length;
				while (--j>=0)
				{
					var cc=this.compiledIns.get(this.refIns.container[this.refIns.container.keys[i]][j],this.classIns,this.attrIns);
				
					if (searchStr ? searchStr in cc : true)
						callback.call(this,cc);
					else if (cssReader.attrInstance.debugPrefixString+searchStr in cc)
						callback.call(this,cc);
				}
			}
		},
		scrape:function(callback)
		{
			var self=this;
			$.when(self.get()).done(function(){
				$.when(self.read()).done(function(){
					if (callback) callback.call(self,self.d);
				});
			});
		},
		scrapeFilter:function(callback,filterArray,getFilter,readFilter)
		{
			var self=this;
			$.when(getFilter ? self.get(filterArray) : self.get()).done(function(){
				$.when(readFilter ? self.readFilter(filterArray) : self.read()).done(function(){
					if (callback) callback.call(self,self.d);
				});
			});
		}
	});
};
cssReader.extend=function(t,c){
	for (func in c)
		t[func]=c[func];
};
cssReader.extend(cssReader,{
	patternFetch:/([^}{]+{[^}{]*})/g,
	patternProperty:/\w+/,
	patternRead:/([^}{]+){((?:[^:]+:[^;]+;[\s]*)+?)}/,
	debugPrefixFilter:function(str){
		return str.replace(/^db_/,"");
	},
	DOMIndex:0,
	getIndex:function(q)
	{			
		if (!("DOMIndex" in q))
			return q.DOMIndex=this.DOMIndex++;
			
		return q.DOMIndex;
	},
	nodeIndexOf:function(q)
	{	
		if ("childNodesIndex" in q)
			return q.childNodesIndex;

		if (e=q.previousSibling)
		{
			var index=0;
			while(e)
			{   
				if ("childNodesIndex" in e)
					return q.childNodesIndex=e.childNodesIndex+1;
				
				index++;
				e=e.previousSibling;
			}
			
			return q.childNodesIndex=index;    
		}

		return -1;
	},
	getSelectors:function(q)
	{
		if ("selectors" in q)
			return q.selectors;

		if (x=q.tagName)
			return q.selectors=x.toLowerCase()
			+((i=q.id).length>0 ? "#"+i: "")
			+((c=q.className).length>0 ? "."+c.replace(/\s+/g,".") : "");

		return false;
	},
	getPathEx:function(q)
	{
		if (!("pathStack" in q))
		{
			var current=q,stack=[];
			
			while (this.getSelectors(current))
			{	
				this.nodeIndexOf(current);
				stack.push(current);
				current=current.parentNode;
				
				if ("pathStack" in current)
					return q.pathStack=stack.concat(current.pathStack);
			}
			
			return q.pathStack=stack;
		}
		
		return q.pathStack;
	}
});
cssReader.extend(String.prototype,{
	getPriority:function()
	{
		var rating=(matches=this.match(/#[^\s\.#]+/g)) ? matches.length*100 : 0;
			rating+=(matches=this.match(/\.[^\s\.#]+/g)) ? matches.length*10 : 0;
			rating+=(matches=this.replace(/[#\.][^\s\.#]+/g,"").match(/[^\s]+(?=#|\.)?/g)) ? matches.length*1 : 0;
		
		return rating;
	},
	isImportant:function()
	{
		return /!important$/gi.test(this);
	},
	trimBoth:function()
	{
		return this.replace(/^\s+|\s+$/g,"")
	},
	compressCss:function()
	{
		return this.replace(/\/\*[\s\S]+?\*\//g,"").replace(/[^\S][\s\n\r]*[^\S]/g,"");
	},
	getStringHash:function()
	{
		if ((i=this.length)==0) return false;
		
		var hash=0;
		while (--i>=0)
		{
			hash = ((hash<<5)-hash)+this.charCodeAt(i);
			hash = hash & hash;
		}
		
		return "d:"+hash.toString();
	}
});
cssReader.extend(Array.prototype,{
	isImportant:function()
	{
		var i=this.length;
		while (--i>=0)
			if (this[i].isImportant())
				return true;

		return false;
	},
	getStringHash:function()
	{
		if (this.length==0) return false;
		
		return "e:"+cssReader.getIndex(this[0]);
	}
});
jQuery.fn.getPath=function()
{
	if ((vl=this.length)>1)
	{
		var stack=[];
		for (var v=0;v<vl;v++)
			stack.push(cssReader.getPathEx(this[v]));
			
		return stack;
	}
	
	return this.length>0 ? cssReader.getPathEx(this[0]) : false;
};
