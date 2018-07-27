;(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD anonymous module
        define(["knockout", "jquery", "jquery-ui/autocomplete"], factory);
    } else {
        // No module loader - put directly in global namespace
        factory(window.ko, jQuery);
    }
})(function(ko, $) {
    var JqAuto = function() {
        var self = this,
            unwrap = ko.utils.unwrapObservable; //support older KO versions that did not have ko.unwrap

        //binding's init function
        this.init = function(element, valueAccessor, allBindings, data, context) {
            var existingSelect, existingChange,
                options = unwrap(valueAccessor()),
                config = {},
                filter = typeof options.filter === "function" ? options.filter : self.defaultFilter;

            var recentlySelectedFlag = false;
            var propNames = self.getPropertyNames(valueAccessor);
            var sources = unwrap(options.source);

            //extend with global options
            ko.utils.extend(config, self.options);
            //override with options passed in binding
            ko.utils.extend(config, options.options);

            //get source from a function (can be remote call)
            if (typeof options.source === "function" && !ko.isObservable(options.source)) {
                config.source = function(request, response) {
                    //provide a wrapper to the normal response callback
                    var callback = function(data) {
                        self.processOptions(valueAccessor, null, data, request, response);
                    };

                    //call the provided function for retrieving data
                    options.source.call(context.$data, request.term, callback);
                };
            }
            else {
                //process local data
                config.source = self.processOptions.bind(self, valueAccessor, filter, options.source);
            }

            function writeValueToModel(valueToWrite) {
                if (ko.isWriteableObservable(options.dataValue)) {
                    options.dataValue(valueToWrite);
                } else {  //write to non-observable
                    //I'm not sure if this is still valid, but it will only happen if the user isn't using the plugin correctly anyway
                    if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers']['jqAutoValue'])
                        allBindings['_ko_property_writers']['jqAutoValue'](valueToWrite);
                }
            }

            //if the user simply tabs out,  or blurs the input in some way
            //we should see if they had typed in something valid, but didn't bother to actually
            //click the item in the dropdown, thus failing to trigger the 'select' event
            $(element).bind("blur", function (event) {
                var currentValue = $(element).val();

                var matchingItem = ko.utils.arrayFirst(sources, function (opt) {
                    //guard against the invocation not specifying a propName for the value (as is the case with simple lists)
                    var val = propNames.input ? opt[propNames.input] : opt;
                    return unwrap(val) === currentValue;
                });

                var val = propNames.value ? (matchingItem ? matchingItem[propNames.value] : null) : matchingItem;
                if (!matchingItem) {
                    writeValueToModel(null);

                }
                    //it turns out that blur gets called after a select as well - if the user actually selected
                    //something, rather than just typing and then tabbing out, then we don't want to automatically
                    //select the first matching item in the list - multiple items may match with the same values!
                    //So, since select is stronger than blurring, if someone has recently selected then let's not mess
                    //with the value as long as it matches *something*
                else if (!recentlySelectedFlag) {
                    writeValueToModel(val);
                }
                recentlySelectedFlag = false;
            });

            //save any passed in select/change calls
            existingSelect = typeof config.select === "function" && config.select;
            existingChange = typeof config.change === "function" && config.change;

            //handle updating the actual value
            config.select = function (event, ui) {
                //if a selection happened and the ui item is null, we should probably null out the value
                options.value(ui.item ? ui.item.actual : null);
                writeValueToModel(ui.item ? ui.item.data : null);
                recentlySelectedFlag = true;

                if (existingSelect) {
                    existingSelect.apply(this, arguments);
                }

            };

            //user made a change without selecting a value from the list
            config.change = function (event, ui) {

                var currentValue = ui && ui.item && ui.item.actual;

                if (!currentValue) {
                    options.value(event.target && event.target.value);
                    writeValueToModel(null);
                }

                if (existingChange) {
                    existingChange.apply(this, arguments);
                }
            };

            // if the user changes the filter selections (or the source list in any way),
            //   clear out the value of the model if the previous selection is now invalid
            function clearAfterFilter() {
                var currentValue = $(element).val();
                var matchingItem = ko.utils.arrayFirst(unwrap(source), function (item) {
                    var val = inputValueProp ? item[inputValueProp] : item;
                    return unwrap(val) === currentValue;
                });

                if (!matchingItem) {
                    writeValueToModel(null);
                }
            }

            //whenever the items that make up the source are updated, make sure that autocomplete knows it
            if (typeof options.source === "function") options.source.subscribe(function (newValue) {
                clearAfterFilter();
                $(element).autocomplete("option", "source", newValue);
            });

            //initialize the widget
            var widget = $(element).autocomplete(config).data("ui-autocomplete");

            //render a template for the items
            if (options.template) {
                widget._renderItem = self.renderItem.bind(self, options.template, context);
            }

            //destroy the widget if KO removes the element
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if (widget && typeof widget.destroy === "function") {
                    widget.destroy();
                    widget = null;
                }
            });
        };

        //the binding's update function. keep value in sync with model
        this.update = function(element, valueAccessor) {
            var propNames, sources,
                options = unwrap(valueAccessor()),
                value = unwrap(options && options.value);

            if (!value && value !== 0) {
                value = "";
            }

            // find the appropriate value for the input
            sources = unwrap(options.source);
            propNames = self.getPropertyNames(valueAccessor);

            // if there is local data, then try to determine the appropriate value for the input
            if ($.isArray(sources)) {
                value = ko.utils.arrayFirst(sources, function (opt) {
                        return (propNames.value ? opt[propNames.value] : opt) == value;
                    }
                ) || value;
            }

            if (value)
            {
                element.value = (propNames.input && typeof value === "object") ? value[propNames.input] : value;
            }
        };

        //if dealing with local data, the default filtering function
        this.defaultFilter = function(item, term) {
            term = term && term.toLowerCase();
            return (item || item === 0) && ko.toJSON(item).toLowerCase().indexOf(term) > -1;
        };

        //filter/map options to be in a format that autocomplete requires
        this.processOptions = function(valueAccessor, filter, data, request, response) {
            var item, index, length,
                items = unwrap(data) || [],
                results = [],
                props = this.getPropertyNames(valueAccessor);

            //filter/map items
            for (index = 0, length = items.length; index < length; index++) {
                item = items[index];

                if (!filter || filter(item, request.term)) {
                    results.push({
                        label: props.label ? item[props.label] : item.toString(),
                        value: props.input ? item[props.input] : item.toString(),
                        actual: props.value ? item[props.value] : item,
                        data: item
                    });
                }
            }

            //call autocomplete callback to display list
            response(results);
        };

        //if specified, use a template to render an item
        this.renderItem = function(templateName, context, ul, item) {
            var $li = $("<li></li>").appendTo(ul),
                itemContext = context.createChildContext(item.data);

            //apply the template binding
            ko.applyBindingsToNode($li[0], { template: templateName }, itemContext);

            //clean up
            $li.one("remove", ko.cleanNode.bind(ko, $li[0]));

            return $li;
        };

        //retrieve the property names to use for the label, input, and value
        this.getPropertyNames = function(valueAccessor) {
            var options = ko.toJS(valueAccessor());

            return {
                label: options.labelProp || options.valueProp,
                input: options.inputProp || options.labelProp || options.valueProp,
                value: options.valueProp
            };
        };

        //default global options passed into autocomplete widget
        this.options = {
            autoFocus: true,
            delay: 50
        };
    };

    ko.bindingHandlers.jqAuto = new JqAuto();
});
