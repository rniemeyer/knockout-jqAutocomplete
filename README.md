knockout-jqAutocomplete
================
*knockout-jqAutocomplete* is a [Knockout.js](http://knockoutjs.com/) plugin designed to work with jQuery UI's [autocomplete widget](http://jqueryui.com/autocomplete/).

**Options**

* **value** - an observable that holds the current value

* **source** - either a local array (or observableArray) or a function that retrieves an array of options. This function will receive the search term as the first argument and a callback as the second argument that should be called with the array of data to use. This can be called after requesting data via AJAX.

* **inputProp** - If specified, this is a property name to use for populating the input box after making a selection. If not specified, this will fallback to the `labelProp`, then the `valueProp`.

* **labelProp** - If specified, this is a property name to use for populating the menu choices that appear for a user to select. For example, you may want to show the name of an item in the input, but display the description in the list presented to the user. If not specified, this will fallback to the `valueProp`.

* **valueProp** - If specified, this is a property name to use to populate the value when a selection is made. If not specified, the actual item itself will be used as the value.

* **dataValue** - If specified, this observable will be populated with the currently selected data item. This option will allow you to populate **value** with the **valueProp** and have access to the selected object at the same time through **dataValue**.

* **template** - If specified, this is the name of a template to use when building each item in the menu choices. This allows full customization of the options shown to the user.

* **options** - Anything passed in `options` will be included as options passed when initializing the `autocomplete` widget. See http://api.jqueryui.com/autocomplete/ for a list of the available options.

* **filter** - If specified, this function is used to search local data. The function takes in an item and the search term as arguments and should return a whether the item matches. The default filter will call `ko.toJSON` on each item and determine if the search term is contained anywhere in the JSON string. When a function is used for the `source` (remote data), then the data is not filtered, as the response should already be appropriately filtered.

**Global options**

* **ko.bindingHandlers.jqAuto.options** - this object contains any global options that should be passed into the `autocomplete` widget. Options specified in individual bindings will override these values.

**Basic Usage**

Samples in jsFiddle: http://jsfiddle.net/rniemeyer/uGGb8/

* with a local array of strings

```js
var viewModel = {
    myValue: ko.observable(),
    myOptions: ["one", "two", "three"]
};
```

```html
<input data-bind="jqAuto: { value: myValue, source: myOptions" />
```

* with a local array of objects

```js
var viewModel = {
    myValue: ko.observable(),
    myOptions: [
        {
            id: 1,
            name: "one",
            description: "one description"
        },
        {
            id: 2,
            name: "two",
            description: "two description"
        },
        {
            id: 3,
            name: "three",
            description: "three description"
        }
    ]
};
```

```html
<input data-bind="jqAuto: { value: myValue, source: myOptions, inputProp: 'name', labelProp: 'description', valueProp: 'id' }" />
```

* with a local array of objects and custom filtering

```js
var viewModel = {
    myValue: ko.observable(),
    myOptions: [
        {
            id: 1,
            name: "one",
            description: "one description"
        },
        {
            id: 2,
            name: "two",
            description: "two description"
        },
        {
            id: 3,
            name: "three",
            description: "three description"
        }
    ],
    myFilter: function(item, searchTerm) {
        var searchString = item.name + " " + item.description;
        return searchString.indexOf(searchTerm) > -1;
    }
};
```

```html
<input data-bind="jqAuto: { value: myValue, source: myOptions, filter: myFilter, labelProp: 'name' }" />
```

* with a remote array of strings

```js
var viewModel = {
    myValue: ko.observable(),
    getOptions: function(searchTerm, callback) {
        $.ajax({
          dataType: "json",
          url: "/mysearch",
          data: {
            query: searchTerm
          },
        }).done(callback);
    }
};
```

```html
<input data-bind="jqAuto: { value: myValue, source: getOptions" />
```

* with a remote array of objects

```js
var viewModel = {
    myValue: ko.observable(),
    getOptions: function(searchTerm, callback) {
        $.ajax({
          dataType: "json",
          url: "/mysearch",
          data: {
            query: searchTerm
          },
        }).done(callback);
    }
};
```

```html
<input data-bind="jqAuto: { value: myValue, source: getOptions, inputProp: 'name', labelProp: 'description', valueProp: 'id' }" />
```

* using a template for the menu items

```js
var viewModel = {
    myValue: ko.observable(),
    myOptions: [
        {
            id: 1,
            name: "one",
            description: "one description"
        },
        {
            id: 2,
            name: "two",
            description: "two description"
        },
        {
            id: 3,
            name: "three",
            description: "three description"
        }
    ]
};
```

```html
<input data-bind="jqAuto: { value: myValue, source: myOptions, inputProp: 'name', labelProp: 'description', valueProp: 'id', template: 'rowTmpl' }" />

<script id="rowTmpl" type="text/html">
    <a>
        <span data-bind="text: id"></span>:
        <span data-bind="text: name"></span>
        ( <span data-bind="text: description"></span> )
    </a>
<script>
```

**Future Plans**

* options to validate value when not making a selection
* if local observableArray changes, re-validate value

**Dependencies**

* Knockout 2.0+
* jQuery - no specific version identified as minimum
* jQuery UI - no specific version identified as minimum


**Build:** This project uses [grunt](http://gruntjs.com/) for building/minifying.

**License**: MIT [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
