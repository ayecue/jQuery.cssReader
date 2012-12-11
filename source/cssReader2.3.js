/*
 * Plugin: cssReader
 * Version: 2.3
 *
 * Beschreibung:
 * - Reading a CSS File.
 */
var classInstance=function (){
	var instance=this;
	this.container=[];

	this.free=function()
	{
		if (instance.container.length>0)
		{
			delete instance.container;
			instance.container=[];
		}
	};
	
	this.add=function(classString,classHash,classPath,attrIndex,refIns)
	{
		if (!(classHash in instance.container))
			instance.container[classHash]=[];

		instance.container[classHash].push({
			lastPriority: cssReader.getClassPriority(classString),
			classString: classString,
			classPath: classPath,
			attrIndex: typeof attrIndex == "number" ? attrIndex : false
		});
		
		refIns.add(classString,classHash);
	};
	
	this.get=function(classHash)
	{
		return (classHash in instance.container) ? instance.container[classHash] : false;
	};
};
var refInstance=function(){
	var instance=this;
	this.container=[];

	this.free=function()
	{
		if (instance.container.length>0)
		{
			delete container;
			container=[];
		}
	};
	
	this.add=function(classString,classHash)
	{
		if (!(classString in instance.container))
			instance.container[classString]=[];
			
		instance.container[classString].push(classHash);
	};
	
	this.get=function(classString)
	{
		return (classString in instance.container) ? instance.container[classString] : false;
	};
};
var compiledInstance=function(){
	var instance=this;
	this.container=[];

	this.free=function()
	{
		if (instance.container.length>0)
		{
			delete instance.container;
			instance.container=[];
		}
	};
	
	this.get=function(classHash,classIns,attrIns)
	{
		if (!(classHash in classIns.container)) return false;
			
		if (!(classHash in instance.container))
		{
			instance.container[classHash]=[];

			$.each(classIns.get(classHash),function(i,c){
				var classAttr=attrIns.get(c.attrIndex);

				for (attrKey in classAttr)
				{
					var attrImportant=cssReader.isAttrImportant(classAttr[attrKey]);

					if (!(attrKey in instance.container) 
						|| (instance.container[classHash][attrKey].attrImportant<attrImportant 
						|| (instance.container[classHash][attrKey].attrPrio<=c.lastPriority
						&& instance.container[classHash][attrKey].attrImportant==attrImportant)))
					{
						instance.container[classHash][attrKey]={
							attrPrio:c.lastPriority,
							attrValue:classAttr[attrKey],
							attrPath:c.classPath,
							attrClass:c.classString,
							attrImportant:attrImportant
						};
					}
				}
			});
			
			return instance.container[classHash];
		}
		else
			return instance.container[classHash];
	};
};
var attrInstance=function(){
	var instance=this;
	this.container=[];

	this.free=function()
	{
		if (instance.container.length>0)
		{
			delete instance.container;
			instance.container=[];
		}
	};
	
	this.add=function(index,attrName,attrValue)
	{		
		if (!(index in instance.container))
			instance.container[index]=[];
			
		try
		{
			if (!(attrName in instance.container[index]))
				instance.container[index][attrName]=[];
			
			instance.container[index][attrName].push(attrValue);
		}
		catch(e)
		{
			if (!(attrInstance.debugPrefixString+attrName in instance.container[index]))
				instance.container[index][attrInstance.debugPrefixString+attrName]=[];
				
			instance.container[index][attrInstance.debugPrefixString+attrName].push(attrValue);
		}
	};
	
	this.get=function(index)
	{
		return (index in instance.container) ? instance.container[index] : false;
	};
};
attrInstance.debugPrefixString="&";
attrInstance.debugPrefixPattern=new RegExp(attrInstance.debugPrefixString,"i");
attrInstance.debugPrefixFilter=function(str){
	return str.replace(attrInstance.prefixPattern,"")
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
		var filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterString=filterArray;
		
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
		var currentCssString=cssString ? cssString : reader.d.fetchedCss;
	
		if (currentCssString.length>0)
		{
			return $.each(currentCssString,function(i,parentElement) {
				var classNames=parentElement.replace(/{([^}]*)}/gi,"").match(/(?:[#.\w\s:,>\-_*"=\[\]]+)/gi);
				var classAttr=parentElement.match(/[^}{*\/]+:[^}{]*[^*\/]*?;?/gi,"");
				var classAttrSize=0;

				if (classAttr[0].length>0)
				{
					var attrContainerLength=reader.attrIns.container.length;

					$.each(classAttr[0].split(";"),function(i,attrString){
						if (attrString.length>0)
						{
							var splittedAttrString=attrString.split(":");
							var splittedKey=cssReader.getTrimStr(splittedAttrString[0]);
							var splittedValue=cssReader.getTrimStr(splittedAttrString[1]);
							
							if (splittedKey.length>0 && splittedValue.length>0)
								reader.attrIns.add(attrContainerLength,splittedKey,splittedValue);
						}
						classAttrSize++;
					});
					
					if (classAttrSize>0)
					{
						$.each(classNames,function(i,classParentString) {
							var classArray=classParentString.indexOf(",")!=-1 ? classParentString.split(",") : [classParentString];

							$.each(classArray,function(i,classString){
								try
								{
									if (classString.length>0)
									{
										var trimmedClassString=cssReader.getTrimStr(classString);
										var fullClassString=cssReader.getClassPath($(trimmedClassString));

										if (typeof fullClassString == "string")
										{
											reader.classIns.add(trimmedClassString,cssReader.getClassHash(fullClassString),fullClassString,attrContainerLength,reader.refIns);
										}
										else if (fullClassString === false)
										{
											reader.classIns.add(trimmedClassString,cssReader.getClassHash(trimmedClassString),false,attrContainerLength,reader.refIns);
										}
										else
										{
											$.each(fullClassString,function(i,c){
												reader.classIns.add(trimmedClassString,cssReader.getClassHash(c),c,attrContainerLength,reader.refIns);
											});
										}
									}
								}
								catch(e){}
							});
						});
					}
				}
			});
		}
	};
	
	this.readFilter=function(filterArray)
	{
		var filterString=typeof filterArray != "string" ? filterString=filterArray.join("|") : filterString=filterArray;
		
		var filterReg=new RegExp("("+filterString+"):[^}{]*[^*\\/]*?;","gi");
		var filteredCss=[];
		$.each(reader.d.fetchedCss,function(i,parentElement) {
			if (parentElement.match(filterReg))
				filteredCss.push(parentElement);
		});
		
		return reader.read(filteredCss);
	};
	
	this.search=function(callback,searchStr)
	{
		for (classIndex in reader.classIns.container)
		{
			var compiledClass=reader.compiledIns.get(classIndex,reader.classIns,reader.attrIns);

			if (searchStr ? searchStr in compiledClass : true)
				callback.call(reader,compiledClass);
			else if (attrInstance.debugPrefixString+searchStr in compiledClass)
				callback.call(reader,compiledClass);
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

	return hash.toString();
};
cssReader.getClassPath=function (element)
{
	var currentElement=$(element);
	if (!currentElement[0]) return false;

	var allClassPath=[];
	currentElement.each(function(){
		var classPath="";
		var self=$(this);

		self.parents("*").each(function(){
			var parents=$(this);
			var classString=(className=parents.attr("class")) ? "."+className.replace(/\s/gi,".") : "";
			var idString=(idName=parents.attr("id")) ? "#"+idName.replace(/\s/gi,"#") : "";
		
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
	var rating=0;
	var singleSelector=className.split(" ");

	for (parentParts in singleSelector)
	{	
		if (/[#.][\w:\-_"=\[\]]+/.test(singleSelector[parentParts]))
		{	
			try 
			{
				rating+=(id=singleSelector[parentParts].match(/#[\w:\-_"=\[\]]+/gi)) ? id.length*100 : 0;
				rating+=(cl=singleSelector[parentParts].match(/\.[\w:\-_"=\[\]]+/gi)) ? cl.length*10 : 0;
				rating+=(tg=singleSelector[parentParts].match(/\w+[#.]/gi)) ? tg.length*1 : 0;
			}
			catch(e)
			{
				rating+=(id=singleSelector[parentParts].toString().match(/#[\w:\-_"=\[\]]+/gi)) ? id.length*100 : 0;
				rating+=(cl=singleSelector[parentParts].toString().match(/\.[\w:\-_"=\[\]]+/gi)) ? cl.length*10 : 0;
				rating+=(tg=singleSelector[parentParts].toString().match(/\w+[#.]/gi)) ? tg.length*1 : 0;
			}
		}
		else if(/[^>]+/.test(singleSelector[parentParts]))
			rating++;
	}
	
	return rating;
};
cssReader.isAttrImportant=function (value)
{
	return /!important$/.test(value);
};