// Bulk Comp Renamer — dockable ScriptUI panel
// Install: Save to After Effects > Scripts > ScriptUI Panels folder,
// then open via Window menu.

(function(thisObj)
{
    function padNumber(n, width)
    {
        var s = String(n);
        while (s.length < width)
        {
            s = "0" + s;
        }
        return s;
    }

    function escapeRegex(s)
    {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // Parses a comp name into base, separator, pad width, and current version number.
    // Recognises trailing patterns like "_v001", " v15", "_V3".
    function splitVersion(name)
    {
        var m = name.match(/^(.*?)([ _])v(\d+)$/i);
        if (m)
        {
            return { base: m[1], sep: m[2], pad: m[3].length, current: parseInt(m[3], 10) };
        }
        return { base: name, sep: "_", pad: 3, current: 0 };
    }

    // Returns next free "base<sep>vNNN" given an object whose keys are taken names
    function nextAvailableVersion(name, takenNames)
    {
        var parts = splitVersion(name);
        var basePattern = new RegExp("^" + escapeRegex(parts.base) + "[ _]v(\\d+)$", "i");
        var maxVersion = 0;
        for (var key in takenNames)
        {
            var match = key.match(basePattern);
            if (match)
            {
                var n = parseInt(match[1], 10);
                if (n > maxVersion)
                {
                    maxVersion = n;
                }
            }
        }
        var next = maxVersion + 1;
        return parts.base + parts.sep + "v" + padNumber(next, parts.pad);
    }

    function collectAllCompNames()
    {
        var names = {};
        var items = app.project.items;
        for (var i = 1; i <= items.length; i++)
        {
            if (items[i] instanceof CompItem)
            {
                names[items[i].name] = true;
            }
        }
        return names;
    }

    function getSelectedComps()
    {
        var sel = app.project.selection;
        if (!sel)
        {
            return [];
        }
        var out = [];
        for (var i = 0; i < sel.length; i++)
        {
            if (sel[i] instanceof CompItem)
            {
                out.push(sel[i]);
            }
        }
        return out;
    }

    function addLabeledField(parent, labelText)
    {
        var row = parent.add("group");
        row.orientation = "row";
        row.alignChildren = ["left", "center"];
        row.alignment = ["fill", "top"];
        var lbl = row.add("statictext", undefined, labelText);
        lbl.preferredSize.width = 55;
        var input = row.add("edittext", undefined, "");
        input.alignment = ["fill", "center"];
        input.preferredSize.width = 260;
        input.minimumSize.width = 120;
        return input;
    }

    function addSection(parent, title)
    {
        var pnl = parent.add("panel", undefined, title);
        pnl.orientation = "column";
        pnl.alignChildren = ["fill", "top"];
        pnl.margins = 10;
        pnl.spacing = 6;
        return pnl;
    }

    function buildUI(parent)
    {
        var win = (parent instanceof Panel)
            ? parent
            : new Window("palette", "Bulk Comp Renamer", undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = 10;
        win.spacing = 10;

        // ---- Find / Replace section ----
        var pnlReplace = addSection(win, "Find / Replace");
        var inputFind = addLabeledField(pnlReplace, "Find:");
        var inputRep = addLabeledField(pnlReplace, "With:");
        var btnReplace = pnlReplace.add("button", undefined, "Replace");
        btnReplace.alignment = ["fill", "top"];

        // ---- Prefix section ----
        var pnlPrefix = addSection(win, "Prefix");
        var inputPre = addLabeledField(pnlPrefix, "Prefix:");
        var btnPrefix = pnlPrefix.add("button", undefined, "Add Prefix");
        btnPrefix.alignment = ["fill", "top"];

        // ---- Suffix section ----
        var pnlSuffix = addSection(win, "Suffix");
        var inputSuf = addLabeledField(pnlSuffix, "Suffix:");
        var btnSuffix = pnlSuffix.add("button", undefined, "Add Suffix");
        btnSuffix.alignment = ["fill", "top"];

        // ---- Version section ----
        var pnlVersion = addSection(win, "Version");
        var btnBump = pnlVersion.add("button", undefined, "Bump to Next Available");
        btnBump.alignment = ["fill", "top"];

        // ---- Button handlers ----
        btnReplace.onClick = function()
        {
            var findStr = inputFind.text;
            var replaceStr = inputRep.text;

            if (findStr === "")
            {
                alert("'Find' field is empty.");
                return;
            }

            var comps = getSelectedComps();
            if (comps.length === 0)
            {
                alert("No comps selected in the Project panel.");
                return;
            }

            app.beginUndoGroup("Bulk Comp Renamer: Replace");
            var changed = 0;
            for (var i = 0; i < comps.length; i++)
            {
                if (comps[i].name.indexOf(findStr) === -1)
                {
                    continue;
                }
                comps[i].name = comps[i].name.split(findStr).join(replaceStr);
                changed++;
            }
            app.endUndoGroup();

            if (changed === 0)
            {
                alert("No selected comps contained '" + findStr + "'.");
            }
        };

        btnPrefix.onClick = function()
        {
            var pre = inputPre.text;
            if (pre === "")
            {
                alert("'Prefix' field is empty.");
                return;
            }

            var comps = getSelectedComps();
            if (comps.length === 0)
            {
                alert("No comps selected in the Project panel.");
                return;
            }

            app.beginUndoGroup("Bulk Comp Renamer: Add Prefix");
            for (var i = 0; i < comps.length; i++)
            {
                comps[i].name = pre + comps[i].name;
            }
            app.endUndoGroup();
        };

        btnSuffix.onClick = function()
        {
            var suf = inputSuf.text;
            if (suf === "")
            {
                alert("'Suffix' field is empty.");
                return;
            }

            var comps = getSelectedComps();
            if (comps.length === 0)
            {
                alert("No comps selected in the Project panel.");
                return;
            }

            app.beginUndoGroup("Bulk Comp Renamer: Add Suffix");
            for (var i = 0; i < comps.length; i++)
            {
                comps[i].name = comps[i].name + suf;
            }
            app.endUndoGroup();
        };

        btnBump.onClick = function()
        {
            var comps = getSelectedComps();
            if (comps.length === 0)
            {
                alert("No comps selected in the Project panel.");
                return;
            }

            // Track every comp name in the project, plus any names we assign in this batch,
            // so multiple selected siblings each get a unique next slot.
            var taken = collectAllCompNames();

            app.beginUndoGroup("Bulk Comp Renamer: Bump Version");
            for (var i = 0; i < comps.length; i++)
            {
                var oldName = comps[i].name;
                var newName = nextAvailableVersion(oldName, taken);
                comps[i].name = newName;
                delete taken[oldName];
                taken[newName] = true;
            }
            app.endUndoGroup();
        };

        win.layout.layout(true);
        win.layout.resize();
        win.onResizing = win.onResize = function() { this.layout.resize(); };

        return win;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window)
    {
        ui.center();
        ui.show();
    }

})(this);
