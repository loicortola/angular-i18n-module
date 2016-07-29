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

  var filter = function () {
    return i18nService.getString(arguments);
  };

  filter.$stateful = true;

  return filter;

};

/** Module declaration */
var i18nModule = angular.module('i18n', ['ngCookies', 'ngSanitize']);


var I18N = function ($cookieStore, $http, $q, $window, $sce, $rootScope, config) {

  this.config = config;

  this.$cookieStore = $cookieStore;
  this.$http = $http;
  this.$q = $q;
  this.$window = $window;
  this.$sce = $sce;
  this.$rootScope = $rootScope;


  /* Init i18n Attributes:
   * language: Retrieve the previously stored language. If none, retrieve language of navigator
   * locales: the locales provided within the config object (service provider)
   * dictionary: the current dictionary
   */
  this.i18n.language = $cookieStore.get('locale') || $window.navigator.userLanguage || $window.navigator.language;
  this.i18n.locales = config.locales;
  this.i18n.dictionary = [];
  this.selectLanguage(this.i18n.language);

};

// Prototype Data
I18N.prototype.i18n = {
    language: null,
    dictionary: this.dictionary,
    loaded: false,
    locales: null
  };

// Prototype Resource loading method
  I18N.prototype.loadResources = function (url) {
    var deferred = this.$q.defer();
    this.$http.get(url)
        .success((function (data) {
          this.i18n.dictionary = data;
          this.i18n.loaded = true;
          console.debug('i18n: locale successfully loaded');
          deferred.resolve();
        }).bind(this))
        .error((function () {
          console.error('i18n: Cannot load locale');
          deferred.reject();
        }).bind(this));
    return deferred.promise;
  };

  // Prototype Language selection method
  I18N.prototype.selectLanguage = function (language) {

    var self = this;

    this.i18n.language = language;

    console.debug("i18n: Selected language:", this.i18n.language);

    // Load selected locale or default if none
    // example:
    // browser language: en_US
    // match "en_US" in locales? no
    // > match "en" in locales? yes
    // (otherwise, default locale will be returned)
    var url = this.i18n.locales['default'];

    if (this.i18n.language in this.i18n.locales) {
      url = this.i18n.locales[this.i18n.language];
    }
    else {
      if (this.i18n.language.substr(0, 2) in this.i18n.locales) {
        url = this.i18n.locales[this.i18n.language.substr(0, 2)];
      }
      else {
        console.log("i18n: Did not find a matching locale resource. Falling back to default");
      }
    }

    // Save language selection to client's cookie
    this.$cookieStore.put('locale', this.i18n.language);

    var rootScope = this.$rootScope;

    return this.loadResources(url)
               .then(function () {
                  rootScope.$emit('i18nService.onLocaleLoaded', self.i18n.language);
               });
  };

  // Prototype Replace function for parametered localized strings
  I18N.prototype.replaceArgs = function (val, isConditional, args) {
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
  I18N.prototype.getString = function (args) {
    var input = args[0];
    if (!(args instanceof Object))
      input = args;

    if (this.i18n.loaded && input in this.i18n.dictionary) {
      var val = this.i18n.dictionary[input];
      // For plural/conditional separated entries
      if (val instanceof Object) {
        if (val.hasOwnProperty('zero') && (!args[1] || args[1] == 0))
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
      return this.$sce.trustAsHtml(this.replaceArgs(val, false, args));
    }
    else {
      return input;
    }
  };

  // Computed local array retrieval method
  I18N.prototype.getArray = function (args) {
    var input = args[0];
    if (!(args instanceof Object))
      input = args;

    if (this.i18n.loaded && input in this.i18n.dictionary) {
      var val = this.i18n.dictionary[input];
      if (val instanceof Array)
        return val;
    } else {
      return [input];
    }
  }

  // IsLocaleEmpty to test if locales were set or not
  I18N.prototype.isLocaleEmpty = function () {
    return this.i18n.locales ? false : true;
  };


var i18nService = function () {

  /*
   i18n config from service provider
   locales:  Declare all locale resource file URI-path, including mandatory "default" entry
   Example:
   locales: {
   'default': '../i18n/resources-locale_en_US.json',
   'en': '../i18n/resources-locale_fr.json'
   }
   */
  this.config = {
    locales: null
  };

  //SetLocales to init the library
  this.setLocales = function (locales) {
    this.config.locales = locales;
  };

  this.$get = ['$rootScope', '$cookieStore', '$http', '$q', '$window', '$sce', function ($rootScope, $cookieStore, $http, $q, $window, $sce) {

    return new I18N($cookieStore, $http, $q, $window, $sce, $rootScope, this.config);

  }];

};

/** Provider declaration */
i18nModule.provider('i18nService', i18nService);

/** Filter declaration */
i18nModule.filter('i18n', ['i18nService', i18nFilter]);

/** Directive declaration */
i18nModule.directive('i18nLanguageSelector', ['$compile', 'i18nService', function ($compile, service) {
  return {
    restrict: 'A',
    replace: false,
    terminal: true,
    priority: 1000,
    scope: {
      "i18nLanguageSelector": '='
    },
    compile: function compile(element, attrs) {
      element.attr('ng-click', 'select()');
      element.removeAttr('i18n-language-selector');
      element.removeAttr('data-i18n-language-selector');
      return {
        pre: function preLink(scope, iElement, iAttrs, controller) {
        },
        post: function postLink(scope, iElement) {
          scope.select = function () {
            service.selectLanguage(scope.i18nLanguageSelector);
          };
          $compile(iElement)(scope);
        }
      };
    }

  }
}]);
