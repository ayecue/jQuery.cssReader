/*
 * Plugin: cssReader
 * Version: 2.2a
 *
 * Beschreibung:
 * - Reading a CSS File.
 */
var cssReader = function (options){
	/*
		- Parameter
		
		@targetUrl (string)
			-> Example: "my_target_css_file"
			
		- Methods
		
			Internal:
			-> setUrl
				- Set targetUrl.
			-> setCss
				- Set plainCss.
			-> grepCss
				- Convert plainCss to an array
			-> grepCssWithFilter
				- Convert plainCSS to an array with a filter
			-> freeClassRef
				- Clearing the whole class ref stack.
			-> addClassRef
				- Create a ref of a class.
			-> getClassRef
				- Get the ref of a class.
			-> freeClass
				- Clearing the whole class stack.
			-> addClass
				- Add a class to the class stack.
			-> getCompleteClass
				- Get all CSS classes which point on your element.
			-> getCompleteClassRef
				- Get all CSS classes which point on your element via ref.
			-> getFirstClass
				- Get the first CSS class which point on your element.
			-> getFirstClassRef
				- Get the first CSS class which point on your element via ref.
			-> freeCompiledClass
				- Clearing the whole compiled class stack.
			-> getCompiledClass
				- Get a compiled CSS class for your element where everything get compared like prios etc.
			-> getCompiledClass
				- Get a compiled CSS class for your element where everything get compared like prios etc via ref.
			-> get
				- Get a CSS file with Ajax.
			-> getWithFilter
				- Get a CSS file with Ajax and filter it.
			-> read
				- Read the CSS file.
			-> readWithFilter
				- Read the CSS file with a property filter.
			-> searchFirst
				- Search for a special property and get the first class which got the property.
			-> searchWithCallback
				- Search for a special property and get all classes which got the property (with callback).
			-> searchInactiveArray
				- Search for a special property and get all classes which got the property and which are inactive.
			-> searchActiveArray
				- Search for a special property and get all classes which got the property and which are active.
			-> searchArray
				- Search for a special property and get all classes which got the property.
			-> scrape
				- Execute the .get and .read method.
			-> scrapeWithGetFilter
				- Execute the .getWithFilter and .read method.
			-> scrapeWithReadFilter
				- Execute the .get and .readWithFilter method.
			
			Static:
			-> getTrimStr
				- Trim String
			-> getCompressedCss
				- Compress the whole CSS File
			-> getClassHash
				- Create a hash of a class
			-> getClassPath
				- Get the full path of an element
			-> getClassPriority
				- Get the prio of a class
			-> isAttrImportant
				- Check if a class property is important
	*/
	var reader = this;
	var generic = {
		targetUrl:"",
		plainCss:"",
		fetchedCss:"",
		classContainer:[],
		classRefContainer:[],
		classLastCompiled:[],
		attrContainer:[]
	};
	
	var settings=$.extend(generic,options);
	
	this.setUrl=function (url)
	{
		settings.targetUrl=url;
	};
	
	this.setCss=function (css)
	{
		settings.plainCss=cssReader.getCompressedCss(css);
	};
	
	this.grepCss=function ()
	{
		settings.fetchedCss=settings.plainCss.match(/([#.\w\s:,>\-_*"=\[\]]+){(?:[^}]*)}/gi);
	};
	
	this.grepCssWithFilter=function(filterArray)
	{
		var filterString="";
	
		if (typeof filterArray !== "string")
		{
			var lastKey=filterArray.length-1;
			$.each(filterArray,function(key,value) {
				filterString+=lastKey!=key ? value+"|" : value;
			});
		}
		else
			filterString+=filterArray;
		
		var regexString=new RegExp("([#.\\w\\s:,>\\-_*\"=\\[\\]]+){(?:[^}]*(?:"+filterString+")+[^}]*)}","gi");
		settings.fetchedCss=settings.plainCss.match(regexString);
	};
	
	this.freeClassRef=function()
	{
		try
		{
			if (settings.classRefContainer.length>0)
			{
				delete settings.classRefContainer;
				settings.classRefContainer=[];
			}
		} catch(e){}
	};
	
	this.addClassRef=function(classString,classHash)
	{
		if (!(classString in settings.classRefContainer))
			settings.classRefContainer[classString]=[];
			
		settings.classRefContainer[classString].push(classHash);
	};
	
	this.getClassRef=function(classString)
	{
		return (classString in settings.classRefContainer) ? settings.classRefContainer[classString] : false;
	};
	
	this.freeClass=function()
	{
		try
		{
			if (settings.classContainer.length>0)
			{
				delete settings.classContainer;
				settings.classContainer=[];
			}
		} catch(e){}
	};
	
	this.addClass=function(classString,classHash,classPath,attrIndex)
	{
		if (!(classHash in settings.classContainer))
		{
			settings.classContainer[classHash]=[{
				lastPriority: cssReader.getClassPriority(classString,0),
				classString: classString,
				classPath: classPath,
				attrIndex: typeof attrIndex == "number" ? attrIndex : false
			}];
		}
		else
		{
			settings.classContainer[classHash].push({
				lastPriority: cssReader.getClassPriority(classString,settings.classContainer[classHash].length),
				classString: classString,
				classPath: classPath,
				attrIndex: typeof attrIndex == "number" ? attrIndex : false
			});
		}
		
		reader.addClassRef(classString,classHash);
	};
	
	this.getCompleteClass=function(classHash)
	{
		return (classHash in settings.classContainer) ? settings.classContainer[classHash] : false;
	};
	
	this.getCompleteClassRef=function(classString)
	{
		var refContainer=reader.getClassRef(classString);
		var completeClassContainer=[];
		
		$.each(refContainer,function(i,value){
			firstClassContainer.push(reader.getCompleteClass(value));
		});
	
		return completeClassContainer;
	};
	
	this.getFirstClass=function(classHash)
	{
		var firstClass=reader.getCompleteClass(classHash);
	
		return (0 in firstClass) ? firstClass[0] : false;
	};
	
	this.getFirstClassRef=function(classString)
	{
		var refContainer=reader.getClassRef(classString);
		var firstClassContainer=[];
		
		$.each(refContainer,function(i,value){
			firstClassContainer.push(reader.getFirstClass(value));
		});
	
		return firstClassContainer;
	};
	
	this.freeCompiledClass=function()
	{
		try
		{
			if (settings.classLastCompiled.length>0)
			{
				delete settings.classLastCompiled;
				settings.classLastCompiled=[];
			}
		} catch(e){}
	};
	
	this.getCompiledClass=function(classHash)
	{
		if (!(classHash in settings.classContainer)) return false;
			
		if (!(classHash in settings.classLastCompiled))
		{
			settings.classLastCompiled[classHash]=[];

			$.each(settings.classContainer[classHash],function(i,c){
				var classAttr=settings.attrContainer[c.attrIndex];

				for (attrKey in classAttr)
				{
					var attrImportant=cssReader.isAttrImportant(classAttr[attrKey]);

					if (!(attrKey in settings.classLastCompiled[classHash]))
					{
						settings.classLastCompiled[classHash][attrKey]={
							attrPrio:c.lastPriority,
							attrValue:classAttr[attrKey],
							attrPath:c.classPath,
							attrClass:c.classString,
							attrImportant:attrImportant
						};
					}
					else if (settings.classLastCompiled[classHash][attrKey].attrImportant<attrImportant || 
							(settings.classLastCompiled[classHash][attrKey].attrPrio<=c.lastPriority
							&& settings.classLastCompiled[classHash][attrKey].attrImportant==attrImportant))
					{
						settings.classLastCompiled[classHash][attrKey]={
							attrPrio:c.lastPriority,
							attrValue:classAttr[attrKey],
							attrPath:c.classPath,
							attrClass:c.classString,
							attrImportant:attrImportant
						};
					}
				}
			});
			
			return settings.classLastCompiled[classHash];
		}
		else
			return settings.classLastCompiled[classHash];
	};
	
	this.getCompiledClassRef=function(classString)
	{
		var refContainer=reader.getClassRef(classString);
		var compiledClassContainer=[];
		
		$.each(refContainer,function(i,value){
			compiledClassContainer.push(reader.getCompiledClass(value));
		});
	
		return compiledClassContainer;
	};
	
	this.get=function ()
	{
		if (settings.targetUrl)
		{
			return $.ajax({
						url: settings.targetUrl,
						success: function (css) { 
							reader.setCss(css);
							reader.grepCss();
						}
			});
		}
	}; 
	
	this.getWithFilter=function (filter)
	{
		if (settings.targetUrl)
		{
			return $.ajax({
						url: settings.targetUrl,
						success: function (css) { 
							reader.setCss(css);
							reader.grepCssWithFilter(filter);
						}
			});
		}
	}; 
	
	this.read=function (cssString)
	{
		var currentCssString=cssString ? cssString : settings.fetchedCss;
	
		if (currentCssString.length>0)
		{
			return $.each(currentCssString,function(i,parentElement) {
				var classNames=parentElement.replace(/{([^}]*)}/gi,"").match(/(?:[#.\w\s:,>\-_*"=\[\]]+)/gi);
				var classAttr=parentElement.match(/[^}{*\/]+:[^}{]*[^*\/]*?;?/gi,"");
				var classAttrSize=0;

				if (classAttr[0].length>0)
				{
					var attrContainerLength=settings.attrContainer.length;
					settings.attrContainer[attrContainerLength]=[];

					$.each(classAttr[0].split(";"),function(i,attrString){
						try
						{
							if (attrString.length>0)
							{
								var splittedAttrString=attrString.split(":");
								var splittedKey=cssReader.getTrimStr(splittedAttrString[0]);
								var splittedValue=cssReader.getTrimStr(splittedAttrString[1]);
								
								if (splittedKey.length>0 && splittedValue.length>0)
									settings.attrContainer[attrContainerLength][splittedKey]=splittedValue;
							}
						} catch(e) {};
						classAttrSize++;
					});
					
					if (classAttrSize>0)
					{
						$.each(classNames,function(i,classParentString) {
							if (/,/.test(classParentString))
								var classArray=classParentString.split(",");
							else
								var classArray=[classParentString];
								
							$.each(classArray,function(i,classString){
								try
								{
									if (classString.length>0)
									{
										var trimmedClassString=cssReader.getTrimStr(classString);
										var fullClassString=cssReader.getClassPath($(trimmedClassString));

										if (typeof fullClassString === "string")
										{
											var classHash=cssReader.getClassHash(fullClassString);
											
											try
											{
												reader.addClass(trimmedClassString,classHash,fullClassString,attrContainerLength);
											}
											catch(e)
											{
												reader.addClass(trimmedClassString,classHash.toString(),fullClassString,attrContainerLength);
											}
										}
										else if (fullClassString === false)
										{
											var classHash=cssReader.getClassHash(trimmedClassString);
										
											try
											{
												reader.addClass(trimmedClassString,classHash,false,attrContainerLength);
											}
											catch(e)
											{
												reader.addClass(trimmedClassString,classHash,false,attrContainerLength);
											}
										}
										else
										{
											$.each(fullClassString,function(i,c){
												var classHash=cssReader.getClassHash(c);
											
												try
												{
													reader.addClass(trimmedClassString,classHash,c,attrContainerLength);
												}
												catch(e)
												{
													reader.addClass(trimmedClassString,classHash.toString(),c,attrContainerLength);
												}
											});
										}
									}
								} catch(e) {}
							});
						});
					}
				}
			});
		}
	};
	
	this.readWithFilter=function(filterArray)
	{
		var filterString="";
	
		if (typeof filterArray !== "string")
		{
			var lastKey=filterArray.length-1;
			$.each(filterArray,function(key,value) {
				filterString+=lastKey!=key ? value+"|" : value;
			});
		}
		else
			filterString+=filterArray;
		
		var filterReg=new RegExp("("+filterString+"):[^}{]*[^*\\/]*?;","gi");
		var filteredCss=[];
		$.each(settings.fetchedCss,function(i,parentElement) {
			if (parentElement.match(filterReg))
				filteredCss.push(parentElement);
		});
		
		return reader.read(filteredCss);
	}
	
	this.searchFirst=function(searchStr)
	{
		for (classContainerIndex in settings.classContainer)
		{
			try
			{
				var compiledClass=reader.getCompiledClass(classContainerIndex);
				
				if (searchStr in compiledClass)
					return [compiledClass[searchStr].attrClass,compiledClass[searchStr].attrValue];
			} catch(e){};
		}
	};
	
	this.searchWithCallback=function(searchStr,callback)
	{
		for (classContainerIndex in settings.classContainer)
		{
			try
			{
				var compiledClass=reader.getCompiledClass(classContainerIndex);

				if (searchStr in compiledClass)
					callback.call(reader,compiledClass[searchStr]);
			} 
			catch(e){};
		}
	};
	
	this.searchInactiveArray=function(searchStr)
	{
		var searchArray=[];
		var searchIndex=0;
		
		reader.searchWithCallback(searchStr,function(compiledClass){
			if (compiledClass.attrPath===false)
			{
				searchArray[compiledClass.attrClass]=compiledClass.attrValue;
				searchIndex++;
			}
		});
		
		return searchIndex>0 ? searchArray : false;
	};
	
	this.searchActiveArray=function(searchStr)
	{
		var searchArray=[];
		var searchIndex=0;
		
		reader.searchWithCallback(searchStr,function(compiledClass){
			if (compiledClass.attrPath!==false)
			{
				searchArray[compiledClass.attrClass]=compiledClass.attrValue;
				searchIndex++;
			}
		});
		
		return searchIndex>0 ? searchArray : false;
	};
	
	this.searchArray=function(searchStr)
	{
		var searchArray=[];
		var searchIndex=0;
		
		reader.searchWithCallback(searchStr,function(compiledClass){
			searchArray[compiledClass.attrClass]=compiledClass.attrValue;
			searchIndex++;
		});
		
		return searchIndex>0 ? searchArray : false;
	};
	
	this.scrape=function(callback)
	{
		$.when(reader.get()).done(function(){
			$.when(reader.read()).done(function(){
				if (callback) callback.call(reader,settings);
			});
		});
	};
	
	this.scrapeWithGetFilter=function(callback,filterArray)
	{
		$.when(reader.getWithFilter(filterArray)).done(function(){
			$.when(reader.read()).done(function(){
				if (callback) callback.call(reader,settings);
			});
		});
	};
	
	this.scrapeWithReadFilter=function(callback,filterArray)
	{
		$.when(reader.get()).done(function(){
			$.when(reader.readWithFilter(filterArray)).done(function(){
				if (callback) callback.call(reader,settings);
			});
		});
	};
	
	reader.setUrl(settings.targetUrl);
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

	return hash;
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
cssReader.getClassPriority=function (className,position)
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
	
	return rating+(position ? position : 0);
};
cssReader.isAttrImportant=function (value)
{
	return /!important$/.test(value);
};