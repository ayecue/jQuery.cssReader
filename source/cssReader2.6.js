/*
 * Plugin: cssReader
 * Version: 2.6a
 *
 * Beschreibung:
 * - Reading a CSS File.
 */
var cssReader = function (options){
	var reader = this;
	var generic = {
		targetUrl	: "",
		plainCss	: "",
		fetchedCss	: ""
	};
	
	this.classIns	=new cssReader.classInstance();
	this.refIns		=new cssReader.refInstance();
	this.compiledIns=new cssReader.compiledInstance();
	this.attrIns	=new cssReader.attrInstance();
	
	this.d=$.extend(generic,options);
	
	this.setUrl=function (url)
	{
		reader.d.targetUrl=url;
	};
	
	this.setCss=function (css)
	{
		reader.d.plainCss=cssReader.getCompressedCss(css);
	};
	
	this.fetchCss=function ()
	{
		reader.d.fetchedCss=reader.d.plainCss.match(cssReader.patternFetch);
	};
	
	this.fetchCssFilter=function(filterArray)
	{
		filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
		
		if (!(filterString in cssReader.patternFetchFilter))
			cssReader.patternFetchFilter[filterString]=new RegExp("([#.\\w\\s:,>\\-_*\"=\\[\\]]+){(?:[^}]*(?:"+filterString+")+[^}]*)}","gi");

		reader.d.fetchedCss=reader.d.plainCss.match(cssReader.patternFetchFilter[filterString]);
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
			if (matches=cssReader.patternRead.exec(currentCssString[i]))
			{
				classNames=matches[1];
				classAttr=matches[2];

				if (classAttr && classAttr.length>0)
				{
					attrSplit=classAttr.split(";");
					attrContainerLength=reader.attrIns.container.length;
					
					for (var classAttrSize=0,cl=attrSplit.length;classAttrSize<cl;classAttrSize++)
					{
						attrString=attrSplit[classAttrSize];
						
						if (cssReader.patternProperty.test(attrString))
						{
							splittedAttrString=attrString.split(":");
							splittedKey=cssReader.getTrimStr(splittedAttrString[0]);
							splittedValue=cssReader.getTrimStr(splittedAttrString[1]);						
							
							if (splittedKey.length>0 && splittedValue.length>0)
								reader.attrIns.add(attrContainerLength,splittedKey,splittedValue);
						}
					}

					if (classAttrSize>0)
					{
						classParentFilter=classNames.indexOf(",")!=-1 ? classNames.split(",") : [classNames];
						
						for (g=0,gl=classParentFilter.length;g<gl;g++)
						{
							classString=classParentFilter[g];
							
							if (classString.length>0)
							{
								trimmedClassString=cssReader.getTrimStr(classString);
								try { var fullClassString=cssReader.getClassPath($(trimmedClassString));}
								catch (e) { var fullClassString=false;}

								if (typeof fullClassString == "string")
									reader.classIns.add(trimmedClassString,cssReader.getClassHash(fullClassString),fullClassString,attrContainerLength,reader.refIns);
								else if (fullClassString === false)
									reader.classIns.add(trimmedClassString,cssReader.getClassHash(trimmedClassString),false,attrContainerLength,reader.refIns);
								else
								{
									for (y=0,yl=fullClassString.length;y<yl;y++)
										reader.classIns.add(trimmedClassString,cssReader.getClassHash(fullClassString[y]),fullClassString[y],attrContainerLength,reader.refIns);
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
		
		if (!(filterString in cssReader.patternReadFilter))
			cssReader.patternReadFilter[filterString]=new RegExp("("+filterString+"):[^;]+;","gi");
		
		filterReg=cssReader.patternReadFilter[filterString];
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
				else if (cssReader.attrInstance.debugPrefixString+searchStr in cc)
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
cssReader.patternFetch=new RegExp("([^}{]+{[^}{]*})","g");
cssReader.patternFetchFilter={};
cssReader.patternProperty=new RegExp("\\w+","");
cssReader.patternRead=new RegExp("([^}{]+){((?:[^:]+:[^;]+;[\\s]*)+?)}","");
cssReader.patternReadFilter={};
cssReader.classInstance=function (){
	var instance=this;
	this.container={keys:[]};
	
	this.add=function(classString,classHash,classPath,attrIndex,refIns)
	{
		if (!(classHash in instance.container))
		{
			instance.container[classHash]=[];
			instance.container.keys.push(classHash);
		}

		instance.container[classHash].push({
			lastPriority: 	cssReader.getClassPriority(classString),
			classString: 	classString,
			classPath: 		classPath,
			attrIndex: 		typeof attrIndex == "number" ? attrIndex : false
		});
		
		refIns.add(classString,classHash);
	};
};
cssReader.refInstance=function(){
	var instance=this;
	this.container={keys:[]};
	
	this.add=function(classString,classHash)
	{
		if (!(classString in instance.container))
		{
			instance.container[classString]=[];
			instance.container.keys.push(classString);
		}
		
		instance.container[classString].push(classHash);
	};
};
cssReader.attrInstance=function(){
	var instance=this;
	this.container=[];
	
	this.add=function(index,attrName,attrValue)
	{		
		if (!(index in instance.container))
			instance.container[index]={keys:[]};
			
		if (typeof instance.container[index][attrName] == "function")
			attrName=cssReader.attrInstance.debugPrefixString+attrName;
		
		if (!(attrName in instance.container[index]))
		{
			instance.container[index][attrName]=[];
			instance.container[index].keys.push(attrName);
		}
		
		instance.container[index][attrName].push(attrValue);
	};
};
cssReader.attrInstance.debugPrefixString="db_";
cssReader.attrInstance.debugPrefixPattern=new RegExp("^"+cssReader.attrInstance.debugPrefixString,"i");
cssReader.attrInstance.debugPrefixFilter=function(str){
	return str.replace(cssReader.attrInstance.debugPrefixPattern,"")
};
cssReader.compiledInstance=function(){
	var instance=this;
	this.container={keys:[]};
	
	this.get=function(classHash,classIns,attrIns)
	{
		if (!(classHash in classIns.container)) return false;
			
		if (!(classHash in instance.container))
		{
			instance.container[classHash]={keys:[]};
			instance.container.keys.push(classHash);
			c=classIns.container[classHash];
			
			for (g=0,gl=c.length;g<gl;g++)
			{
				a=attrIns.container[c[g].attrIndex].keys;
				
				for (j=0,jl=a.length;j<jl;j++)
				{
					ac=attrIns.container[c[g].attrIndex][a[j]];
					ai=cssReader.isAttrImportant(ac);
					
					if (!(a[j] in instance.container[classHash]))
					{
						instance.container[classHash].keys.push(a[j]);
						instance.container[classHash][a[j]]={
							attrPriority:c[g].lastPriority,
							attrValue:ac,
							attrPath:c[g].classPath,
							attrClass:c[g].classString,
							attrImportant:ai
						};
					}
					else if (instance.container[classHash][a[j]].attrImportant<ai
							|| (instance.container[classHash][a[j]].attrPriority<=c[g].lastPriority
							&& instance.container[classHash][a[j]].attrImportant==ai))
					{
						instance.container[classHash][a[j]]={
							attrPriority:c[g].lastPriority,
							attrValue:ac,
							attrPath:c[g].classPath,
							attrClass:c[g].classString,
							attrImportant:ai
						};
					}
				}
			}
			
			return instance.container[classHash];
		}
		else
			return instance.container[classHash];
	};
};
cssReader.getTrimStr = function(str)
{
	return str.replace(cssReader.getTrimStr.pattern,"");
}
cssReader.getTrimStr.pattern=new RegExp("^\\s+|\\s+$","g");
cssReader.getCompressedCss = function(plainCss)
{
	return plainCss.replace(cssReader.getCompressedCss.patternComment,"").replace(cssReader.getCompressedCss.patternWhitespace,"");
}
cssReader.getCompressedCss.patternComment=new RegExp("\\/\\*[\\s\\S]+?\\*\\/","g");
cssReader.getCompressedCss.patternWhitespace=new RegExp("[^\\S][\\s\\n\\r]*[^\\S]","g");
cssReader.getClassHash = function(classString)
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
cssReader.getSelectors=function(element)
{   
	if (x=element.localName)
		return x+((i=element.id).length>0 ? "#"+i: "")+((c=element.className).length>0 ? "."+c.replace(cssReader.getClassPath.pattern,".") : "");
		
	return false;
};
cssReader.getClassPathEx=function(element)
{
	if (!element) return false;

	if (!("cssReader_PathEx" in element))
	{
		var parent=element.parentNode,path='',selectors;
		
		if ("cssReader_PathEx" in parent)
			return element.cssReader_PathEx=parent.cssReader_PathEx+'>'+cssReader.getSelectors(element);

		while (selectors=cssReader.getSelectors(parent))
		{
			if ("cssReader_PathEx" in parent)
			{
				path=parent.cssReader_PathEx+'>'+path;
				break
			}
			
			path=selectors+'>'+path;
			parent = parent.parentNode;
		}

		return element.cssReader_PathEx=path+cssReader.getSelectors(element);
	}

	return element.cssReader_PathEx;
};
cssReader.getClassPath=function(element)
{
	if ((vl=element.length)>1)
	{
		stack=[];
		for (v=0;v<vl;v++)
			stack.push(cssReader.getClassPathEx(element[v]));

		return stack;
	}
	
	return cssReader.getClassPathEx(element[0]);
};
cssReader.getClassPath.pattern=new RegExp("\\s","g");
cssReader.getClassPriority=function (className)
{
	rating=0;
	
	rating+=(matches=className.match(cssReader.getClassPriority.patternId)) ? matches.length*100 : 0;
	rating+=(matches=className.match(cssReader.getClassPriority.patternClass)) ? matches.length*10 : 0;
	rating+=(matches=className.replace(cssReader.getClassPriority.patternReplace,"").match(cssReader.getClassPriority.patternAll)) ? matches.length*1 : 0;
	
	return rating;
};
cssReader.getClassPriority.patternId=new RegExp("#[^\\s\\.#]+","g");
cssReader.getClassPriority.patternClass=new RegExp("\\.[^\\s\\.#]+","g");
cssReader.getClassPriority.patternAll=new RegExp("[^\\s]+(?=#|\\.)?","g");
cssReader.getClassPriority.patternReplace=new RegExp("[#\\.][^\\s\\.#]+","g");
cssReader.isAttrImportant=function (value)
{
	return cssReader.isAttrImportant.pattern.test(value);
};
cssReader.isAttrImportant.pattern=new RegExp("!important$","gi");
