(function() {
    //@include "JSXGetURL.1.0.4/JSXGetURL/JSXGetURLLoader.jsx"
    app.preferences.setBooleanPreference("ShowExternalJSXWarning", false);

    if (!/illustrator/i.test(app.name)) {
        alert("Script for Illustrator", title, false);
        return;
    }

    // Script variables.
    var title = "Template Automator";
    var doc = app.activeDocument;
    // var layerNames = [];
    var swatchGroup = app.activeDocument.swatchGroups.getByName("CMYKPrintDefaults");
    var swatches = swatchGroup.getAllSwatches();

    // try {
    //     swatchesGroup =
    //     swatches =
    // } catch(e) {
    //     if(!swatchesGroup) {
    //         alert('CMYKPrintDefaults group not found in swatches.')
    //         return
    //     }
    // }

    // Layers
    var layer1 = doc.layers[1];

    // Data
    var orderData = null;
    var partsList = [];
    var bc;
    var roster;
    var sml;
    var combinedParts = [];
    var partInfo = [];
    var currentColorName;
    var multiple = false;

    // Reusable UI variables.
    var g; // group
    var gc1; // group (column)
    var gc2; // group (column)
    var p; // panel
    var w = new Window("dialog", title); // window

    // Permanent UI variables.
    var btnCancel;
    var btnOk;
    var foid;
    var partId;

    // SETUP
    try {
        // Script requires open document.
        if (!app.documents.length) {
            alert("Open a document", title, false);
            return;
        }

        // Script doesn't work in Isolation Mode.
        if (layer1.name == "Isolation Mode") {
            alert("Exit Isolation Mode before running script", title, false);
            return;
        }

        // Check for Layer 1
        if (layer1.name !== "Layer 1") {
            alert("Layer 1 is missing");
            return;
        }
    } catch (e) {
        // Setup failed.
        alert("An error has occurred.\nLine " + e.line + ": " + e.message, title, true);
        return;
    }

    // CREATE USER INTERFACE
    w.alignChildren = "fill";
    // Panel.
    p = w.add("panel");
    // Group of 2 columns.
    g = p.add("group");
    // Groups, columns 1 and 2.
    gc1 = g.add("group");
    gc1.orientation = "column";
    gc1.alignChildren = "left";
    gc2 = g.add("group");
    gc2.orientation = "column";
    gc2.alignChildren = "left";

    // Rows.
    gc1.add("statictext", undefined, "Enter FOID:").preferredSize = [-1, 23];
    foid = gc2.add("edittext", undefined, "", {
        multiline: false,
    });
    foid.preferredSize = [150, 23];

    gc1.add("statictext", undefined, "Enter Part ID:").preferredSize = [-1, 23];
    partId = gc2.add("edittext", undefined, "", {
        multiline: false,
    });
    partId.preferredSize = [150, 23];

    // Action Buttons
    g = w.add("group");
    g.alignment = "center";
    btnCancel = g.add("button", undefined, "Cancel");
    btnOk = g.add("button", undefined, "START");

    // Panel Copyright.
    p = w.add("panel");
    p.add("statictext", undefined, "v1.3.0 - Copyright 2023 - Nico Sevilla");

    // UI ELEMENT EVENT HANDLERS
    btnOk.onClick = function() {
        if (!foid.text) {
            alert("Please enter FOID", " ", false);
            return;
        }

        if (!partId.text) {
            alert("Please enter Part ID", " ", false);
            return;
        }

        w.close(1);
    };

    btnCancel.onClick = function() {
        w.close(0);
    };

    // DISPLAY THE DIALOG
    if (w.show() == 1) {
        try {
            process();
        } catch (e) {
            alert("An error has occurred.\nLine " + e.line + ": " + e.message, title, true);
        }
    }

    //====================================================================
    //               END PROGRAM EXECUTION, BEGIN FUNCTIONS
    //====================================================================

    function dataParser(data) {
        return eval("(" + data + ")");
    }

    function getSwatchColor(colorName) {
        for (var i = 0; i < swatches.length; i++) {
            var swatch = swatches[i];
            if (swatch.name === colorName) {
                return swatch.color;
            }

            // alert('No color swatch found for ' + colorName);
        }
    }

    function colorItems(items, repeat) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (!repeat) {
                var partMatch = findObjectByProperty(sml, "name", item.name);
                if (partMatch) {
                    currentColorName = partMatch.color_name;
                }
            }

            if (item.constructor.name == "GroupItem") {
                alert("test1");
                // Recurse (call self)
                colorItems(item.pageItems, true);
            } else if (item.constructor.name == "CompoundPathItem") {
                alert("test2");
                // Recurse (call self)
                colorItems(item.pathItems, true);
            }
            // else if (item.constructor.name == "TextFrame") {
            //     alert('here 2')
            //     // Fill
            //     if (text.fillColor != "[NoColor]") {
            //         if (swatchFill) {
            //             text.fillColor = swatchFill.color;
            //         }
            //     }
            // }
            else {
                alert("test3");
                // ALL OTHER, NOT TEXT
                // Filled
                // if (item.filled) {
                //     item.fillColor = getSwatchColor('Cardinal')
                // } else {
                if (currentColorName) {
                    item.fillColor = getSwatchColor(currentColorName);
                } else {
                    // alert('empty value', currentColorName)
                }

                // }
            }
        }
    }

    function getOrderData() {
        $.writeln("GETTING ORDER DATA...");
        var url1 =
            "https://api.prolook.com/api/order_items/search/foid/" +
            foid.text +
            "/part_id/" +
            partId.text;
        var url2 = "https://api.prolook.com/api/orders/search_order_by_foid/" + foid.text;
        var getURL = JSXGetURL();
        TIGHTENER.setIssuer("24b520c163713912751b9e27230a9c68", "b.pecho@qstrike.com");
        TIGHTENER.sublicense(
            "gtWX1miviIriH9+f2MpgXBoxpCjcinbUnE5E3YBDStkA",
            "w5B4IKHbcp1RPbmqLSmlDhklE3PFGo77YSqS6XxZrxxktgWin63v7RtNe/rJKUNz1ZlJL5fAastYnlQxpY5RKWbCy9VXCQBpd5+IqJwW5Gdy2G5bWiPDuU0Q0Y9oTS6SbPzHFHr0duRQbqUNO8FnJeCYbaBvtap7ZNo87Df/cJt1QAEaWlbAopitYFx7933mTUU8vW4txg6wG5hcyXv+dPKwrfffHhZOc41BcCiEPMxx7BuXhdwVRmRdMKghlslCgD34SfsvuRZRv74Ikh9nshyGREQ1RNRkH51ayJH5pzdOny27AqcoZnSQ77duCN+C8e4aSoPzjJLNx2+iUo7HIdliNt5pt33cP+KrvQZYW6SFDg5gQSAZmc5ag+ebswVoWWlpFRCSLA2JK1YDYPDpz7t/R92NFViNli6eX+21h3yWiUoWjJbk1225HqQ7JmsHVDHQbe877wP/NeljrdlrOhHcYwKE1pefx1D7/IMrzWoorevCiv32OhoJLk4lZd2FkTkbzLAZRGL4Zqcchqup25f+PEqcECGVyynPRV+GSHqfrnkT8ZXFUHlxfFsD+lwvmKF1QU13u3P/eyPRlZxQbrHlS7nVmA+CGFQrnee0J6RTUoGW6cDy9Oik1ewssqCCt/HS+truh7TysWJacUJ/eWm6OOEH9NTBp95pqqXVwQUnDQ4L",
        );
        getURL.addRequestHeader("Accept: */*");
        var stringData = getURL.get(url1);
        var jsonObj = dataParser(stringData);

        if (!jsonObj.success) {
            var getURL2 = JSXGetURL();
            getURL2.addRequestHeader("Accept: */*");
            stringData = getURL2.get(url2);
            jsonObj = dataParser(stringData);

            if (!jsonObj.success) {
                alert("FOID / Part ID is invalid");
                return;
            } else {
                orderData = jsonObj.order;
                multiple = false;
            }
        } else {
            orderData = jsonObj.data;
            multiple = true;
        }
    }

    function findObjectByProperty(array, propertyName, propertyValue) {
        // Loop through each element in the array
        for (var i = 0; i < array.length; i++) {
            var object = array[i];
            // Check if the element has the desired property value
            if (object.hasOwnProperty(propertyName) && object[propertyName] === propertyValue) {
                return object;
            }
        }
        // If the object is not found, return undefined
        return undefined;
    }

    function process() {
        try {
            getOrderData();
        } catch (e) {
            alert("An error occurred in getOrderData: " + e);
            return;
        }

        if (!orderData) {
            alert("Invalid FOID/PartID. No order data found.");
            return;
        }

        $.writeln("PROCESSING COLORIZATION...");

        try {
            var subLayers = layer1.pageItems;
            var actualLayers = layer1.layers;

            if (multiple) {
                $.writeln("MULTIPLE");
                bc = dataParser(orderData.builder_customizations);
                roster = [];

                // restructure partInfo
                var info = bc.part_info.parts_info;

                for (var i = 0; i < info.length; i++) {
                    var item = info[i];
                    partInfo.push({
                        name: item.part,
                        color_name: item.color.name
                    });
                }
                sml = partInfo;
                var pipingsInfo = [];
                combinedParts = sml;

                // convert and extract pipings information
                for (var key in bc.pipings) {
                    pipingsInfo.push(bc.pipings[key]);
                }
            } else {
                $.writeln("SINGLE");
                bc = dataParser(orderData.items.builder_customizations);
                roster = dataParser(orderData.items.roster);
                sml = bc.sml;
                var pipingsInfo = [];
                combinedParts = sml;

                // convert and extract pipings information
                for (var key in bc.pipings) {
                    pipingsInfo.push(bc.pipings[key]);
                }
            }

            // re construct pipings information to a readable format
            for (var i = 0; i < pipingsInfo.length; i++) {
                var pipingName = pipingsInfo[i].name;
                try {
                    var pipings = [];
                    for (var p = 0; p < pipingsInfo[i].layers.length; p++) {
                        var colorName = pipingsInfo[i].layers[p].colorObj.name;
                        var pipingIndex = p + 1;
                        var pipingFullName =
                            pipingName + " " + pipingIndex + " " + pipingsInfo[i].size;
                        pipings.push({
                            name: pipingFullName,
                            color_name: colorName === "None" ? (colorName = "") : colorName,
                            size: pipingsInfo[i].size,
                        });
                        combinedParts.push({
                            name: pipingFullName,
                            color_name: colorName === "None" ? (colorName = "") : colorName,
                            size: pipingsInfo[i].size,
                        });
                    }
                    // $.writeln("Pipings Information" + JSON.stringify(pipings));
                    // $.writeln("combinedParts Info" + "=====>" + JSON.stringify(combinedParts));
                } catch (e) {
                    $.writeln(pipingName + ": " + "color name missing");
                }
            }

            // this is used for AI
            if (actualLayers.length > 0) {
                for (var x = 0; x < actualLayers.length; x++) {
                    var subLayer = actualLayers[x];

                    try {
                        var paths = subLayer.pageItems[0].pathItems;
                    } catch (e) {
                        $.writeln("paths error" + ":" + e);
                    }

                    // Check if the sublayer is an instance of the Layer constructor
                    if (subLayer.typename === "Layer") {
                        // subLayer is a layer group

                        if (subLayer.layers) {
                            var childLayers = subLayer.layers;
                            for (var i = 0; i < childLayers.length; i++) {
                                var childLayer = childLayers[i];
                                var paths = childLayer.pageItems[0].pathItems;

                                for (var s = 0; s < paths.length; s++) {
                                    var path = paths[s];
                                    //  we are using subLayer.name instead of path.name
                                    var res = findObjectByProperty(
                                        combinedParts,
                                        "name",
                                        childLayer.name,
                                    );
                                    // $.writeln("Result: " + JSON.stringify(res) + "===>" + childLayer.name);

                                    if (res) {
                                        // currentColorName = res.color_name;
                                        if (res.color_name === "Black") {
                                            currentColorName = "BLK";
                                        } else if (res.color_name === "Yellow") {
                                            currentColorName = "YLW";
                                        } else {
                                            currentColorName = res.color_name;
                                        }
                                    } else {
                                        currentColorName = "";
                                    }

                                    try {
                                        if (currentColorName) {
                                            path.fillColor = getSwatchColor(currentColorName);
                                            $.writeln(
                                                subLayer.name +
                                                ":" +
                                                path.fillColor +
                                                "------" +
                                                currentColorName,
                                            );
                                        } else {
                                            $.writeln(subLayer.name + "-" + "None");
                                        }
                                    } catch (e) {
                                        alert(
                                            "Error in sub grouped layers of" +
                                            "-" +
                                            childLayer.name,
                                        );
                                    }
                                }
                            }
                        }

                        for (var s = 0; s < paths.length; s++) {
                            var path = paths[s];
                            //  we are using subLayer.name instead of path.name
                            var res = findObjectByProperty(combinedParts, "name", subLayer.name);
                            // $.writeln("Result: " + JSON.stringify(res));

                            if (res) {
                                // currentColorName = res.color_name;
                                if (res.color_name === "Black") {
                                    currentColorName = "BLK";
                                } else if (res.color_name === "Yellow") {
                                    currentColorName = "YLW";
                                } else {
                                    currentColorName = res.color_name;
                                }
                            } else {
                                currentColorName = "";
                            }

                            if (currentColorName) {
                                path.fillColor = getSwatchColor(currentColorName);
                                $.writeln(
                                    subLayer.name +
                                    ":" +
                                    path.fillColor +
                                    "------" +
                                    currentColorName,
                                );
                            } else {
                                $.writeln(subLayer.name + "None");
                            }
                        }
                    }
                }
                return;
            }

            // this is used for SVG
            if (subLayers.length > 0) {
                colorItems(mainLayer);
                return;
            }
        } catch (e) {
            alert("An error occurred in colorItems: " + e);
        }
    }
})();