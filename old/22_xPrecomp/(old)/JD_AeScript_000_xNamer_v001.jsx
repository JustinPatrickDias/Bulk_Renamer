// Add "x_" to the beginning of selected comp names, replacing "p_" if it exists
(function () {
    var proj = app.project;
    if (!proj) {
        alert("No project is open.");
        return;
    }

    var selectedItems = proj.selection;
    if (selectedItems.length === 0) {
        alert("Please select one or more compositions.");
        return;
    }

    app.beginUndoGroup("Rename Comps to x_");

    for (var i = 0; i < selectedItems.length; i++) {
        var item = selectedItems[i];
        if (item instanceof CompItem) {
            var name = item.name;
            if (name.indexOf("p_") === 0) {
                item.name = name.replace(/^p_/, "x_");
            } else if (name.indexOf("x_") !== 0) {
                item.name = "x_" + name;
            }
            // If name already starts with x_, leave it unchanged
        }
    }

    app.endUndoGroup();
})();
