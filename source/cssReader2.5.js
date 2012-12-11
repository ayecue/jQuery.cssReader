/*
 * Plugin: cssReader
 * Version: 2.5
 *
 * Beschreibung:
 * - Reading a CSS File.
 */
var classInstance=function (){
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
var refInstance=function(){
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
var attrInstance=function(){
	var instance=this;
	this.container=[];
	
	this.add=function(index,attrName,attrValue)
	{		
		if (!(index in instance.container))
			instance.container[index]={keys:[]};
			
		if (typeof instance.container[index][attrName] == "function")
			attrName=attrInstance.debugPrefixString+attrName;
		
		if (!(attrName in instance.container[index]))
		{
			instance.container[index][attrName]=[];
			instance.container[index].keys.push(attrName);
		}
		
		instance.container[index][attrName].push(attrValue);
	};
};
attrInstance.debugPrefixString="db_";
attrInstance.debugPrefixPattern=new RegExp("^"+attrInstance.debugPrefixString,"i");
attrInstance.debugPrefixFilter=function(str){
	return str.replace(attrInstance.prefixPattern,"")
};
var compiledInstance=function(){
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
var cssReader = function (options){
	var reader = this;
	var generic = {
		targetUrl	: "",
		plainCss	: "",
		fetchedCss	: ""
	};
	
	this.classIns	=new classInstance();
	this.refIns		=new refInstance();
	this.compiledIns=new compiledInstance();
	this.attrIns	=new attrInstance();
	
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
		reader.d.fetchedCss=reader.d.plainCss.match(/([#.\w\s:,>\-_*"=\[\]]+){(?:[^}]*)}/gi);
	};
	
	this.fetchCssFilter=function(filterArray)
	{
		filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterArray;
		
		reader.d.fetchedCss=reader.d.plainCss.match(new RegExp("([#.\\w\\s:,>\\-_*\"=\\[\\]]+){(?:[^}]*(?:"+filterString+")+[^}]*)}","gi"));
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
			classNames=currentCssString[i].replace(/{([^}]*)}/gi,"").match(/(?:[#.\w\s:,>\-_*"=\[\]]+)/gi);
			classAttr=currentCssString[i].replace(/(?:[#.\w\s:,>\-_*"=\[\]]+{|}$)/ig,"").match(/[^}{*\/]+:[^}{]*[^*\/]*?;?/gi,"");

			if (classAttr && classAttr[0].length>0)
			{
				attrSplit=classAttr[0].split(";");
				attrContainerLength=reader.attrIns.container.length;
				
				for (var classAttrSize=0,cl=attrSplit.length;classAttrSize<cl;classAttrSize++)
				{
					attrString=attrSplit[classAttrSize];
					
					if (attrString.length>0)
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
					for (var j=0,jl=classNames.length;j<jl;j++)
					{
						classParentFilter=classNames[j].indexOf(",")!=-1 ? classNames[j].split(",") : [classNames[j]];
						
						for (var g=0,gl=classParentFilter.length;g<gl;g++)
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
									for (var y=0,yl=fullClassString.length;y<yl;y++)
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
		
		filterReg=new RegExp("("+filterString+"):[^}{]*[^*\\/]*?;","gi");
		filteredCss=[];
		for (var i=0,il=reader.d.fetchedCss.length;i<il;i++)
		{
			if (reader.d.fetchedCss[i].match(filterReg))
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
				else if (attrInstance.debugPrefixString+searchStr in cc)
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
cssReader.getTrimStr = function(str)
{
	return str.replace(/^\s+|\s+$/g,"");
}
cssReader.getCompressedCss = function(plainCss)
{
	return plainCss.replace(/\/\*[\s\S]+?\*\//g,"").replace(/[^\S][\s\n\r]*[^\S]/g,"");
}
cssReader.getClassHash = function(classString)
{
	if (classString.lenght==0) return false;

	var hash=0;
	$.each(classString,function(index){
		hash = ((hash<<5)-hash)+classString.charCodeAt(index);
		hash = hash & hash;
	});

	return "md"+hash.toString();
};
cssReader.getClassPath=function (element)
{
	currentElement=$(element);
	if (!currentElement[0]) return false;

	var allClassPath=[];
	currentElement.each(function(){
		var classPath="";
		self=$(this);

		self.parents("*").each(function(){
			parents=$(this);
			classString=(className=parents.attr("class")) ? "."+className.replace(/\s/gi,".") : "";
			idString=(idName=parents.attr("id")) ? "#"+idName.replace(/\s/gi,"#") : "";
		
			classPath=parents[0].tagName.toLowerCase()+idString+classString+" "+classPath;
		});

		allClassPath.push(	classPath.replace(/\s/gi," > ")
							+self[0].tagName.toLowerCase()
							+((className=self.attr("class")) ? "."+className.replace(/\s/gi,".") : "")
							+((idName=self.attr("id")) ? "#"+idName.replace(/\s/gi,"#") : ""));
	});
	
	return allClassPath.length>0 ? allClassPath : false;
};
cssReader.getClassPriority=function (className)
{
	rating=0;
	singleSelector=className.split(" ");

	for (i=0,il=singleSelector.length;i<il;i++)
	{		
		if (/[#.][\w:\-_"=\[\]]+/.test(singleSelector[i]))
		{	
			try 
			{
				rating+=(id=singleSelector[i].match(/#[\w:\-_"=\[\]]+/gi)) ? id.length*100 : 0;
				rating+=(cl=singleSelector[i].match(/\.[\w:\-_"=\[\]]+/gi)) ? cl.length*10 : 0;
				rating+=(tg=singleSelector[i].match(/\w+[#.]/gi)) ? tg.length*1 : 0;
			}
			catch(e)
			{
				rating+=(id=singleSelector[i].toString().match(/#[\w:\-_"=\[\]]+/gi)) ? id.length*100 : 0;
				rating+=(cl=singleSelector[i].toString().match(/\.[\w:\-_"=\[\]]+/gi)) ? cl.length*10 : 0;
				rating+=(tg=singleSelector[i].toString().match(/\w+[#.]/gi)) ? tg.length*1 : 0;
			}
		}
		else if(/[^>]+/.test(singleSelector[i]))
			rating++;
	}
	
	return rating;
};
cssReader.isAttrImportant=function (value)
{
	return /!important$/.test(value);
};