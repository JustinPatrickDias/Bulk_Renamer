// Bulk Comp Renamer
// Version 1.0.4
// Script UI Panel for renaming assets in the project panel

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

    function pad2(n)
    {
        return (n < 10) ? "0" + n : "" + n;
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

    // Decides the new name for a comp when applying a "p_" / "x_" prefix.
    // Returns null when the comp should be left unchanged.
    //   - Already has the target prefix     -> skip
    //   - Has the opposite prefix           -> swap it for the target prefix
    //   - Auto-named "Comp N" / "Pre-Comp N" -> "<prefix>PreComp_NN" (2-digit pad)
    //   - Anything else                     -> "<prefix>" + name
    function prefixedName(name, prefix, other)
    {
        if (name.indexOf(prefix) === 0)
        {
            return null;
        }
        if (name.indexOf(other) === 0)
        {
            return prefix + name.slice(2);
        }
        var compMatch = name.match(/^Comp\s+(\d+)$/i);
        if (compMatch)
        {
            return prefix + "PreComp_" + pad2(parseInt(compMatch[1], 10));
        }
        var precompMatch = name.match(/^Pre-?Comp\s+(\d+)$/i);
        if (precompMatch)
        {
            return prefix + "PreComp_" + pad2(parseInt(precompMatch[1], 10));
        }
        return prefix + name;
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

    // Applies a "p_" / "x_" prefix toggle to the current selection.
    function applyPrefixToggle(prefix, other, undoLabel)
    {
        var comps = getSelectedComps();
        if (comps.length === 0)
        {
            alert("No comps selected in the Project panel.");
            return;
        }

        app.beginUndoGroup(undoLabel);
        for (var i = 0; i < comps.length; i++)
        {
            var result = prefixedName(comps[i].name, prefix, other);
            if (result !== null)
            {
                comps[i].name = result;
            }
        }
        app.endUndoGroup();
    }

    function showAbout()
    {
        var msg = "Bulk Comp Renamer\nVersion 1.0.4\n\n"
            + "Renames the compositions you have selected in the Project panel.\n"
            + "Select one or more comps first, then click an action. Everything is\n"
            + "undoable with Ctrl/Cmd+Z.\n\n"
            + "QUICK ACTIONS\n"
            + "  Version Up  -  Renames each selected comp to the next free version\n"
            + "                 number (e.g. _v003 -> _v004). Scans the whole project\n"
            + "                 so multiple selected siblings each get a unique slot.\n"
            + "  p_          -  Adds a 'p_' prefix. Converts an existing 'x_' prefix\n"
            + "                 to 'p_'. Auto-named comps become 'p_PreComp_NN'.\n"
            + "  x_          -  Adds an 'x_' prefix. Converts an existing 'p_' prefix\n"
            + "                 to 'x_'. Auto-named comps become 'x_PreComp_NN'.\n\n"
            + "FIND / REPLACE\n"
            + "  Replaces every occurrence of the Find text with the With text in\n"
            + "  each selected comp's name.\n\n"
            + "PREFIX / SUFFIX\n"
            + "  Type some text, then Add Prefix (prepend) or Add Suffix (append) it\n"
            + "  to each selected comp.";
        alert(msg, "About Bulk Comp Renamer");
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

        // Responsive-layout constants. QA_MIN / PS_MIN are panel widths (px): at or
        // above them each section uses its one-row layout; below them it wraps.
        var GAP = 6;            // gap between buttons
        var BTN_H = 24;         // fixed button height (never stretches vertically)
        var QA_MIN = 270;       // panel width at/above which Quick Actions is one row
        var PS_MIN = 240;       // panel width at/above which Prefix/Suffix is one row

        // Equal widths make native "fill" layout split a row into even columns; the
        // locked height keeps buttons from stretching as the panel resizes.
        function evenWidths(btns, pref, min)
        {
            for (var i = 0; i < btns.length; i++)
            {
                btns[i].preferredSize = [pref, BTN_H];
                btns[i].minimumSize = [min, BTN_H];
                btns[i].maximumSize.height = BTN_H;
            }
        }

        // ---- Quick Actions section ----
        // qaBody holds only the buttons the current width needs (no hidden second
        // variant reserving space). buildQuick() rebuilds it when the panel crosses
        // the width threshold. The buttons use horizontal "fill" so they divide the
        // row evenly, with a locked height so they never stretch.
        var pnlQuick = addSection(win, "Quick Actions");
        var qaBody = pnlQuick.add("group");
        qaBody.orientation = "column";
        qaBody.alignment = ["fill", "top"];
        qaBody.alignChildren = ["fill", "top"];
        qaBody.spacing = GAP;
        qaBody.margins = 0;

        function addButtonRow()
        {
            var row = qaBody.add("group");
            row.orientation = "row";
            row.alignment = ["fill", "top"];
            row.alignChildren = ["fill", "center"];
            row.spacing = GAP;
            row.margins = 0;
            return row;
        }

        function buildQuick(narrow)
        {
            while (qaBody.children.length > 0)
            {
                qaBody.remove(qaBody.children[0]);
            }

            if (!narrow)
            {
                // One row: Version Up | p_ | x_, even thirds.
                var row = addButtonRow();
                var bv = row.add("button", undefined, "Version Up");
                var bp = row.add("button", undefined, "p_");
                var bx = row.add("button", undefined, "x_");
                evenWidths([bv, bp, bx], 50, 30);
                bv.onClick = doVersionUp;
                bp.onClick = doPrefixP;
                bx.onClick = doPrefixX;
            }
            else
            {
                // Two rows: Version Up full width, then p_ | x_ sharing the row.
                var top = addButtonRow();
                var bvN = top.add("button", undefined, "Version Up");
                evenWidths([bvN], 50, 30);
                bvN.onClick = doVersionUp;

                var bottom = addButtonRow();
                var bpN = bottom.add("button", undefined, "p_");
                var bxN = bottom.add("button", undefined, "x_");
                evenWidths([bpN, bxN], 50, 30);
                bpN.onClick = doPrefixP;
                bxN.onClick = doPrefixX;
            }
        }

        // ---- Find / Replace section ----
        var pnlReplace = addSection(win, "Find / Replace");
        var inputFind = addLabeledField(pnlReplace, "Replace:");
        var inputRep = addLabeledField(pnlReplace, "With:");
        var btnReplace = pnlReplace.add("button", undefined, "Replace");
        btnReplace.alignment = ["fill", "top"];

        // ---- Prefix / Suffix section ----
        var pnlPreSuf = addSection(win, "Prefix/Suffix");
        var inputPreSuf = pnlPreSuf.add("edittext", undefined, "");
        inputPreSuf.alignment = ["fill", "top"];
        inputPreSuf.minimumSize.width = 120;
        var psHolder = pnlPreSuf.add("group");
        psHolder.alignment = ["fill", "top"];
        psHolder.alignChildren = ["fill", "center"];
        psHolder.spacing = GAP;
        psHolder.margins = 0;
        var btnPrefix = psHolder.add("button", undefined, "Add Prefix");
        var btnSuffix = psHolder.add("button", undefined, "Add Suffix");
        evenWidths([btnPrefix, btnSuffix], 80, 40);

        // ---- About row ----
        var aboutRow = win.add("group");
        aboutRow.alignment = ["fill", "top"];
        aboutRow.alignChildren = ["right", "center"];
        var btnAbout = aboutRow.add("button", undefined, "About");
        btnAbout.preferredSize.width = 70;

        // ---- Responsive layout ----
        // One width threshold per section, two fixed layouts. A section is rebuilt
        // only when it crosses its threshold. On a change we recompute the section
        // panels with layout(true) so their heights follow the new row count (this
        // is what lets the groups shrink back when rows merge again), and for a
        // floating palette we drop the window to its new preferred height while
        // keeping the user's chosen width. Width-only resizes just reflow with
        // resize() so the panel stays freely resizable.
        var curQaNarrow = null;
        var curPsNarrow = null;
        var inRelayout = false;

        function relayout(w)
        {
            if (inRelayout)
            {
                return;
            }
            inRelayout = true;

            var width = w.size.width;
            var qaNarrow = width < QA_MIN;
            var psNarrow = width < PS_MIN;
            var changed = false;

            if (qaNarrow !== curQaNarrow)
            {
                buildQuick(qaNarrow);
                curQaNarrow = qaNarrow;
                changed = true;
            }

            if (psNarrow !== curPsNarrow)
            {
                psHolder.orientation = psNarrow ? "column" : "row";
                curPsNarrow = psNarrow;
                changed = true;
            }

            if (changed && (w instanceof Window))
            {
                // Recompute the whole window (correct preferred height for the new
                // row count), then keep the user's width and adopt that height.
                w.layout.layout(true);
                w.size = [width, w.size.height];
            }
            else if (changed)
            {
                // Docked panel: AE owns the frame, so just recompute the section
                // panels so their group heights collapse/expand correctly.
                pnlQuick.layout.layout(true);
                pnlPreSuf.layout.layout(true);
            }

            // Reflow positions and even fill widths into the current size.
            w.layout.resize();
            inRelayout = false;
        }

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
            var pre = inputPreSuf.text;
            if (pre === "")
            {
                alert("'Prefix/Suffix' field is empty.");
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
            var suf = inputPreSuf.text;
            if (suf === "")
            {
                alert("'Prefix/Suffix' field is empty.");
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

        // Quick Actions handlers are shared by both layout variants.
        function doVersionUp()
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

            app.beginUndoGroup("Bulk Comp Renamer: Version Up");
            for (var i = 0; i < comps.length; i++)
            {
                var oldName = comps[i].name;
                var newName = nextAvailableVersion(oldName, taken);
                comps[i].name = newName;
                delete taken[oldName];
                taken[newName] = true;
            }
            app.endUndoGroup();
        }

        function doPrefixP()
        {
            applyPrefixToggle("p_", "x_", "Bulk Comp Renamer: Add p_ Prefix");
        }

        function doPrefixX()
        {
            applyPrefixToggle("x_", "p_", "Bulk Comp Renamer: Add x_ Prefix");
        }

        btnAbout.onClick = showAbout;

        // Populate the initial (wide) layout so the first full layout sizes the
        // window to real content; relayout() then corrects it to the actual width.
        buildQuick(false);
        curQaNarrow = false;
        psHolder.orientation = "row";
        curPsNarrow = false;

        win.layout.layout(true);
        relayout(win);
        win.onResizing = win.onResize = function() { relayout(this); };
        win.onShow = function() { relayout(this); };

        return win;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window)
    {
        ui.center();
        ui.show();
    }

}
)
(this);
