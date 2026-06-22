// ============================================================
//  prefix_p_selected_comps.jsx
//  Adds "p_" prefix to all selected compositions in the Project panel.
//
//  Rules:
//   - Already has "p_"  →  skip (no change)
//   - Already has "x_"  →  skip (no change)
//   - Auto-named "Comp N" or "Pre-Comp N"  →  "p_PreComp_NN" (zero-padded 2-digit number)
//   - Any other name  →  "p_" + original name
// ============================================================

(function prefixSelectedComps() {

    app.beginUndoGroup("Add p_ Prefix to Selected Comps");

    // ── helpers ──────────────────────────────────────────────

    /**
     * Pads a number to at least two digits.
     * @param {number} n
     * @returns {string}
     */
    function pad2(n) {
        return (n < 10) ? "0" + n : "" + n;
    }

    /**
     * Decides the new name for a composition.
     * Returns null if the comp should be skipped.
     * @param {string} name  Current comp name
     * @returns {string|null}
     */
    function newName(name) {
        // Already has p_ — leave alone
        if (name.indexOf("p_") === 0) return null;

        // Has x_ — replace it with p_
        if (name.indexOf("x_") === 0) return "p_" + name.slice(2);

        // Auto-named: "Comp N"  (After Effects default)
        var compMatch = name.match(/^Comp\s+(\d+)$/i);
        if (compMatch) {
            return "p_PreComp_" + pad2(parseInt(compMatch[1], 10));
        }

        // Auto-named: "Pre-Comp N"  (created via Pre-compose)
        var precompMatch = name.match(/^Pre-?Comp\s+(\d+)$/i);
        if (precompMatch) {
            return "p_PreComp_" + pad2(parseInt(precompMatch[1], 10));
        }

        // Everything else — just prepend
        return "p_" + name;
    }

    // ── main ─────────────────────────────────────────────────

    var project = app.project;

    if (!project) {
        alert("No project is open.", "prefix_p_selected_comps");
        app.endUndoGroup();
        return;
    }

    // Collect selected items that are CompItems
    var selectedComps = [];
    for (var i = 0; i < project.selection.length; i++) {
        var item = project.selection[i];
        if (item instanceof CompItem) {
            selectedComps.push(item);
        }
    }

    if (selectedComps.length === 0) {
        alert("No compositions are selected.\nSelect one or more comps in the Project panel and run the script again.", "prefix_p_selected_comps");
        app.endUndoGroup();
        return;
    }

    var renamed = 0;
    var skipped = 0;
    var log = [];

    for (var j = 0; j < selectedComps.length; j++) {
        var comp = selectedComps[j];
        var originalName = comp.name;
        var result = newName(originalName);

        if (result === null) {
            skipped++;
            log.push("SKIPPED  : " + originalName);
        } else {
            comp.name = result;
            renamed++;
            log.push("RENAMED  : \"" + originalName + "\"  →  \"" + result + "\"");
        }
    }

    app.endUndoGroup();

    // Summary alert
    var summary = "Done!\n\n"
        + "Renamed : " + renamed + "\n"
        + "Skipped : " + skipped + "\n\n"
        + log.join("\n");

    alert(summary, "prefix_p_selected_comps");

}());