describe("knockout-jqAutocomplete", function(){
    var instance, engine, input, $input,
        sandbox = document.createElement("div");

    //helper engine that can use a template from a string
    var createStringTemplateEngine = function() {
        var templates = { data: {} };

        var stringTemplateSource = function(template) {
            this.text = function(value) {
                if (arguments.length === 0) {
                    return templates[template];
                }
                templates[template] = value;
            };
        };

        var templateEngine = new ko.nativeTemplateEngine();
        templateEngine.makeTemplateSource = function(template) {
            return new stringTemplateSource(template);
        };

        templateEngine.addTemplate = function(key, value) {
            templates[key] = value;
        };

        return templateEngine;
    };

    it("should create the jqAuto binding", function() {
        expect(ko.bindingHandlers.jqAuto).toBeDefined();
    });

    beforeEach(function() {
        instance = new ko.bindingHandlers.jqAuto.constructor();
        engine = createStringTemplateEngine();

        ko.setTemplateEngine(engine);

        document.body.appendChild(sandbox);
        input = document.createElement("div");
        $input = $(input);
        sandbox.appendChild(input);

        $("ul.ui-autocomplete").remove();
    });

    afterEach(function() {
        ko.removeNode(input);
    });

    describe("JqAuto constructor", function() {
        it("should be able to create a new instance", function() {
            expect(typeof instance).toEqual("object");
        });
    });

    describe("init", function() {
        it("should initialize autocomplete on the element", function() {
            instance.init(input, function() {
                return {};
            });

            expect($input.data("ui-autocomplete")).toBeDefined();
        });

        it("should apply additional options passed in the binding", function() {
            instance.init(input, function() {
                return {
                    options: {
                        delay: 1000
                    }
                };
            });

            expect($input.autocomplete("option", "delay")).toEqual(1000);
        });

        it("should apply global options", function() {
            instance.options = {
                delay: 2000
            };

            instance.init(input, function() {
                return {};
            });

            expect($input.autocomplete("option", "delay")).toEqual(2000);
        });

        it("should override global options with local options", function() {
            instance.options = {
                delay: 2000
            };

            instance.init(input, function() {
                return {
                    options: {
                        delay: 1000
                    }
                };
            });

            expect($input.autocomplete("option", "delay")).toEqual(1000);
        });

        it("should destroy the widget when the node is removed by KO", function() {
            var widget, called;

            instance.init(input, function() {
                return {};
            });

            widget = $input.data("ui-autocomplete");

            widget.destroy = function() {
                called = true;
            };

            ko.removeNode(input);

            expect(called).toBeTruthy();
        });

        it("should not cause an error if widget is already destroyed when the node is removed by KO", function() {
            instance.init(input, function() {
                return {};
            });

            $input.autocomplete("destroy");

            ko.removeNode(input);
        });

        it("should not cause an error if widget is already gone when the node is removed by KO", function() {
            var widget;

            instance.init(input, function() {
                return {};
            });

            widget = $input.data("ui-autocomplete");

            widget.destroy = null;

            ko.removeNode(input);
        });
    });

    describe("defaultFilter", function() {
        it("should not match when the item is null", function() {
            var result = instance.defaultFilter(null, "search");

            expect(result).toEqual(false);
        });

        it("should be able to match an item that is simply 0", function() {
            var result = instance.defaultFilter(0, "0");

            expect(result).toEqual(true);
        });

        it("should match within property values", function() {
            var result = instance.defaultFilter({
                test: "myValue"
            }, "my");

            expect(result).toEqual(true);
        });

        it("should match within property names", function() {
            var result = instance.defaultFilter({
                test: "myValue"
            }, "test");

            expect(result).toEqual(true);
        });

        it("should not match when term does not match any property/value", function() {
            var result = instance.defaultFilter({
                test: "myValue"
            }, "bad");

            expect(result).toEqual(false);
        });
    });

    describe("processOptions", function() {
        it("should call the response function with the results", function() {
            var responseData,
                response = jasmine.createSpy(),
                valueAccessor = function() {
                    return {};
                },
                data = [
                    "one",
                    "two",
                    "three"
                ],
                request = { term: "" };


            instance.processOptions(valueAccessor, null, data, request, response);

            responseData = response.calls.mostRecent().args[0];

            expect(responseData.length).toEqual(3);
            expect(JSON.stringify(responseData[0])).toEqual('{"label":"one","value":"one","actual":"one","data":"one"}');
            expect(JSON.stringify(responseData[1])).toEqual('{"label":"two","value":"two","actual":"two","data":"two"}');
            expect(JSON.stringify(responseData[2])).toEqual('{"label":"three","value":"three","actual":"three","data":"three"}');
        });

        it("should apply the filter to the results", function() {
            var responseData,
                response = jasmine.createSpy(),
                valueAccessor = function() {
                    return {};
                },
                data = [
                    "one",
                    "two",
                    "three"
                ],
                request = { term: "t" };


            instance.processOptions(valueAccessor, instance.defaultFilter, data, request, response);

            responseData = response.calls.mostRecent().args[0];

            expect(responseData.length).toEqual(2);
            expect(JSON.stringify(responseData[0])).toEqual('{"label":"two","value":"two","actual":"two","data":"two"}');
            expect(JSON.stringify(responseData[1])).toEqual('{"label":"three","value":"three","actual":"three","data":"three"}');
        });

        it("should apply the default filter in a case-insensitve manner to the results", function() {
            var responseData,
                response = jasmine.createSpy(),
                valueAccessor = function() {
                    return {};
                },
                data = [
                    "one",
                    "two",
                    "three"
                ],
                request = { term: "T" };


            instance.processOptions(valueAccessor, instance.defaultFilter, data, request, response);

            responseData = response.calls.mostRecent().args[0];

            expect(responseData.length).toEqual(2);
            expect(JSON.stringify(responseData[0])).toEqual('{"label":"two","value":"two","actual":"two","data":"two"}');
            expect(JSON.stringify(responseData[1])).toEqual('{"label":"three","value":"three","actual":"three","data":"three"}');
        });

        it("should not error when data is empty", function() {
            var responseData,
                response = jasmine.createSpy(),
                valueAccessor = function() {
                    return {};
                },
                data = null,
                request = { term: "t" };


            instance.processOptions(valueAccessor, instance.defaultFilter, data, request, response);

            responseData = response.calls.mostRecent().args[0];

            expect(responseData.length).toEqual(0);
        });

        it("should use the appropriate values for the mapped properties", function() {
            var responseData,
                response = jasmine.createSpy(),
                valueAccessor = function() {
                    return {
                        inputProp: "one",
                        labelProp: "two",
                        valueProp: "three"
                    };
                },
                data = [
                    {
                        one: "1-one",
                        two: "1-two",
                        three: "1-three"
                    },
                    {
                        one: "2-one",
                        two: "2-two",
                        three: "2-three"
                    },
                    {
                        one: "3-one",
                        two: "3-two",
                        three: "3-three"
                    }
                ],
                request = {};

            instance.processOptions(valueAccessor, null, data, request, response);

            responseData = response.calls.mostRecent().args[0];

            expect(responseData.length).toEqual(3);
            expect(responseData[0].label).toEqual("1-two");
            expect(responseData[0].value).toEqual("1-one");
            expect(responseData[0].actual).toEqual("1-three");

            expect(responseData[1].label).toEqual("2-two");
            expect(responseData[1].value).toEqual("2-one");
            expect(responseData[1].actual).toEqual("2-three");

            expect(responseData[2].label).toEqual("3-two");
            expect(responseData[2].value).toEqual("3-one");
            expect(responseData[2].actual).toEqual("3-three");
        });
    });

    describe("renderItem", function() {
        it("should use appropriate template", function() {
            var context, $ul;

            engine.addTemplate("test", "<a>test</a>");

            //get a context
            ko.applyBindings({ name: "test" }, input);
            context = ko.contextFor(input);

            $ul = $("<ul />").appendTo($input);

            instance.renderItem("test", context, $ul, {});

            expect($ul.html()).toEqual("<li><a>test</a></li>");
        });

        it("should use the appropriate context for binding", function() {
            var context, $ul;

            engine.addTemplate("test", "<a data-bind=\"text: id\"></a>");

            //get a context
            ko.applyBindings({ name: "test" }, input);
            context = ko.contextFor(input);

            $ul = $("<ul />").appendTo($input);

            instance.renderItem("test", context, $ul, {
                data: {
                    id: 1
                }
            });

            expect($ul.html()).toEqual("<li><a data-bind=\"text: id\">1</a></li>");
        });

        it("should call cleanNode when a templated li is removed", function() {
            var context, $ul, li;

            engine.addTemplate("test", "<a data-bind=\"text: id\"></a>");

            //get a context
            ko.applyBindings({ name: "test" }, input);
            context = ko.contextFor(input);

            $ul = $("<ul />").appendTo($input);

            instance.renderItem("test", context, $ul, {
                data: {
                    id: 1
                }
            });

            li = $ul.children()[0];

            ko.utils.domData.set(li, "mykey", "myvalue");

            //trigger remove event which should trigger cleanNode which will clear the data
            $(li).trigger("remove");

            expect(ko.utils.domData.get(li, "mykey")).toBeUndefined();
        });

        it("should return the newly createad li", function() {
            var context, $ul, li;

            engine.addTemplate("test", "<a data-bind=\"text: id\"></a>");

            //get a context
            ko.applyBindings({ name: "test" }, input);
            context = ko.contextFor(input);

            $ul = $("<ul />").appendTo($input);

            li = instance.renderItem("test", context, $ul, {
                data: {
                    id: 1
                }
            });

            expect(li[0]).toEqual($ul.children()[0]);
        });
    });

    describe("getPropertyNames", function() {
        it("should return the correct names when all options are supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {
                    inputProp: "one",
                    labelProp: "two",
                    valueProp: "three"
                };
            });

            expect(results.input).toEqual("one");
            expect(results.label).toEqual("two");
            expect(results.value).toEqual("three");
        });

        it("should return the correct names when inputProp and valueProp are supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {
                    inputProp: "one",
                    valueProp: "three"
                };
            });

            expect(results.input).toEqual("one");
            expect(results.label).toEqual("three");
            expect(results.value).toEqual("three");
        });

        it("should return the correct names when labelProp and valueProp are supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {
                    labelProp: "two",
                    valueProp: "three"
                };
            });

            expect(results.input).toEqual("two");
            expect(results.label).toEqual("two");
            expect(results.value).toEqual("three");
        });

        it("should return the correct names when labelProp and inputProp are supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {
                    inputProp: "one",
                    labelProp: "two"
                };
            });

            expect(results.input).toEqual("one");
            expect(results.label).toEqual("two");
            expect(results.value).toBeUndefined();
        });

        it("should return the correct names when only valueProp is supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {
                    valueProp: "three"
                };
            });

            expect(results.input).toEqual("three");
            expect(results.label).toEqual("three");
            expect(results.value).toEqual("three");
        });

        it("should return the correct names when only labelProp is supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {
                    labelProp: "two"
                };
            });

            expect(results.input).toEqual("two");
            expect(results.label).toEqual("two");
            expect(results.value).toBeUndefined();
        });

        it("should return the correct names when only inputProp is supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {
                    inputProp: "one"
                };
            });

            expect(results.input).toEqual("one");
            expect(results.label).toBeUndefined();
            expect(results.value).toBeUndefined();
        });

        it("does not error when no properties are supplied", function() {
            var results = instance.getPropertyNames(function() {
                return {};
            });

            expect(results.input).toBeUndefined();
            expect(results.label).toBeUndefined();
            expect(results.value).toBeUndefined();
        });
    });

    describe("update function", function() {
        it("should set the input's value", function() {
            instance.update(input, function() {
                return {
                    value: ko.observable("test")
                };
            });

            expect(input.value).toEqual("test");
        });

        it("should clear the input's value, when value is null", function() {
            instance.update(input, function() {
                return {
                    value: ko.observable(null)
                };
            });

            expect(input.value).toEqual("");
        });

        it("should clear the input's value, when value is undefined", function() {
            instance.update(input, function() {
                return {
                    value: ko.observable()
                };
            });

            expect(input.value).toEqual("");
        });

        it("should clear the input's value, when value is an empty string", function() {
            instance.update(input, function() {
                return {
                    value: ko.observable()
                };
            });

            expect(input.value).toEqual("");
        });

        it("should set the input's value to labelProp based on valueProp", function () {
            var items = [{ id: "1", name: "One" }],
                value = ko.observable("1");

            instance.update(input, function() {
                return {
                    value: value,
                    source: items,
                    labelProp: "name",
                    valueProp: "id"
                };
            });

            expect(input.value).toEqual("One");
        });

        it("should set the input's value to inputProp based on valueProp", function () {
            var items = [{ id: "1", name: "One" }],
                value = ko.observable("1");

            instance.update(input, function () {
                return {
                    value: value,
                    source: items,
                    inputProp: "name",
                    valueProp: "id"
                };
            });

            expect(input.value).toEqual("One");
        });

        it("should set the input's value to valueProp based on valueProp", function () {
            var items = [{ id: "1", name: "One" }],
                value = ko.observable("1");

            instance.update(input, function () {
                return {
                    value: value,
                    source: items,
                    valueProp: "id"
                };
            });

            expect(input.value).toEqual("1");
        });
    });

    describe("using the binding", function() {
        it("should allow binding against strings", function() {
            var $listItems,
                items = ["one", "two", "three"],
                value = ko.observable();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items
                }
            });

            $input.autocomplete("search", "t");

            $listItems = $("ul.ui-autocomplete li");

            expect($listItems.length).toEqual(2);
            expect($listItems.first().text()).toEqual("two");
            expect($listItems.last().text()).toEqual("three");
        });

        it("should respect the labelProp option", function() {
            var $listItems,
                items = [
                    {
                        name: "one",
                        description: "one description"
                    },
                    {
                        name: "two",
                        description: "two description"
                    },
                    {
                        name: "three",
                        description: "three description"
                    }
                ],
                value = ko.observable();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    labelProp: "description",
                    source: items
                }
            });

            $input.autocomplete("search", "one");

            $listItems = $("ul.ui-autocomplete li");

            expect($listItems.length).toEqual(1);
            expect($listItems.first().text()).toEqual("one description");
        });

        it("should allow using a template", function() {
            var $listItems,
                items = ["one", "two", "three"],
                value = ko.observable();

            engine.addTemplate("test", "<a>!<span data-bind='text: $data'></span>!</a>");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    template: "test"
                }
            });

            $input.autocomplete("search", "t");

            $listItems = $("ul.ui-autocomplete li");

            expect($listItems.length).toEqual(2);
            expect($listItems.first().text()).toEqual("!two!");
            expect($listItems.last().text()).toEqual("!three!");
        });

        it("context bound to template should be data item", function() {
            var $listItems,
                items = [
                    { name: "one" },
                    { name: "two" },
                    { name: "three" }
                ],
                value = ko.observable();

            engine.addTemplate("test", "<a>!<span data-bind='text: name'></span>!</a>");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    template: "test",
                    valueProp: "name"
                }
            });

            $input.autocomplete("search", "t");

            $listItems = $("ul.ui-autocomplete li");

            expect($listItems.length).toEqual(2);
            expect($listItems.first().text()).toEqual("!two!");
            expect($listItems.last().text()).toEqual("!three!");
        });

        it("should respect a custom filter", function() {
            var $listItems,
                filterCallCount = 0,
                items = ["one", "two", "three"],
                value = ko.observable(),
                customFilter = function(item, term) {
                    filterCallCount++;
                    return term === "t"
                };

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    filter: customFilter
                }
            });

            $input.autocomplete("search", "t");

            $listItems = $("ul.ui-autocomplete li");

            expect(filterCallCount).toEqual(3);
            expect($listItems.length).toEqual(3);
        });

        it("should allow using a function to retrieve the data", function() {
            var $listItems, calledTerm,
                items = ["one", "two", "three"],
                value = ko.observable(),
                getItems = function(term, response) {
                    calledTerm = term;

                    response(items);
                };

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: getItems
                }
            });

            $input.autocomplete("search", "t");

            $listItems = $("ul.ui-autocomplete li");

            expect(calledTerm).toEqual("t");
            expect($listItems.length).toEqual(3);
        });

        it("should populate the value on selection", function() {
            var $listItems,
                items = ["one", "two", "three"],
                value = ko.observable();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items
                }
            });

            $input.autocomplete("search", "t");

            $listItems = $("ul.ui-autocomplete li");

            $listItems.first("a").click();

            expect(value()).toEqual("two");
        });

        it("should populate the value when not selecting from list", function() {
            var items = ["one", "two", "three"],
                value = ko.observable();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items
                }
            });

            $input.val("test").blur();
            $input.trigger("autocompletechange");

            expect(value()).toEqual("test");
        });

        it("should clear the dataValue when not selecting from list", function() {
            var items = ["one", "two", "three"],
                value = ko.observable(),
                dataValue = ko.observable("test");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    dataValue: dataValue,
                    source: items
                }
            });

            $input.val("test").blur();
            $input.trigger("autocompletechange");

            expect(value()).toEqual("test");
            expect(dataValue()).toEqual(null);
        });

        it("should respect the valueProp option on selection", function() {
            var $listItems,
                items = [
                    {
                        name: "one",
                        description: "one description"
                    },
                    {
                        name: "two",
                        description: "two description"
                    },
                    {
                        name: "three",
                        description: "three description"
                    }
                ],
                value = ko.observable();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    valueProp: "name"
                }
            });

            $input.autocomplete("search", "one");

            $listItems = $("ul.ui-autocomplete li");

            $listItems.first("a").click();

            expect(value()).toEqual("one");
        });

        it("should respect the inputProp option on selection", function() {
            var $listItems,
                items = [
                    {
                        name: "one",
                        description: "one description"
                    },
                    {
                        name: "two",
                        description: "two description"
                    },
                    {
                        name: "three",
                        description: "three description"
                    }
                ],
                value = ko.observable();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    inputProp: "description"
                }
            });

            $input.autocomplete("search", "one");

            $listItems = $("ul.ui-autocomplete li");

            $listItems.first("a").click();

            expect($input.text()).toEqual("one description");
        });

        it("should respect the dataValue option on selection", function() {
            var $listItems,
                items = [
                    {
                        name: "one",
                        description: "one description"
                    },
                    {
                        name: "two",
                        description: "two description"
                    },
                    {
                        name: "three",
                        description: "three description"
                    }
                ],
                value = ko.observable(),
                dataValue = ko.observable();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    dataValue: dataValue,
                    source: items,
                    valueProp: "name"
                }
            });

            $input.autocomplete("search", "one");

            $listItems = $("ul.ui-autocomplete li");

            $listItems.first("a").click();

            expect(value()).toEqual("one");
            expect(dataValue()).toEqual(items[0]);
        });

        it("should initially set the input's value", function() {
            var items = [],
                value = ko.observable("testing");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items
                }
            });

            expect(input.value).toEqual("testing");
        });

        it("should initially set the input's value to inputProp based on valueProp", function () {
            var items = [{id:"1", name: "One"}],
                value = ko.observable("1");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    inputProp: "name",
                    valueProp: "id"
                }
            });

            expect(input.value).toEqual("One");
        });

        it("should initially set the input's value to labelProp based on valueProp", function () {
            var items = [{ id: "1", name: "One" }],
                value = ko.observable("1");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    labelProp: "name",
                    valueProp: "id"
                }
            });

            expect(input.value).toEqual("One");
        });

        it("should initially set the input's value to valueProp based on valueProp", function () {
            var items = [{ id: "1", name: "One" }],
                value = ko.observable("1");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    valueProp: "id"
                }
            });

            expect(input.value).toEqual("1");
        });

        it("should update the input's value when the observable changes", function() {
            var items = [],
                value = ko.observable("testing");

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items
                }
            });

            expect(input.value).toEqual("testing");

            value("updated");

            expect(input.value).toEqual("updated");
        });

        it("should call a passed in \"select\" function", function() {
            var $listItems,
                items = ["one", "two", "three"],
                value = ko.observable(),
                handler = jasmine.createSpy();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    options: {
                        select: handler
                    }
                }
            });

            $input.autocomplete("search", "t");

            $listItems = $("ul.ui-autocomplete li");

            $listItems.first("a").click();

            expect(handler.calls.count()).toEqual(1);
            expect(handler.calls.argsFor(0)[0].type).toEqual("autocompleteselect");
            expect("item" in handler.calls.argsFor(0)[1]).toBeTruthy();
        });

        it("should call a passed in \"change\" function", function() {
            var items = [],
                value = ko.observable("testing"),
                handler = jasmine.createSpy();

            ko.applyBindingsToNode(input, {
                jqAuto: {
                    value: value,
                    source: items,
                    options: {
                        change: handler
                    }
                }
            });

            $input.val("test").blur();

            expect(handler.calls.count()).toEqual(1);
            expect(handler.calls.argsFor(0)[0].type).toEqual("autocompletechange");
            expect("item" in handler.calls.argsFor(0)[1]).toBeTruthy();
        });
    });
});
