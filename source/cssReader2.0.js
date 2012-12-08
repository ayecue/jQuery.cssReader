/*
 * Plugin: cssReader
 * Version: 2.0
 *
 * Beschreibung:
 * - Liest und interpretiert ein gesamtes CSS File
 */
var cssReader = function (options){
	/*
		- Parameter
		
		@targetUrl (string)
			-> Example: "my_target_css_file"
			
		- Methods
		
			Internal:
			-> setUrl
				@param : string
				- Setzt targetUrl.
			-> freeCompiledClass
				- Löscht den gesamten Klassen Referenzen stack.
			-> addClassRef
				- Erstellt Referenz zu einer CSS Klasse.
			-> getClassRef
				- Kriegt die CSS Klasse die referenziert wird.
			-> freeCompiledClass
				- Löscht den gesamten Klassen stack.
			-> addClass
				- Fügt eine CSS Klasse hinzu.
			-> getCompleteClass
				- Gibt die unkompilierte CSS Klasse aus mit allen vergebenen Attributen aller CSS Klassen.
			-> getFirstClass
				- Gibt die unkompilierte CSS Klasse aus mit den vergebenen Attributen der ersten CSS Klasse.
			-> freeCompiledClass
				- Löscht den gesamten compilierten Klassen stack.
			-> getCompiledClass
				- Gibt die kompilierte CSS Klasse aus in welcher alle Attribute je nach Priorität zusammengefügt wurden.
			-> get
				- Holt sich die CSS Datei.
			-> read
				- Liest die CSS Datei komplett ungefiltert.
			-> readWithFilter
				- Liest die CSS Datei gefiltert.
			-> searchFirst
				- Sucht die erste Klasse welche zutreffend ist (Benutzt .getCompiledClass alternativen werden noch hinzugefügt).
			-> searchWithCallback
				- Sucht alle Klassen welche zutreffend sind mit Callback Funktion (Benutzt .getCompiledClass alternativen werden noch hinzugefügt).
			-> searchInactiveArray
				- Sucht alle inaktiven Klassen welche zutreffend sind ohne Callback Funktion (Benutzt .getCompiledClass alternativen werden noch hinzugefügt).
			-> searchActiveArray
				- Sucht alle aktiven Klassen welche zutreffend sind ohne Callback Funktion (Benutzt .getCompiledClass alternativen werden noch hinzugefügt).
			-> searchArray
				- Sucht alle Klassen welche zutreffend sind ohne Callback Funktion (Benutzt .getCompiledClass alternativen werden noch hinzugefügt).
			-> scrape
				- Führt .get und .read Methoden hintereinander aus.
			-> scrapeWithFilter
				- Führt .get und .readWithFilter Methoden hintereinander aus.
			
			Static:
			-> getTrimStr
				- Trim String
			-> getCompressedCss
				- Compress the whole CSS File
			-> getClassHash
				- Erstellt einen eindeutigen Hash von einer Klasse.
			-> getClassPath
				- Holt alle Elemente welche eine Klasse selektiert.
			-> getClassPriority
				- Generiert die Priorität einer Klasse.
			-> isAttrImportant
				- Überprüft ob ein Attribut auf "!important" gesetzt ist.
	*/
	var reader = this;
	var generic = {
		targetUrl:"",
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
	}
	
	this.getClassRef=function(classString)
	{
		return (classString in settings.classRefContainer) ? settings.classRefContainer[classString] : false;
	}
	
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
	
	this.getFirstClass=function(classHash)
	{
		var firstClass=reader.getCompleteClass(classHash);
	
		return ("0" in firstClass) ? firstClass[0] : false;
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
	}
	
	this.getCompiledClass=function(classHash)
	{
		if (!(classHash in settings.classContainer)) return false;
			
		if (!(classHash in settings.classLastCompiled))
		{
			settings.classLastCompiled[classHash]=[];

			$.each(settings.classContainer[classHash],function(key,value){
				var classAttr=settings.attrContainer[value.attrIndex];

				for (attrKey in classAttr)
				{
					var attrImportant=cssReader.isAttrImportant(classAttr[attrKey]);

					if (!(attrKey in settings.classLastCompiled[classHash]))
					{
						settings.classLastCompiled[classHash][attrKey]={
							attrPrio:value.lastPriority,
							attrValue:classAttr[attrKey],
							attrPath:value.classPath,
							attrClass:value.classString,
							attrImportant:attrImportant
						};
					}
					else if (settings.classLastCompiled[classHash][attrKey].attrImportant<attrImportant || 
							(settings.classLastCompiled[classHash][attrKey].attrPrio<=value.lastPriority
							&& settings.classLastCompiled[classHash][attrKey].attrImportant==attrImportant))
					{
						settings.classLastCompiled[classHash][attrKey]={
							attrPrio:value.lastPriority,
							attrValue:classAttr[attrKey],
							attrPath:value.classPath,
							attrClass:value.classString,
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
	
	this.get=function ()
	{
		if (settings.targetUrl)
		{
			return $.ajax({
						url: settings.targetUrl,
						success: function (css) { settings.fetchedCss=cssReader.getCompressedCss(css).match(/([#.\w\s:,>\-_*"=\[\]]+){(?:[^}]*)}/gi);}
			});
		}
	}; 
	
	this.read=function (cssString)
	{
		var currentCssString=cssString ? cssString : settings.fetchedCss;
	
		if (currentCssString.length>0)
		{
			return $.each(currentCssString,function(parentIndex,parentElement) {
				var classNames=parentElement.replace(/{([^}]*)}/gi,"").match(/(?:[#.\w\s:,>\-_*"=\[\]]+)/gi);
				var classAttr=parentElement.match(/[^}{*\/]+:[^}{]*[^*\/]*?;?/gi,"");
				var classAttrSize=0;

				if (classAttr[0].length>0)
				{
					settings.attrContainer[parentIndex]=[];
					$.each(classAttr[0].split(";"),function(attrIndex,attrString){
						try
						{
							if (attrString.length>0)
							{
								var splittedAttrString=attrString.split(":");
								var splittedKey=cssReader.getTrimStr(splittedAttrString[0]);
								var splittedValue=cssReader.getTrimStr(splittedAttrString[1]);
								
								if (splittedKey.length>0 && splittedValue.length>0)
									settings.attrContainer[parentIndex][splittedKey]=splittedValue;
							}
						} catch(e) {};
						classAttrSize++;
					});
					
					if (classAttrSize>0)
					{
						$.each(classNames,function(classParentIndex,classParentString) {
							if (/,/.test(classParentString))
								var classArray=classParentString.split(",");
							else
								var classArray=[classParentString];
								
							$.each(classArray,function(classIndex,classString){
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
												reader.addClass(trimmedClassString,classHash,fullClassString,parentIndex);
											}
											catch(e)
											{
												reader.addClass(trimmedClassString,classHash.toString(),fullClassString,parentIndex);
											}
										}
										else if (fullClassString === false)
										{
											var classHash=cssReader.getClassHash(trimmedClassString);
										
											try
											{
												reader.addClass(trimmedClassString,classHash,false,parentIndex);
											}
											catch(e)
											{
												reader.addClass(trimmedClassString,classHash,false,parentIndex);
											}
										}
										else
										{
											$.each(fullClassString,function(key,value){
												var classHash=cssReader.getClassHash(value);
											
												try
												{
													reader.addClass(trimmedClassString,classHash,value,parentIndex);
												}
												catch(e)
												{
													reader.addClass(trimmedClassString,classHash.toString(),value,parentIndex);
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
		var lastKey=filterArray.length-1;
		$.each(filterArray,function(key,value) {
			filterString+=lastKey!=key ? value+"|" : value;
		});
		
		var filterReg=new RegExp("("+filterString+"):[^}{]*[^*\/]*?;","gi");
		var filteredCss=[];
		$.each(settings.fetchedCss,function(parentIndex,parentElement) {
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
					callback.call(reader,classContainerIndex,compiledClass[searchStr].attrValue);
			} 
			catch(e){};
		}
	};
	
	this.searchInactiveArray=function(searchStr)
	{
		var searchArray=[];
		var searchIndex=0;
		
		reader.searchWithCallback(searchStr,function(key,value){
			var compiledClass=reader.getCompiledClass(key);

			if (compiledClass[searchStr].attrPath===false)
			{
				searchArray[compiledClass[searchStr].attrClass]=value;
				searchIndex++;
			}
		});
		
		return searchIndex>0 ? searchArray : false;
	};
	
	this.searchActiveArray=function(searchStr)
	{
		var searchArray=[];
		var searchIndex=0;
		
		reader.searchWithCallback(searchStr,function(key,value){
			var compiledClass=reader.getCompiledClass(key);

			if (compiledClass[searchStr].attrPath!==false)
			{
				searchArray[compiledClass[searchStr].attrClass]=value;
				searchIndex++;
			}
		});
		
		return searchIndex>0 ? searchArray : false;
	};
	
	this.searchArray=function(searchStr)
	{
		var searchArray=[];
		var searchIndex=0;
		
		reader.searchWithCallback(searchStr,function(key,value){
			var compiledClass=reader.getCompiledClass(key);

			searchArray[compiledClass[searchStr].attrClass]=value;
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
	
	this.scrapeWithFilter=function(callback,filterArray)
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