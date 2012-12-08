jQuery.cssReader
================
Author: ayecue

With this plugin you can read CSS files. It will also read the parts in the CSS file which your normal browser won't
read normally.

An example: 

The Internet Explorer won't read CSS properties like for example "text-shadow". This script will read it
even when you are using the Internet Explorer. This could be useful if you want to use automated work arounds via
Javascript for CSS3 in the Internet Explorer.


Another point is that this script will also read own created properties. For example:
.my_css_class
{
  width: 100%;
  margin: 0;
  my-own-propery: hey there;
}

You can even search this property and the script will find it.


This script will also recognize how high the priority of your class/id/tag is. For example:
.my_css_class
{
  width: 100%;
}
div.my_css_class
{
  width: 50%;
}

The second class will have a higher priority than the first.


The script also contain some very useful static functions like for example the CSS compress function and there are
much more features which I will explain when I got time. Also some examples will be added soon.