(function () {
	//@include "JSXGetURL.0.0.9/JSXGetURL/JSXGetURLLoader.jsx"
	//@include "json2.js"
	app.preferences.setBooleanPreference("ShowExternalJSXWarning", false);

	if (!/illustrator/i.test(app.name)) {
		alert("Script for Illustrator", title, false);
		return;
	}

	// Script variables.
	var title = "Template Automator";
	var doc = app.activeDocument;
	// var layerNames = [];
	var swatchGroup =
		app.activeDocument.swatchGroups.getByName("CMYKPrintDefaults");
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
	p.add("statictext", undefined, "v1.2.3 - Copyright 2023 - Nico Sevilla");

	// UI ELEMENT EVENT HANDLERS
	btnOk.onClick = function () {
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

	btnCancel.onClick = function () {
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
			"https://staging-api.prolook.com/api/order_items/search/foid/" +
			foid.text +
			"/part_id/" +
			partId.text;
		var url2 =
			"https://api.prolook.com/api/orders/search_order_by_foid/" + foid.text;
		var getURL = JSXGetURL();
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
			if (
				object.hasOwnProperty(propertyName) &&
				object[propertyName] === propertyValue
			) {
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
					partInfo.push({ name: item.part, color_name: item.color.name });
				}
				sml = partInfo;
			} else {
				$.writeln("SINGLE");
				bc = dataParser(orderData.items.builder_customizations);
				roster = dataParser(orderData.items.roster);
				sml = bc.sml;
			}

			// this is used for AI
			if (actualLayers.length > 0) {
				for (var x = 0; x < actualLayers.length; x++) {
					var subLayer = actualLayers[x];

					// Check if the sublayer is an instance of the Layer constructor
					if (subLayer.typename === "Layer") {
						var paths = subLayer.pageItems[0].pathItems;
						for (var s = 0; s < paths.length; s++) {
							var path = paths[s];
							//  we are using subLayer.name instead of path.name
							var res = findObjectByProperty(sml, "name", subLayer.name);
							$.writeln("Result: " + JSON.stringify(res));

							if (res) {
								currentColorName = res.color_name;
							} else {
								currentColorName = "";
							}

							if (currentColorName) {
								path.fillColor = getSwatchColor(currentColorName);
								$.writeln(subLayer.name + ":" + path.fillColor + "------" + currentColorName);
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
