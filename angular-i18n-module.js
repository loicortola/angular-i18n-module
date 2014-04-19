/*
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
 */

var i18nFilter = function (i18nService) {

  return function () {
    return i18nService.getString(arguments);
  }

}

var i18nService = function ($cookieStore, $http, $window, $sce) {

  /*
   Internationalization i18n container
   language: Retrieve the previously stored language. If none, retrieve language of navigator
   locales:  Declare all locale resource file URI-path, including mandatory "default" entry
   Example:
   locales: {
   'default': '../i18n/resources-locale_en_US.json',
   'en': '../i18n/resources-locale_fr.json'
   }
   */
  var i18n = {
    language: $cookieStore.get('locale') || $window.navigator.userLanguage || $window.navigator.language,
    dictionary: [],
    loaded: false,
    locales: {
    }
  };

  // Resource loading method
  this.loadResources = function (url) {
    $http.get(url)
      .success(function (data) {

        i18n.dictionary = data;
        i18n.loaded = true;
        console.debug('i18n: locale successfully loaded');

      })
      .error(function () {
        console.error('i18n: Cannot load locale');
      });
  }

  // Language selection method
  this.selectLanguage = function (language) {

    i18n.language = language;
    console.info("i18n: Selected language:", i18n.language);

    // Load selected locale or default if none
    // example:
    // browser language: en_US
    // match "en_US" in locales? no
    // > match "en" in locales? yes
    // (otherwise, default locale will be returned)
    var url = i18n.locales['default'];

    if (i18n.language in i18n.locales) {
      url = i18n.locales[i18n.language];
    }
    else {
      if (i18n.language.substr(0, 2) in i18n.locales) {
        url = i18n.locales[i18n.language.substr(0, 2)];
      }
      else {
        console.log("i18n: Did not find a matching locale resource. Falling back to default");
      }
    }

    // Save language selection to client's cookie
    $cookieStore.put('locale', i18n.language);

    this.loadResources(url);
  }

  // Replace function for parametered localized strings
  this.replaceArgs = function (val, isConditional, args) {
    var multiParams = false;
    // If we have a plural/conditional string definition, we need to handle the {n} replacement
    if (args.length > 1)
      if (isConditional) {
        val = val.replace('{}', args[1]);
        if (args.length > 2)
          multiParams = true;
      }
      else if (args.length > 1)
        multiParams = true;

    // Parameters browse for either generic or named parameters
    for (var i = isConditional ? 2 : 1; i < args.length; i++) {
      // For named parameters
      if (args[i] instanceof Object)
        for (var p in args[i])
          val = val.replace(new RegExp('\\{' + p + '\\}', 'g'), args[i][p]);
      // For generic parameters, either multi params or not
      else if (multiParams) {
        var toReplace = '\\{' + (isConditional ? (i - 1) : i) + '\\}';
        val = val.replace(new RegExp(toReplace, 'g'), args[i]);
      }
      else
        val = val.replace(new RegExp('\\{\\}', 'g'), args[i]);
    }
    return val;
  };

  // Computed local string retrieval method
  this.getString = function (args) {
    var input = args[0];
    if (i18n.loaded && input in i18n.dictionary) {
      var val = i18n.dictionary[input];
      // For plural/conditional separated entries
      if (val instanceof Object) {
        if (val.hasOwnProperty('zero') && args[1] == 0)
          val = val['zero'];
        else if (val.hasOwnProperty('one') && args[1] == 1)
          val = val['one'];
        else if (val.hasOwnProperty('true') && args[1])
          val = val['true'];
        else if (val.hasOwnProperty('false') && !args[1])
          val = val['false'];
        else if (val.hasOwnProperty('default'))
          val = val['default'];
        else
          console.error("i18n: You need to provide at least a 'default' entry in your lang resources for the conditional property " + input);
        return this.replaceArgs(val, true, args);
      }
      // String replace if arguments supplied
      return $sce.trustAsHtml(this.replaceArgs(val, false, args));
    }
    else {
      return input;
    }
  };

  //SetLocales to init the library
  this.setLocales = function(locales) {
    i18n.locales = locales;
  }

  // Init service if resources have already been loaded
  if(i18n.locales && i18n.locales.length > 0)
    this.selectLanguage(i18n.language);

};

/** Module declaration */
var i18nModule = angular.module('i18n', ['ngCookies', 'ngSanitize']);

/** Filter declaration */
i18nModule.filter('i18n', ['i18nService', i18nFilter]);

/** Service declaration */
i18nModule.service('i18nService', ['$cookieStore', '$http', '$window', '$sce', i18nService]);