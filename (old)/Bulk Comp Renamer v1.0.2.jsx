// Bulk Comp Renamer — dockable ScriptUI panel
// Install: Save to After Effects > Scripts > ScriptUI Panels folder,
// then open via Window menu.

(function(thisObj) {

    function buildUI(parent) {
        var win = (parent instanceof Panel)
            ? parent
            : new Window("palette", "Bulk Comp Renamer", undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = 10;
        win.spacing = 8;

        // "Replace" row
        var rowFind = win.add("group");
        rowFind.orientation = "row";
        rowFind.alignChildren = ["left", "center"];
        rowFind.alignment = ["fill", "top"];
        var lblFind   = rowFind.add("statictext", undefined, "Replace:");
        lblFind.preferredSize.width = 50;
        var inputFind = rowFind.add("edittext", undefined, "");
        inputFind.alignment = ["fill", "center"];
        inputFind.preferredSize.width = 280;
        inputFind.minimumSize.width   = 120;

        // "With" row
        var rowRep = win.add("group");
        rowRep.orientation = "row";
        rowRep.alignChildren = ["left", "center"];
        rowRep.alignment = ["fill", "top"];
        var lblRep   = rowRep.add("statictext", undefined, "With:");
        lblRep.preferredSize.width = 50;
        var inputRep = rowRep.add("edittext", undefined, "");
        inputRep.alignment = ["fill", "center"];
        inputRep.preferredSize.width = 280;
        inputRep.minimumSize.width   = 120;

        // Go button
        var btnGo = win.add("button", undefined, "Go");
        btnGo.alignment = ["fill", "top"];

        btnGo.onClick = function() {
            var findStr    = inputFind.text;
            var replaceStr = inputRep.text;

            if (findStr === "") {
                alert("'Replace' field is empty.");
                return;
            }

            var sel = app.project.selection;
            if (!sel || sel.length === 0) {
                alert("No items selected in the Project panel.");
                return;
            }

            app.beginUndoGroup("Bulk Comp Renamer");
            var changedCount = 0;
            for (var i = 0; i < sel.length; i++) {
                var item = sel[i];
                if (!(item instanceof CompItem)) continue;
                if (item.name.indexOf(findStr) === -1) continue;
                item.name = item.name.split(findStr).join(replaceStr);
                changedCount++;
            }
            app.endUndoGroup();

            if (changedCount === 0) {
                alert("No selected comps contained '" + findStr + "'.");
            }
        };

        win.layout.layout(true);
        win.layout.resize();
        win.onResizing = win.onResize = function() { this.layout.resize(); };

        return win;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window) {
        ui.center();
        ui.show();
    }

})(this);
