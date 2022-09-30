document.addEventListener("DOMContentLoaded", pageLoaded);
function pageLoaded() {
    //initialize cytoscapes
    const cy = window.cy = cytoscape({
        container: document.getElementById('cy'),
        elements: graphElements,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle'
                }
            }
        ]
    });
    //run cytoscapes cose layout
    const o = getOptions();
    o.isForceDirected = true;
    cy.layout(o).run();
    //window.cy = cy;

};

function runLayout() {
    //run cytoscapes cose layout
    const o = getOptions();
    o.isForceDirected = true;
    cy.layout(o).run();
}

function addNode(){
    //get a random number between 0 and 1000
    var random = Math.floor(Math.random() * 1000);
    //get a random number between 0 and 5
    var randomParent = Math.floor(Math.random() * 4);
    //get random positions for the new node
    var x = Math.floor(Math.random() * 1000);
    var y = Math.floor(Math.random() * 1000);
    //add the new node to the graph with data and position
    var parents = {
        0: 'a',
        1: 'b',
        2: 'c',
        3: 'd',
        4: 'e'
    }
    cy.add({
        group: "nodes",
        data: { id: random,isDirected:false, parent: parents[randomParent] },
        position: { x: x, y: y }
    });
    cy.add({
        data:{id:parents[randomParent]+'-'+random,source:parents[randomParent],target:random}
    });
    
}

function getOptions() {
    let opts = [
      "nodeSep",
      "edgeSep",
      "rankSep",
      "rankDir",
      "align",
      "acyclicer",
      "ranker",
      "animate",
      "animationDuration",
      "animationEasing",
      "zoom",
      "fit",
      "padding",
      "spacingFactor",
      "nodeDimensionsIncludeLabels",
      "ticksPerFrame",
      "isManuelRankAndOrder",
      "tickDelay",
      "idealEdgeLength",
      "swapForceLimit",
      "swapPeriod",
      "minPairSwapPeriod",
      "rankGap",
      "orderGap",
      "edgeElasticity",
      "nodeRepulsion",
      "isFastCooling",
      "coolingCoefficient",
      "orderFlipPeriod",
      "nodeRepulsionCalculationWidth",
      "fullyCalcRep4Ticks",
      "uniformNodeDimensions",
      "maxNodeDisplacement",
      "expansionCoefficient",
    ];
    const o = { name: "hyse" };
    for (let i = 0; i < opts.length; i++) {
      const el = document.getElementById(opts[i]);
      if(el!=null){
        o[opts[i]] = el.value;
        if (el.type === "checkbox") {
            o[opts[i]] = el.checked;
        }
      }
      
    }
    for (let k in o) {
      if (o[k] === "") {
        o[k] = undefined;
      } else if (o[k] === "true") {
        o[k] = true;
      } else if (o[k] === "false") {
        o[k] = false;
      } else if (isNumber(o[k])) {
        o[k] = Number(o[k]);
      }
    }
    return o;
  }

  function isNumber(value) {
    return value != null && !isNaN(Number(value.toString()));
  }