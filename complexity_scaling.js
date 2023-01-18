
const SKILL_LEVELS = {
    BEGINNER: 0,
    INTERMEDIATE: 1,
    EXPERT: 2
}

let skill_level = SKILL_LEVELS.BEGINNER;

/*
    access level 0:
    Purpose: Teach user step-by-step programming.
    - basic logic modules (if)
    - insect farm elements
    - insect farm functions

    access level 1:
    - text

    access level 2 (free mode):
    Purpose of free mode: General programming.
    Allows the user to build routines for the insect farm using custom functions
    - functions
*/

let categories = new Map();

class TabCategory {
    constructor(index) {
        this.id = index;
        this.DOM_element = document.getElementsByClassName("blocklyTreeRow")[index];
        this.DOM_element_default_height = this.DOM_element.style.height;
        this.visible = true;
    }

    hide = function () {
        if (this.visible) {
            this.DOM_element.style.animation = null;
            this.DOM_element.offsetHeight;
            this.DOM_element.style.animation = "fade_out .5s forwards";
            setTimeout(() => {
                this.DOM_element.style.visibility = "hidden";
                this.DOM_element.style.height = "0px";
                this.visible = false;
            }, 500);
        } else {
            this.DOM_element.style.visibility = "hidden";
            this.DOM_element.style.height = "0px";
            this.visible = false;
        }
    }

    hide_instant = function () {
        this.DOM_element.style.visibility = "hidden";
        this.DOM_element.style.height = "0px";
        this.visible = false;
    }

    show = function () {
        if (!this.visible) {
            this.DOM_element.style.visibility = "visible";
            this.DOM_element.style.height = this.DOM_element_default_height;
            this.DOM_element.style.animation = null;
            this.DOM_element.offsetHeight;
            this.DOM_element.style.animation = "fade_in .5s forwards"
            this.visible = true;
        } else {
            this.DOM_element.style.visibility = "visible";
            this.DOM_element.style.height = this.DOM_element_default_height;
            this.visible = true;
        }
    }

}


function showCat(x, s) {
    if (categories.has(x)) {
        if (s) {
            categories.get(x).show();
        } else {
            categories.get(x).hide();
        }
    }
}

function initCategories() {

    var cats = [
        ["logic", 0],
        ["loops", 1],
        ["loops2", 2],
        ["math", 3],
        ["math2", 4],
        ["text", 5],
        ["text2", 6],
        ["text3", 7],
        ["lists", 8],
        ["lists2", 9],
        ["color", 10],
        ["variables", 11],
        ["functions", 12],
        ["farm_funcs", 13],
        ["farm_funcs2", 14],
        ["farm_complex_funcs", 15],
        ["farm_elements", 16]
    ]

    cats.forEach(cat => {
        var cat_object = new TabCategory(cat[1]);
        cat_object.hide_instant();
        categories.set(cat[0], cat_object);
    });

    initializeDebugCodeGenerator();

}


function refreshCategories() {
    switch (skill_level) {
        case SKILL_LEVELS.BEGINNER:
            showCat("logic", true);
            showCat("loops", true);
            showCat("loops2", false);
            showCat("math", true);
            showCat("math2", false);
            showCat("text", true);
            showCat("text2", false);
            showCat("text3", false);
            showCat("lists", false);
            showCat("lists2", false);
            showCat("variables", true);
            showCat("functions", false);
            showCat("farm_funcs", false);
            showCat("farm_funcs2", true);
            showCat("farm_complex_funcs", false);
            break;

        case SKILL_LEVELS.INTERMEDIATE:
            showCat("logic", true)
            showCat("loops", false);
            showCat("loops2", true);
            showCat("math", false);
            showCat("math2", true);
            showCat("text", false);
            showCat("text2", true);
            showCat("text3", false);
            showCat("lists", true);
            showCat("lists2", false);
            showCat("variables", true);
            showCat("functions", false);
            showCat("farm_funcs", false);
            showCat("farm_funcs2", true);
            showCat("farm_complex_funcs", false);
            break;

        case SKILL_LEVELS.EXPERT:
            showCat("logic", true);
            showCat("loops", false);
            showCat("loops2", true);
            showCat("math", false);
            showCat("math2", true);
            showCat("text", false);
            showCat("text2", false);
            showCat("text3", true);
            showCat("lists", false);
            showCat("lists2", true);
            showCat("variables", true);
            showCat("functions", true);
            showCat("farm_funcs", false);
            showCat("farm_funcs2", true);
            showCat("farm_complex_funcs", false);
            break;
    }

    // Insect farm stuff will always be shown
    categories.get("farm_elements").show();
    categories.get("farm_complex_funcs").hide();

    // Colors are always hidden
    categories.get("color").hide();
}


function setComplexityLevel(level, intro_screen = false) {
    skill_level = level;
    refreshCategories();

    if (intro_screen) {
        removeIntroScreen();
    }
}

function removeIntroScreen() {
    var skill_level_back = document.getElementById("skill_level_selection_back");
    var skill_level = document.getElementById("skill_level_selection");

    document.body.removeChild(skill_level_back);
    document.body.removeChild(skill_level);
}