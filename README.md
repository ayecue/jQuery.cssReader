# cssReader (jQuery Plugin)
* Author: ayecue
* Version: 2.9
* Language: Javascript
* Framework: jQuery


### Content
* Short Description (<a href="#short-description">shortcut</a>)
* Advanced Description (<a href="#advanced-description">shortcut</a>)
* API (<a href="#api">shortcut</a>)
* First Steps (<a href="#first-steps">shortcut</a>)
* "2.6" vs "2.6 less" (deprecated) (<a href="#26-vs-26-less">shortcut</a>)
* <a href="http://jsperf.com/cssreaderversiontest/4">Performance Test via jsperf</a>


## Short Description:
### (<a href="#cssreader-jquery-plugin">up</a> | <a href="#advanced-description">next</a>)
With this plugin you can read CSS files. It will also read the parts in the CSS file which your normal browser won't read.


## Advanced Description:
### (<a href="#cssreader-jquery-plugin">up</a> | <a href="#short-description">previous</a> | <a href="#api">next</a>)
The Internet Explorer won't read CSS properties like for example "text-shadow". This script will read it
even when you are using the Internet Explorer. Just imagine the case that you got CSS3 properties in your stylesheet.
And you want to fix them but automated and not manual. So this plugin will be very helpful.

You can also create your own properties, the script will read them. As long as they are valid. Here an example:

### Code:
	.my_css_class
	{
	  width: 100%;
	  margin: 0;
	  my-own-propery: hey there; //Your own property.
	}

The "cssReader" will also recognize the priority of your property. The priority depend on position and selectors used 
at the class where the property is in.

### Code:
	.my_css_class
	{
	  width: 100%;
	}
	div.my_css_class
	{
	  width: 50%; //This property will have a higher priority.
	}

There are much more posibilities but that's for now.


## API:
### (<a href="#cssreader-jquery-plugin">up</a> | <a href="#advanced-description">previous</a> | <a href="#first-steps">next</a>)
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
			
	@get
		-> description:
			Send AJAX request to get your file. When it's done the CSS will get fetched automaticly. You can add a filter.
		-> parameter:
			string|array : Filter (optional)
		-> returns:
			null
			
	@read
		-> description:
			Read fetched CSS array. You can add your own fetched CSS array.
		-> parameter:
			array : CSS File (optional)
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
			filter: Filter String (optional)
		-> returns:
			null	
			
			
	@cssReader (static)
	================
	@getIndex
		-> description:
			Get/Create an unique DOMIndex
		-> parameter:
			element: Your element.
		-> returns:
			integer	
	
	@nodeIndexOf
		-> description:
			Get the childNode index of an element
		-> parameter:
			element: Your element.
		-> returns:
			integer	
	
	@getSelectors
		-> description:
			Get all classes,ids and tags from an element and put them to a selector string
		-> parameter:
			element: Your element.
		-> returns:
			string
	
	@getPathEx
		-> description:
			Get the full path of a single element
		-> parameter:
			element: Your element.
		-> returns:
			array: path stack
	
	
	@cssReader (prototypes)
	================
	string@trimBoth
		-> description:
			Trim string.
		-> returns:
			string: Trimmed String
			
	string@compressCss
		-> description:
			Compress CSS content.
		-> returns:
			string: Compressed CSS content.
			
	string/array@getStringHash
		-> description:
			Get hash of string/array.
		-> returns:
			string: Hash.
			
	string@getPriority
		-> description:
			Rate the priority of a class.
		-> returns:
			integer: Priority.
			
	string/array@isImportant
		-> description:
			Check if a property is important.
		-> returns:
			boolean: Is important.
			
	jQueryObject@getPath
		-> description:
			Get the full path of an element.
		-> returns:
			array: Stack with all elements.
			
			
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
		
	
## First Steps:
### (<a href="#cssreader-jquery-plugin">up</a> | <a href="#api">previous</a> | <a href="#26-vs-26-less">next</a>)
Now i'll describe what's done in the "test1.html". This little test shows how the "cssReader" reads CSS, compiling everything and declaring elements.

### Code:
	//Create a new "cssReader".
	var newReader=new cssReader();
				
	//Here we set the CSS content from the style element in the head.
	newReader.setCss($("head style").html());
	//After compressing etc. we'll read the CSS content.
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

I'll add some more examples in the future.

## "2.6" vs "2.6 less" (deprecated):
### (<a href="#cssreader-jquery-plugin">up</a> | <a href="#first-steps">previous</a>)
There are small differences:
- "2.6 less" need less cache
- "2.6 less" loops are abit more difficult
- "2.6" got an easier tree of variables

But I the end both do the same. Here some performance testing (Just scraped through the whole CSS File without filters):

### 2.6
- 4% slower than "2.6 less" with ~ 17 Ops/sec (Firefox)
- 3% slower than "2.6 less" with ~ 23.8 Ops/sec (Chrome)
- 3% slower than "2.6 less" with ~ 14.7 Ops/sec (Safari)
- 1% slower than "2.6 less" with ~ 16 Ops/sec (Opera)
- 1% slower than "2.6 less" with ~ 16.2 Ops/sec (IE9)
- 1% slower than "2.6 less" with ~ 8.2 Ops/sec (IE8)
- 0.31% slower than "2.6 less" with ~ 0.77 Ops/sec (IE7)

### 2.6 less
- 4% faster than "2.6" with ~ 17.5 Ops/sec (Firefox)
- 3% faster than "2.6" with ~ 24.1 Ops/sec (Chrome)
- 3% faster than "2.6" with ~ 15.5 Ops/sec (Safari)
- 1% faster than "2.6" with ~ 16.2 Ops/sec (Opera)
- 1% faster than "2.6" with ~ 16.5 Ops/sec (IE9)
- 1% faster than "2.6" with ~ 8.3 Ops/sec (IE8)
- 0.31% faster than "2.6" with ~ 0.78 Ops/sec (IE7)

### Testsnippet:

	var newReader=new cssReader();
	newReader.setCss(content);
	newReader.fetchCss();
	newReader.read();
	
	var result=newReader.search(function(c){});

The test CSS had 42082 (34195 without whitespaces) signs on 1975 lines. 

Comment: The version 2.3 of the cssReader is ~ 88% slower than "2.6 less".
