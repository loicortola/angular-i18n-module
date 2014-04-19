# Angular i18n module
=================================================


A simple to use and effective AngularJS library to translate your app

This repo is for distribution on `bower`. 
Please file issues and pull requests against that repo.

# Install
---------------------

Install with `bower`:

```shell
bower install angular-i18n-module
```

Add a `<script>` to your `index.html`:

```html
<script src="/bower_components/angular-i18n-module/angular-i18n-module.js"></script>
```

And add `i18n` as a dependency for your app:

```javascript
angular.module('myApp', ['i18n']);
```

# Documentation
---------------------

## Features
* Translate keywords with any number of parameters
* Handle plural/singular values
* Handle conditional messages
* Handle multi parameter messages
* Handle messages with html content
* Only load the current language  
* Language switch based on URL parameters

## Usage

### Sample JSON

Consider the following json files

**resources\_locale\_en\_US.json**  
```json
{
  "label.hello.world": "Hello world!",
  "label.users.connected": {
    "one": "You currently have one (that means only {}) user connected",
    "zero": "You have no users connected",
    "default": "You have {} users connected"
  },
  "message.story.beginning": "This is the story of {firstCharacter} who called his friend {secondCharacter} to tell him if he could give {thirdCharacter} a ride to the airport. Problem is, {secondCharacter}'s phone was on voicemail, and {firstCharacter} did not have a car.",
  "message.story.end": "So {1} told {3} that he would have to drive there by himself, and apologized on behalf of {2}",
  "message.feedback": {
    "true": "We are glad you liked the story",
    "false": "So sorry to hear you did not like the story!"
  },
  "message.with.html": "It is <b>SUPER</b> important not to have this \"forgotten\" or <i>underestimated</i>"
}
```

**resources\_locale\_fr.json**  
```json
{
  "label.hello.world": "Salut le monde!",
  "label.users.connected": {
    "one": "Vous n'avez actuellement qu'un utilisateur connecté (et {} seul)",
    "zero": "Personne n'est connecté",
    "default": "Vous avez {} utilisateurs connectés"
  },
  "message.story.beginning": "C'est l'histoire de {firstCharacter} qui appelle son ami {secondCharacter} pour lui demander s'il peut emmener {thirdCharacter} à l'aéroport. Le problème, c'est que le téléphone de {secondCharacter} est sur messagerie, et que {firstCharacter} n'a pa de voiture.",
  "message.story.end": "Finalement {1} a du dire à {3} qu'il devrait y aller par ses propres moyens, et s'excusa de la part de {2}",
  "message.feedback": {
    "true": "Content que vous ayiez aimé l'histoire",
    "false": "Dommage que vous n'ayiez pas aimé l'histoire!"
  }
}
```

### Use in html views

**1. With angular {{ }} statements**  

***Basic call***  
```
{{'label.hello.world' | i18n}}
```    
==>  Hello world!  

***Count call***  
```  
{{'label.users.connected' | i18n:1}}
```  
==>  You currently have one (that means only 1) user connected   
```
{{'label.users.connected' | i18n:12}}
```  
==>  You have 12 users connected   
```
{{'label.users.connected' | i18n:0}}
```  
==>  You have no users connected  

***Named parameter call***  
```
{{'message.story.beginning' | i18n:{'firstCharacter':'John', 'secondCharacter':'Paul', 'thirdCharacter':'Matthew'} }}
```  
==>  This is the story of John who called his friend Paul to tell him if he could give Matthew a ride to the airport. Problem is, Paul's phone was on voicemail, and John did not have a car.   

***Generic parameter call***  
```
{{ 'message.story.end' | i18n:'John':'Paul':'Matthew' }}
```  
==>  So John told Matthew that he would have to drive there by himself, and apologized on behalf of Paul   

***Conditional call***  
```
{{'message.feedback' | i18n:true }}
```  
==>  We are glad you liked the story   
```
{{'message.feedback' | i18n:false }}
```  
==>  So sorry to hear you did not like the story!  

***Call to non existing entry returns the key***  
```
{{'this.doesnt.exist' | i18n }}
```  
==>  this.doesnt.exist  

***WARNING: HTML tags cannot be processed! See below to solve your problem***  
```
{{'message.with.html' | i18n }}
```  
==>  It is <b>SUPER</b> important not to have this "forgotten" or <i>underestimated</i>  


**2. With ng-bind-html directive (for resources with HTML content)**  
```html
<span ng-bind-html="'message.with.html' | i18n"></span>
```    
==>  It is __SUPER__ important not to have this "forgotten" or _underestimated_   

### Use in js files

**NB:** *First, you need to inject the i18nService into your angular controller, or service, or filter etc...
Then a simple call to __getString()__ will give you what you need*

```javascript
var myStoryBeginning = i18nService.getString(
    'message.story.beginning',
    {
        'firstCharacter':'John', 
        'secondCharacter':'Paul', 
        'thirdCharacter':'Matthew'
    });
var myStoryEnd = i18nService.getString('message.story.end','John','Paul','Matthew');
var outputMessage = i18nService.getString('message.feedback',true);
```


# License
---------------------

   Copyright 2014 Loïc Ortola

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
