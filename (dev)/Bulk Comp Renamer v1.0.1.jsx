// Make sure the project is open
if (app.project === null) {
    alert("Please open a project first.");
} else {
    app.beginUndoGroup("Replace EN_US with ES_LATAM in comp names");

    var selectedItems = app.project.selection;

    if (selectedItems.length === 0) {
        alert("Please select one or more compositions in the Project panel.");
    } else {
        for (var i = 0; i < selectedItems.length; i++) {
            var curItem = selectedItems[i];

            // Check if the selected item is a Comp
            if (curItem instanceof CompItem) {
                var oldName = curItem.name;
                var newName = oldName.replace("src", "src_");

                if (oldName !== newName) {
                    curItem.name = newName;
                }
            }
        }
        alert("Completed renaming comps!");
    }

    app.endUndoGroup();
}
