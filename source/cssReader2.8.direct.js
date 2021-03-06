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
		patternFetchFilter:{},
		patternReadFilter:{},
		patternFetch:/([^}{]+{[^}{]*})/g,
		patternProperty:/\w+/,
		patternRead:/([^}{]+){((?:[^:]+:[^;]+;[\s]*)+?)}/,
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
					priority: 	cssReader.getPriority(name),
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
								ai=cssReader.isImportant(ac);
							
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
			this.d.plainCss=cssReader.compressCss(css);
		},
		fetchCss:function ()
		{
			this.d.fetchedCss=this.d.plainCss.match(this.patternFetch);
		},
		fetchCssFilter:function(filterArray)
		{
			var filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
			
			if (!(filterString in this.patternFetchFilter))
				this.patternFetchFilter[filterString]=new RegExp("([#.\\w\\s:,>\\-_*\"=\\[\\]]+){(?:[^}]*(?:"+filterString+")+[^}]*)}","gi");

			this.d.fetchedCss=this.d.plainCss.match(this.patternFetchFilter[filterString]);
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
				var matches=this.patternRead.exec(currentCssString[i]),
					classNames=matches[1],
					classAttr=matches[2];
				
				var attrSplit=classAttr.split(";"),
					attrContainerLength=this.attrIns.container.length,
					classAttrSize=attrSplit.length;
				
				while (--classAttrSize>=0)
				{
					var attrString=attrSplit[classAttrSize];
					
					if (this.patternProperty.test(attrString))
					{
						var splittedAttrString=attrString.split(":"),
							splittedKey=cssReader.trimBoth(splittedAttrString[0]),
							splittedValue=cssReader.trimBoth(splittedAttrString[1]);						
						
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
						var trimmedClass=cssReader.trimBoth(classString),
							currentElement=$(trimmedClass),
							fullPath=currentElement ? cssReader.getPath(currentElement) : false;

						if (fullPath === false)
							this.classIns.add(trimmedClass,cssReader.getStringHash(trimmedClass),false,attrContainerLength,this.refIns);
						else
						{
							if (currentElement.length>1)
							{
								var y=currentElement.length;
								while (--y>=0)
									this.classIns.add(trimmedClass,cssReader.getStringHash(fullPath[y]),fullPath[y],attrContainerLength,this.refIns);
							}
							else
								this.classIns.add(trimmedClass,cssReader.getStringHash(fullPath),fullPath,attrContainerLength,this.refIns);
						}						
					}
				}
			}
			
			return true;
		},
		readFilter:function(filterArray)
		{
			var filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
			
			if (!(filterString in this.patternReadFilter))
				this.patternReadFilter[filterString]=new RegExp("("+filterString+"):[^;]+;","gi");
			
			var filterReg=this.patternReadFilter[filterString],
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
					else if ("db_"+searchStr in cc)
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
	},
	getPriority:function(s)
	{
		var rating=(matches=s.match(/#[^\s\.#]+/g)) ? matches.length*100 : 0;
			rating+=(matches=s.match(/\.[^\s\.#]+/g)) ? matches.length*10 : 0;
			rating+=(matches=s.replace(/[#\.][^\s\.#]+/g,"").match(/[^\s]+(?=#|\.)?/g)) ? matches.length*1 : 0;
		
		return rating;
	},
	isImportant:function(q)
	{
		if (typeof q != "string")
		{
			var i=q.length;
			while (--i>=0)
				if (/!important$/gi.test(q[i]))
					return true;

			return false;
		}
	
		return /!important$/gi.test(q);
	},
	trimBoth:function(s)
	{
		return s.replace(/^\s+|\s+$/g,"")
	},
	compressCss:function(s)
	{
		return s.replace(/\/\*[\s\S]+?\*\/|[^\S][\s\n\r]*[^\S]|[^{}]+{[^\S{}]*?}/g,"");
	},
	getStringHash:function(q)
	{
		if ((i=q.length)==0) return false;

		if (typeof q == "string")
		{
			var hash=0;
			while (--i>=0)
			{
				hash = ((hash<<5)-hash)+q.charCodeAt(i);
				hash = hash & hash;
			}
			
			return "d:"+hash.toString();
		}
		
		return "e:"+cssReader.getIndex(q[0]);
	},
	getPath:function(q)
	{
		if ((vl=q.length)>1)
		{
			var stack=[];
			for (var v=0;v<vl;v++)
				stack.push(cssReader.getPathEx(q[v]));
				
			return stack;
		}
		
		return q.length>0 ? cssReader.getPathEx(q[0]) : false;
	}
});
