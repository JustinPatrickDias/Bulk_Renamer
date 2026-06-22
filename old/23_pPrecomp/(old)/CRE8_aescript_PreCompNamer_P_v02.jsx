// Add or modify prefixes for selected compositions
(function () {
    // Begin undo group for a reversible operation
    app.beginUndoGroup("pre_Namer");

    // Get the selected items in the Project panel
    var selectedItems = app.project.selection;

    for (var i = 0; i < selectedItems.length; i++) {
        var item = selectedItems[i];

        // Ensure the item is a composition
        if (item instanceof CompItem) {
            var itemName = item.name;

            // Check if the name starts with "p_", replace it with "pre_"
            if (itemName.indexOf("pre_") === 0) {
                item.name = "p_" + itemName.substring(4);
            }
            // If the name doesn't start with "x_", "p_", or "pre_", add "pre_"
            else if (itemName.indexOf("x_") !== 0 && itemName.indexOf("p_") !== 0) {
                item.name = "p_" + itemName;
            }
        }
    }

    // End undo group
    app.endUndoGroup();
})();
