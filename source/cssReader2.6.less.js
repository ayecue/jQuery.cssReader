/*
 * Plugin: cssReaderLess
 * Version: 2.6 less
 *
 * Beschreibung:
 * - Reading a CSS File.
 */
var cssReaderLess = function (options){
  var reader = this;
	var generic = {
		targetUrl	: "",
		plainCss	: "",
		fetchedCss	: ""
	};
	
	this.classIns	=new cssReaderLess.classInstance();
	this.refIns		=new cssReaderLess.refInstance();
	this.compiledIns=new cssReaderLess.compiledInstance();
	this.attrIns	=new cssReaderLess.attrInstance();
	
	this.d=$.extend(generic,options);
	
	this.setUrl=function (url)
	{
		reader.d.targetUrl=url;
	};
	
	this.setCss=function (css)
	{
		reader.d.plainCss=cssReaderLess.getCompressedCss(css);
	};
	
	this.fetchCss=function ()
	{
		reader.d.fetchedCss=reader.d.plainCss.match(cssReaderLess.patternFetch);
	};
	
	this.fetchCssFilter=function(filterArray)
	{
		filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
		
		if (!(filterString in cssReaderLess.patternFetchFilter))
			cssReaderLess.patternFetchFilter[filterString]=new RegExp("([#.\\w\\s:,>\\-_*\"=\\[\\]]+){(?:[^}]*(?:"+filterString+")+[^}]*)}","gi");

		reader.d.fetchedCss=reader.d.plainCss.match(cssReaderLess.patternFetchFilter[filterString]);
	};
	
	this.get=function (filter)
	{
		if (reader.d.targetUrl)
		{
			return $.ajax({
						url: reader.d.targetUrl,
						success: function (css) { 
							reader.setCss(css);
							filter ? reader.fetchCssFilter(filter) : reader.fetchCss();
						}
			});
		}
	};  
	
	this.read=function (cssString)
	{
		currentCssString=cssString ? cssString : reader.d.fetchedCss;

		for (var i=0,il=currentCssString.length;i<il;i++)
		{
			if (matches=cssReaderLess.patternRead.exec(currentCssString[i]))
			{
				classNames=matches[1];
				classProperties=matches[2];

				if (classProperties && classProperties.length>0)
				{
					propSplit=classProperties.split(";");
					propLength=reader.attrIns.container.length;
					
					for (var classAttrSize=0,cl=propSplit.length;classAttrSize<cl;classAttrSize++)
					{
						propString=propSplit[classAttrSize];
						
						if (cssReaderLess.patternProperty.test(propString))
						{
							splittedPropString=propString.split(":");
							splittedKey=cssReaderLess.getTrimStr(splittedPropString[0]);
							splittedValue=cssReaderLess.getTrimStr(splittedPropString[1]);						
							
							if (splittedKey.length>0 && splittedValue.length>0)
								reader.attrIns.add(propLength,splittedKey,splittedValue);
						}
					}

					if (classAttrSize>0)
					{
						classes=classNames.indexOf(",")!=-1 ? classNames.split(",") : [classNames];
						
						for (g=0,gl=classes.length;g<gl;g++)
						{
							classString=classes[g];
							
							if (classString.length>0)
							{
								trimmedClassString=cssReaderLess.getTrimStr(classString);
								try { var fullClassString=cssReaderLess.getClassPath($(trimmedClassString));}
								catch (e) { var fullClassString=false;}

								if (typeof fullClassString == "string")
									reader.classIns.add(trimmedClassString,cssReaderLess.getClassHash(fullClassString),fullClassString,propLength,reader.refIns);
								else if (fullClassString === false)
									reader.classIns.add(trimmedClassString,cssReaderLess.getClassHash(trimmedClassString),false,propLength,reader.refIns);
								else
								{
									for (y=0,yl=fullClassString.length;y<yl;y++)
										reader.classIns.add(trimmedClassString,cssReaderLess.getClassHash(fullClassString[y]),fullClassString[y],propLength,reader.refIns);
								}
							}
						}
					}
				}
			}
		}
		
		return true;
	};
	
	this.readFilter=function(filterArray)
	{
		filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
		
		if (!(filterString in cssReaderLess.patternReadFilter))
			cssReaderLess.patternReadFilter[filterString]=new RegExp("("+filterString+"):[^;]+;","gi");
		
		filterReg=cssReaderLess.patternReadFilter[filterString];
		filteredCss=[];
		for (var i=0,il=reader.d.fetchedCss.length;i<il;i++)
		{
			if (filterReg.test(reader.d.fetchedCss[i]))
				filteredCss.push(reader.d.fetchedCss[i]);
		}
		
		return reader.read(filteredCss);
	};
	
	this.search=function(callback,searchStr)
	{
		for (var i=0,il=reader.refIns.container.keys.length;i<il;i++)
		{
			for (var j=0,jl=reader.refIns.container[reader.refIns.container.keys[i]].length;j<jl;j++)
			{
				cc=reader.compiledIns.get(reader.refIns.container[reader.refIns.container.keys[i]][j],reader.classIns,reader.attrIns);
			
				if (searchStr ? searchStr in cc : true)
					callback.call(reader,cc);
				else if (cssReaderLess.attrInstance.debugPrefixString+searchStr in cc)
					callback.call(reader,cc);
			}
		}
	};
	
	this.scrape=function(callback)
	{
		$.when(reader.get()).done(function(){
			$.when(reader.read()).done(function(){
				if (callback) callback.call(reader,reader.d);
			});
		});
	};
	
	this.scrapeFilter=function(callback,filterArray,getFilter,readFilter)
	{
		$.when(getFilter ? reader.get(filterArray) : reader.get()).done(function(){
			$.when(readFilter ? reader.readFilter(filterArray) : reader.read()).done(function(){
				if (callback) callback.call(reader,reader.d);
			});
		});
	};
};
cssReaderLess.patternFetch=new RegExp("([^}{]+{[^}{]*})","g");
cssReaderLess.patternFetchFilter={};
cssReaderLess.patternProperty=new RegExp("\\w+","");
cssReaderLess.patternRead=new RegExp("([^}{]+){((?:[^:]+:[^;]+;[\\s]*)+?)}","");
cssReaderLess.patternReadFilter={};
cssReaderLess.classInstance=function (){
	var instance=this;
	this.container={keys:[]};
	
	this.add=function(string,hash,path,properties,refIns)
	{
		if (!(hash in instance.container))
		{
			instance.container[hash]=[];
			instance.container.keys.push(hash);
		}

		instance.container[hash].push({
			priority: 	cssReaderLess.getClassPriority(string),
			string: 	string,
			path: 		path,
			properties: typeof properties == "number" ? properties : false,
		});
		
		refIns.add(string,hash);
	};
};
cssReaderLess.refInstance=function(){
	var instance=this;
	this.container={keys:[]};
	
	this.add=function(string,hash)
	{
		if (!(string in instance.container))
		{
			instance.container[string]=[];
			instance.container.keys.push(string);
		}
		
		instance.container[string].push(hash);
	};
};
cssReaderLess.attrInstance=function(){
	var instance=this;
	this.container=[];
	
	this.add=function(index,propName,propValue)
	{		
		if (!(index in instance.container))
			instance.container[index]={keys:[]};
			
		if (typeof instance.container[index][propName] == "function")
			propName=cssReaderLess.attrInstance.debugPrefixString+propName;
		
		if (!(propName in instance.container[index]))
		{
			instance.container[index][propName]=[];
			instance.container[index].keys.push(propName);
		}
		
		instance.container[index][propName].push({
			value:propValue,
			important:cssReaderLess.isAttrImportant(propValue)
		});
	};
};
cssReaderLess.attrInstance.debugPrefixString="db_";
cssReaderLess.attrInstance.debugPrefixPattern=new RegExp("^"+cssReaderLess.attrInstance.debugPrefixString,"i");
cssReaderLess.attrInstance.debugPrefixFilter=function(str){
	return str.replace(cssReaderLess.attrInstance.debugPrefixPattern,"")
};
cssReaderLess.compiledInstance=function(){
	var instance=this;
	this.container={keys:[]};
	
	this.get=function(hash,classIns,attrIns)
	{
		if (!(hash in classIns.container)) return false;
			
		if (!(hash in instance.container))
		{
			var last;

			instance.container[hash]={keys:[]};
			instance.container.keys.push(hash);
			c=classIns.container[hash];
			
			for (g=0,gl=c.length;g<gl;g++)
			{
				a=attrIns.container[c[g].properties].keys;
				
				for (j=0,jl=a.length;j<jl;j++)
				{
					ac=attrIns.container[c[g].properties][a[j]];
					
					if (!(a[j] in instance.container[hash]))
					{
						instance.container[hash].keys.push(a[j]);
						instance.container[hash][a[j]]={
							classIns: c[g],
							propIns: ac
						};
						last=c[g];
					}
					else if (attrIns.container[last.properties].important<ac.important
							|| (last.priority<=c[g].priority
							&& attrIns.container[last.properties].important==ac.important))
					{
						instance.container[hash][a[j]]={
							classIns: c[g],
							propIns: ac
						};
					}
				}
			}
			
			return instance.container[hash];
		}
		else
			return instance.container[hash];
	};
};
cssReaderLess.getTrimStr = function(str)
{
	return str.replace(cssReaderLess.getTrimStr.pattern,"");
}
cssReaderLess.getTrimStr.pattern=new RegExp("^\\s+|\\s+$","g");
cssReaderLess.getCompressedCss = function(plainCss)
{
	return plainCss.replace(cssReaderLess.getCompressedCss.patternComment,"").replace(cssReaderLess.getCompressedCss.patternWhitespace,"");
}
cssReaderLess.getCompressedCss.patternComment=new RegExp("\\/\\*[\\s\\S]+?\\*\\/","g");
cssReaderLess.getCompressedCss.patternWhitespace=new RegExp("[^\\S][\\s\\n\\r]*[^\\S]","g");
cssReaderLess.getClassHash = function(classString)
{
	if (classString.lenght==0) return false;

	hash=0;
	for (i=0,il=classString.length;i<il;i++)
	{
		hash = ((hash<<5)-hash)+classString.charCodeAt(i);
		hash = hash & hash;
	}

	return "md"+hash.toString();
};
cssReaderLess.getClassPath=function (element)
{
	if (!element[0]) return false;

	allClassPath=[];
	for (i=0,il=element.length;i<il;i++)
	{
		current=element.eq(i);
		parents=current.parents("*");
		classPath="";
		
		for (j=0,jl=parents.length;j<jl;j++)
		{
			classString	=(className=parents[j].className) 		? "."+className.replace(cssReaderLess.getClassPath.pattern,".") : "";
			idString	=(idName=parents[j].getAttribute("id")) ? "#"+idName.replace(cssReaderLess.getClassPath.pattern,"#") : "";
			
			classPath=parents[j].tagName.toLowerCase()+idString+classString+" "+classPath;
		}
		
		allClassPath.push(
							classPath.replace(cssReaderLess.getClassPath.pattern," > ")
							+ element[i].tagName.toLowerCase()
							+ ((className=element[i].className) 		? "."+className.replace(cssReaderLess.getClassPath.pattern,".") : "")
							+ ((idName=element[i].getAttribute("id")) 	? "#"+idName.replace(cssReaderLess.getClassPath.pattern,"#") : "")
		);
	}
	
	return allClassPath.length>0 ? allClassPath : false;
};
cssReaderLess.getClassPath.pattern=new RegExp("\\s","g");
cssReaderLess.getClassPriority=function (className)
{
	rating=0;
	
	rating+=(matches=className.match(cssReaderLess.getClassPriority.patternId)) ? matches.length*100 : 0;
	rating+=(matches=className.match(cssReaderLess.getClassPriority.patternClass)) ? matches.length*10 : 0;
	rating+=(matches=className.replace(cssReaderLess.getClassPriority.patternReplace,"").match(cssReaderLess.getClassPriority.patternAll)) ? matches.length*1 : 0;
	
	return rating;
};
cssReaderLess.getClassPriority.patternId=new RegExp("#[^\\s\\.#]+","g");
cssReaderLess.getClassPriority.patternClass=new RegExp("\\.[^\\s\\.#]+","g");
cssReaderLess.getClassPriority.patternAll=new RegExp("[^\\s]+(?=#|\\.)?","g");
cssReaderLess.getClassPriority.patternReplace=new RegExp("[#\\.][^\\s\\.#]+","g");
cssReaderLess.isAttrImportant=function (value)
{
	return cssReaderLess.isAttrImportant.pattern.test(value);
};
cssReaderLess.isAttrImportant.pattern=new RegExp("!important$","gi");
