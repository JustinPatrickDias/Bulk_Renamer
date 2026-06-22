// Add "pre_" to the beginning of selected comps that don't start with "x_", "p_", or "pre_"
(function() {
    // Begin undo group to make changes reversible
    app.beginUndoGroup("Add 'pre_' to selected comps");

    // Get the selected items in the Project panel
    var selectedItems = app.project.selection;

    for (var i = 0; i < selectedItems.length; i++) {
        var item = selectedItems[i];

        // Check if the item is a composition
        if (item instanceof CompItem) {
            // Check if the name doesn't start with "x_", "p_", or "pre_"
            if (!/^x_|^p_|^pre_/.test(item.name)) {
                item.name = "pre_" + item.name; // Add "pre_" to the beginning of the name
            }
        }
    }

    // End undo group
    app.endUndoGroup();
})();
