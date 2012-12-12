cssReader (jQuery Plugin)
================
Author: ayecue
Version: 2.5f
Language: Javascript
Framework: jQuery


Short Description:
================
With this plugin you can read CSS files. It will also read the parts in the CSS file which your normal browser won't read.


Advanced Description:
================
The Internet Explorer won't read CSS properties like for example "text-shadow". This script will read it
even when you are using the Internet Explorer. Just imagine the case that you got CSS3 properties in your stylesheet.
And you want to fix them but automated and not manual. So this plugin will be very helpful.

You can also create your own properties, the script will read them. As long as they are valid. Here an example:

Code:
================
	.my_css_class
	{
	  width: 100%;
	  margin: 0;
	  my-own-propery: hey there; //Your own property.
	}
================

The "cssReader" will also recognize the priority of your property. The priority depend on position and selectors used 
at the class where the property is in.

Code:
================
	.my_css_class
	{
	  width: 100%;
	}
	div.my_css_class
	{
	  width: 50%; //This property will have a higher priority.
	}
================

There are much more posibilities but that's for now.


API:
================
	@cssReader (class methods)
	================
	@setUrl
		-> description:
			Set the path of the CSS file.
		-> parameter:
			string : Target path of the CSS file.
		-> returns:
			null
	
	@setCss
		-> description:
			Set the CSS content here and compress it.
		-> parameter:
			string : CSS content
		-> returns:
			null
			
	@fetchCss
		-> description:
			Convert CSS content to an array where every class is one part.
		-> parameter:
			none
		-> returns:
			null
			
	@fetchCssFilter
		-> description:
			Convert CSS content with a filter to an array where every class is one part.
		-> parameter:
			string|array : Filter.
		-> returns:
			null
			
	@get
		-> description:
			Send AJAX request to get your file. When it's done the CSS will get fetched automaticly. You can add a filter.
		-> parameter:
			string|array : Filter.
		-> returns:
			null
			
	@read
		-> description:
			Read fetched CSS array. You can add your own fetched CSS array.
		-> parameter:
			array : Fetched CSS array.
		-> returns:
			true
			
	@readFilter
		-> description:
			Read fetched CSS array with a filter.
		-> parameter:
			string|array : Filter.
		-> returns:
			true
			
	@search
		-> description:
			Will search for a property.
		-> parameter:
			function : Callback.
			string : Search string.
		-> returns:
			null
	
	@scrape
		-> description:
			Will get and read a CSS file automaticly.
		-> parameter:
			function : Callback.
		-> returns:
			null
			
	@scrapeFilter
		-> description:
			Will get and read a CSS file automaticly with filter.
		-> parameter:
			function : Callback.
			string|array : Filter.
			boolean : Should get use the filter?
			boolean : Should read use the filter?
		-> returns:
			null			
			
	@cssReader (static methods)
	================
	@getTrimStr
		-> description:
			Trim string.
		-> parameter:
			string : String to be trimmed.
		-> returns:
			string: Trimmed String
			
	@getCompressedCss
		-> description:
			Compress CSS content.
		-> parameter:
			string : CSS content.
		-> returns:
			string: Compressed CSS content.
			
	@getClassHash
		-> description:
			Get hash of string.
		-> parameter:
			string : String.
		-> returns:
			string: Hash.
			
	@getClassPath
		-> description:
			Get the full path of a jQuery element.
		-> parameter:
			object : jQuery element.
		-> returns:
			string: Full path.
			
	@getClassPriority
		-> description:
			Rate the priority of a class.
		-> parameter:
			string : Class selector string.
		-> returns:
			integer: Priority.
			
	@isAttrImportant
		-> description:
			Check if a property is important.
		-> parameter:
			string : Property value.
		-> returns:
			boolean: Is important.
			
	@cssReader (featuring classes)
	================
	@classInstance
		-> Stack of all pointing classes of an element.
	@refInstance
		-> Stack of references for faster searching.
	@attrInstance
		-> Stack of all class attributes.
	@compiledInstance
		-> Stack of compiled classes resulting of the @classInstance stack and the @attrInstance stack.
		
	
First Steps:
================
Now i'll describe what's done in the "test1.html". This little test shows how the "cssReader" reads CSS, compiling everything and declaring elements.

Code:
================
	//Create a new "cssReader".
	var newReader=new cssReader();
				
	//Here we set the CSS content from the style element in the head.
	newReader.setCss($("head style").html());
	//Now Im converting the whole CSS content to an array.
	newReader.fetchCss();
	//After converting I read the whole array without a filter.
	newReader.read();
	
	//After everything is setup I can start a search. This search I do without any search string.
	//That's because I want to get everything.
	var result=newReader.search(function(c){
		//In the callback I get all compiled classes.
		for (property in c)
		{
			//The property is always the key of every object inside a compiled stack.
			//With the object property ".attrPath" I get the current element and
			//with the property ".attrValue" I get the value of the current property.
			//So this call do nothing else than giving every element their class values.
			$(c[property].attrPath).css(property,c[property].attrValue);
		}
	});
================

I'll add some more examples in the future.