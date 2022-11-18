var origFuncs = {};

window.onload = function () {
    var toolbox = document.getElementById('toolbox');
    var blocks = toolbox.getElementsByTagName('block');
    for (var i = 0; i < blocks.length; i++) {
        var func = Blockly.Python[blocks[i].getAttribute('type')];
        origFuncs[blocks[i].getAttribute('type')] = func;
        if (typeof func === 'function') {
            Blockly.Python[blocks[i].getAttribute('type')] = withDebugCode();
        }
    }
}

function withDebugCode() {
    return function (block) {
        var code = origFuncs[block.type](block);
        if (typeof code === 'string') {
            code = (getDebugPrefix(block) + code + getDebugSuffix(block));
        }
        return code;
    }
}


function getDebugPrefix(block) {
    // Get index of block in current workspace
    var index = block.workspace.getAllBlocks().indexOf(block);
    return "\n# s: " + block.type + " at: " + index + ".\n";
}

function getDebugSuffix(block) {
    // Get index of block in current workspace
    var index = block.workspace.getAllBlocks().indexOf(block);
    return "\n# f: " + block.type + " at: " + index + ".\n";
}

function workspaceToCodeDebug(workspace) {
    if (!workspace) {
        // Backwards compatibility from before there could be multiple workspaces.
        console.warn(
            'No workspace specified in workspaceToCode call.  Guessing.');
        workspace = common.getMainWorkspace();
    }
    if (!Blockly.Python.isInitialized) {
        Blockly.Python.init(workspace);
    }
    document.getElementById("debugText1").innerHTML = "";
    let code = [];
    const blocks = workspace.getTopBlocks(true);
    for (let i = 0, block; (block = blocks[i]); i++) {



        let line = blockToCodeDebug(block);
        if (Array.isArray(line)) {
            // Value blocks return tuples of code and operator order.
            // Top-level blocks don't care about operator order.
            line = line[0];
        }
        if (line) {
            if (block.outputConnection) {
                // t block is a naked value.  Ask the language's code generator if
                // it wants to append a semicolon, or something.
                line = Blockly.Python.scrubNakedValue(line);
                if (Blockly.Python.STATEMENT_PREFIX && !block.suppressPrefixSuffix) {
                    line = Blockly.Python.injectId(Blockly.Python.STATEMENT_PREFIX, block) + line;
                }
                if (Blockly.Python.STATEMENT_SUFFIX && !block.suppressPrefixSuffix) {
                    line = line + Blockly.Python.injectId(Blockly.Python.STATEMENT_SUFFIX, block);
                }
            }
            code.push(line);
        }
    }
    code = code.join('\n');  // Blank line between each section.
    code = Blockly.Python.finish(code);
    // Final scrubbing of whitespace.
    code = code.replace(/^\s+\n/, '');
    code = code.replace(/\n\s+$/, '\n');
    code = code.replace(/[ \t]+\n/g, '\n');

    var code2 = document.getElementById("debugText1").innerHTML.replace(/^ /gm, '\u00A0');
    while (code2.match(/\u00A0 /gm)) {
        code2 = code2.replace(/\u00A0 /gm, '\u00A0\u00A0');
    }
    code2 = code2.replace(/\n/g, '<br>');

    var regex = /# s: (.+?) at: (\d+?)\./g;
    code2 = code2.replace(regex, function (match, p1, p2) {
        return "<dbb><span id='debug" + p2 + "' title='" + p1 + "' style='color: " + getColor(workspace, p1) + "' onmouseover='highlight(" + p2 + ")' onmouseout='highlight(-1)'>";
    });

    var regex2 = /# f: (.+?) at: (\d+?)\./g;
    code2 = code2.replaceAll(regex2, "</span></dbb>");

    document.getElementById("debugText1").innerHTML = code2;

    var lines = code2.split('<br>');
    var code3 = "";
    var currentBlockStack = []
    var currentBlockNames = []
    var currentLengths = []
    for (var i = 0; i < lines.length; i++) {
        var isStart = lines[i].match(/<dbb><span id='debug(\d+)' title='(.+?)'/);
        var isEnd = lines[i].match(/<\/dbb>/);
        if (isStart) {
            currentBlockStack.push(isStart[1]);
            currentBlockNames.push(isStart[2]);
            currentLengths.push(0);
        }
        if (isEnd) {
            currentBlockStack.pop();
            currentBlockNames.pop();
            currentLengths.pop();
        }
        if (currentBlockStack.length > 0 && lines[i].replace(/\u00A0/g," ").trim().length > 0) {
            if (currentLengths[currentBlockStack.length-1] == 0) {
                code3 += "<br><breakpoint style='color: black'" + currentBlockStack.length + " id='breakpoint" + currentBlockStack[currentBlockStack.length-1] + "'><span title='" + currentBlockNames[currentBlockStack.length-1] + "'  onclick='toggleBreakpoint(" + currentBlockStack[currentBlockStack.length-1] + ")' onmouseover='this.style.cursor=\"pointer\"' onmouseout='this.style.cursor=\"default\"'>\u25CF</span>";
            } else {
                code3 += "<br>";
            }
            currentLengths[currentBlockStack.length-1]++;
        } else {
            code3 += "<br>";
        }
    }
    document.getElementById("breakpoints").innerHTML = code3;

    var ll = document.getElementById("debugText1").innerHTML.split('<br>');
    var bp = document.getElementById("breakpoints").innerHTML.split('<br>');
    var newLL = [];
    var newBP = [];
    for (var i = 0; i < ll.length; i++) {
        var trimmed = ll[i].replaceAll(/\u00A0/g," ").replaceAll("&nbsp;"," ").trim();
        if (trimmed.length > 0) {
            if ((!trimmed.startsWith("<") || !trimmed.endsWith(">"))) {
                newLL.push(ll[i]);
                newBP.push(bp[i]);
            } else {
                newLL.push(ll[i].replaceAll(/\u00A0/g," ").replaceAll("&nbsp;"," ").trim() + "<nobreak>");
                newBP.push(bp[i].replaceAll(/\u00A0/g," ").replaceAll("&nbsp;"," ").trim() + "<nobreak>");
            }
        }
    }
    document.getElementById("debugText1").innerHTML = newLL.join('<br>').replaceAll(/<nobreak><br>/g,"");
    document.getElementById("breakpoints").innerHTML = newBP.join('<br>').replaceAll(/<nobreak><br>/g,"");

    renderExistingBreakpoints();

    return code;
}

var blocked = false;

function highlight(index) {
    if (blocked && index !== -1) return;
    if (index !== -1) blocked = true;
    else blocked = false;
    var workspace = Blockly.getMainWorkspace();
    var blocks = workspace.getAllBlocks();
    for (var i = blocks.length - 1; i >= 0; i--) {
        var debug = document.getElementById("debug" + i);
        if (i == index) {
            blocks[i].setHighlighted(true);
            workspace.centerOnBlock(blocks[i].id);
            if (debug) {
                debug.style.backgroundColor = brighter(blocks[i].getColour(), 2.5);
                var rect = debug.getBoundingClientRect();

                var canvas = document.getElementById("full_screen_canvas");
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.rect(rect.left - 3, rect.top - 3, rect.width + 6, rect.height + 6);
                ctx.lineWidth = 2;
                ctx.strokeStyle = brighter(blocks[i].getColour(), 1.5);
                ctx.stroke();

                var blocklyPath = document.querySelector("path[filter^='url(#blocklyEmbossFilter']");
                var blockRect = blocklyPath.getBoundingClientRect();
                blockRect.left += 3;

                ctx.beginPath();
                ctx.rect(blockRect.left - 3, blockRect.top - 3, blockRect.width + 6, blockRect.height + 6);
                ctx.stroke();

                ctx.beginPath();
                ctx.setLineDash([5, 3]);
                ctx.strokeStyle = brighter(blocks[i].getColour(), 1.5) + "20";
                ctx.moveTo(blockRect.left - 3, blockRect.top - 3);
                ctx.lineTo(rect.left - 3, rect.top - 3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(blockRect.left - 3, blockRect.top + blockRect.height + 3);
                ctx.lineTo(rect.left - 3, rect.top + rect.height + 3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(blockRect.left + blockRect.width + 3, blockRect.top - 3);
                ctx.lineTo(rect.left + rect.width + 3, rect.top - 3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(blockRect.left + blockRect.width + 3, blockRect.top + blockRect.height + 3);
                ctx.lineTo(rect.left + rect.width + 3, rect.top + rect.height + 3);
                ctx.stroke();

            }
        } else {
            if (debug) {
                debug.style.backgroundColor = "#ffffff";
            }
            blocks[i].setHighlighted(false);
        }
    }
    if (index === -1) {
        var canvas = document.getElementById("full_screen_canvas");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    workspace.render();

}

function getColor(workspace, block) {
    var blocks = workspace.getAllBlocks();
    for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].type == block) {
            return blocks[i].getColour();
        }
    }
    return "#000000";
}

function brighter(color, multiplier) {
    var r = parseInt(color.substring(1, 3), 16);
    var g = parseInt(color.substring(3, 5), 16);
    var b = parseInt(color.substring(5, 7), 16);
    r = Math.round(r * multiplier);
    g = Math.round(g * multiplier);
    b = Math.round(b * multiplier);
    if (r > 255) r = 255;
    if (g > 255) g = 255;
    if (b > 255) b = 255;
    var rr = r.toString(16);
    var gg = g.toString(16);
    var bb = b.toString(16);
    if (rr.length == 1) rr = "0" + rr;
    if (gg.length == 1) gg = "0" + gg;
    if (bb.length == 1) bb = "0" + bb;
    return "#" + rr + gg + bb;
}

var breakpoints = [];

function toggleBreakpoint(index) {
    var workspace = Blockly.getMainWorkspace();
    var blocks = workspace.getAllBlocks();
    var block = blocks[index];
    if (block) {
        if (!block.isBreakpoint) {
            block.isBreakpoint = true;
            breakpoints.push(block);
            document.getElementById("breakpoint" + index).style.color = brighter(block.getColour(), 1.5);
        } else {
            block.isBreakpoint = false;
            breakpoints.splice(breakpoints.indexOf(block), 1);
            document.getElementById("breakpoint" + index).style.color = "#000000";
        }
    }
}

function renderExistingBreakpoints() {
    var workspace = Blockly.getMainWorkspace();
    var blocks = workspace.getAllBlocks();
    for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].isBreakpoint) {
            document.getElementById("breakpoint" + i).style.color = brighter(blocks[i].getColour(), 1.5);
        }
    }
}

function blockToCodeDebug(block, opt_thisOnly) {
    if (Blockly.Python.isInitialized === false) {
        console.warn(
            'Generator init was not called before blockToCode was called.');
    }
    if (!block) {
        return '';
    }
    if (!block.isEnabled()) {
        // Skip past this block if it is disabled.
        return opt_thisOnly ? '' : Blockly.Python.blockToCode(block.getNextBlock());
    }
    if (block.isInsertionMarker()) {
        // Skip past insertion markers.
        return opt_thisOnly ? '' : Blockly.Python.blockToCode(block.getChildren(false)[0]);
    }

    const func = Blockly.Python[block.type];
    if (typeof func !== 'function') {
        throw Error(
            'Language "' + Blockly.Python.name_ + '" does not know how to generate ' +
            'code for block type "' + block.type + '".');
    }
    // First argument to func.call is the value of 'this' in the generator.
    // Prior to 24 September 2013 'this' was the only way to access the block.
    // The current preferred method of accessing the block is through the second
    // argument to func.call, which becomes the first parameter to the
    // generator.
    let code = func.call(block, block);
    if (Array.isArray(code)) {
        // Value blocks return tuples of code and operator order.
        if (!block.outputConnection) {
            throw TypeError('Expecting string from statement block: ' + block.type);
        }
        var c = [Blockly.Python.scrub_(block, code[0], opt_thisOnly), code[1]];

        document.getElementById("debugText1").innerHTML += c[0] + "<br>";
        return c;
    } else if (typeof code === 'string') {
        if (Blockly.Python.STATEMENT_PREFIX && !block.suppressPrefixSuffix) {
            code = Blockly.Python.injectId(Blockly.Python.STATEMENT_PREFIX, block) + code;
        }
        if (Blockly.Python.STATEMENT_SUFFIX && !block.suppressPrefixSuffix) {
            code = code + Blockly.Python.injectId(Blockly.Python.STATEMENT_SUFFIX, block);
        }
        var c = Blockly.Python.scrub_(block, code, opt_thisOnly);

        var currentBlock = block;

        while (currentBlock != null) {
            currentBlock = currentBlock.getNextBlock();
        }

        document.getElementById("debugText1").innerHTML += c + "<br>";

        return c;
    } else if (code === null) {
        // Block has handled code generation itself.
        return '';
    }
    throw SyntaxError('Invalid code generated: ' + code);
}

function scrollDebugText() {
    var from = document.getElementById("debugText1");
    var to = document.getElementById("breakpoints");
    to.scrollTop = from.scrollTop;
    highlight(-1);
}

function scrollBreakpoints() {
    var from = document.getElementById("breakpoints");
    var to = document.getElementById("debugText1");
    to.scrollTop = from.scrollTop;
    highlight(-1);
}