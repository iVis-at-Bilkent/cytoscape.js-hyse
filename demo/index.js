document.addEventListener("DOMContentLoaded", pageLoaded);
function pageLoaded() {
    console.log("page loaded");
    //fill the experiment select box with the experiment graph names in the experiment-small-graphs folder
    var select = document.getElementById("experimentGraphs");
    var options = ["Select an experiment"];
    for (const graph in window.experimentSmallGraphs) {
        options.push(graph);
    }
    for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }


    //initialize cytoscapes
    const cy = window.cy = cytoscape({
        container: document.getElementById('cy'),
        elements: graphElements,
        wheelSensitivity: 0.2,
        style: getStyle(),
    }).on('cxttap', 'node', function (evt) {
        //display the context menu
        contextMenu.showMenuItem('add-node-to-heirarchy');
    });

    var contextMenu = cy.contextMenus({
        menuItems: [
            {
                id: 'add-node-to-heirarchy',
                content: 'Add Node to Heirarchy',
                tooltipText: 'Add Node to Heirarchy',
                selector: 'node',
                onClickFunction: function (event) {
                    //change the data of the node to be in the heirarchy i-e set isDirected to true
                    var node = event.target;
                    node.data('isDirected', 1);
                    //run the layout
                    const o = getOptions();
                    o.isForceDirected = true;
                    cy.layout(o).run();
                },  
                hasTrailingDivider: true
            }
          ]
    });



    //run cytoscape layout
    const o = getOptions();
    o.isForceDirected = true;
    cy.layout(o).run();
    //window.cy = cy;

};

function assignRandomWidthAndHeight(){
    //assign random width and height to the nodes
    cy.nodes().forEach(function(node){
        node.data('width', Math.floor(Math.random() * 80) + 20);
        node.data('height', Math.floor(Math.random() * 80) + 20);
    });
}

function getStyle(){
  return  [
            {
                selector: 'node',
                style: {
                    'width': function (ele) {
                      return ele.data('width')*1 || 30;
                    },
                    'height': function (ele) {
                      return ele.data('height')*1 || 30;
                    },
                    'background-color': '#a3a3a3',
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
            },
            //color the selected nodes
            {
              selector: ':selected',
              style: {
                "border-width": 4,
                "border-color": "rgb(1,105,217)",
                "background-color": "#2F2D2C"
              }
            },
            //color the nodes in the heirarchy
            {
                selector: 'node[isDirected = 1]',
                style: {
                    'background-color': '#eee29b',
                    'border-width': '2px',
                    'border-color': '#eee29b',
                    'label': 'data(id)'
                }
            },
            //color the selected nodes in the heirarchy
            {
                selector: 'node[isDirected = 1]:selected',
                style: {
                    'background-color': '#2F2D2C',
                    'border-width': '2px',
                    'border-color': '#2F2D2C'
                }
            },
            //color the selected edges
            {
              selector: 'edge:selected',
              style: {
                'width': 3,
                'line-color': '#2F2D2C',
              }
            },
        ];
};

function runLayout() {
  
    //get the selected experiment graph name
    var select = document.getElementById("experimentGraphs");
    var selectedGraph = select.options[select.selectedIndex].value;
    //get the selected experiment graph
    var graph = window.experimentSmallGraphs[selectedGraph];
    //set the graph elements
    if(graph != undefined){
      console.log(graph);
      loadGraphMLFromStr(graph);
    }
    
    //run cytoscape layout
    const o = getOptions();
    o.isForceDirected = true;
    o.isAnimated = false;
    cy.layout(o).run();
}

function rerun(){
    //run cytoscape layout
    const o = getOptions();
    o.isForceDirected = true;
    cy.layout(o).run();
}

function runCose(){
    //run cose-bilkent layout
    const o = getOptions();
    o.name = 'cose-bilkent';
    o.isForceDirected = true;
    cy.layout(o).run();
}

function runCoseAnimated(){
    //run cose-bilkent layout
    const o = getOptions();
    o.name = 'cose-bilkent';
    o.animate = "during";
    o.isForceDirected = true;
    o.refresh = o.ticksPerFrame;
    cy.layout(o).run();
}

function runAnimatedLayout(){
    //run cytoscape layout
    const o = getOptions();
    o.isForceDirected = true;
    o.animate = "during";
    cy.layout(o).run();
}

function addNodesToHeirarchy(){
    //get the selected nodes
    var selectedNodes = cy.$(':selected');
    //change the data of the nodes to be in the heirarchy i-e set isDirected to true
    selectedNodes.forEach(function(node){
        node.data('isDirected', 1);
    });
    //run the layout
    const o = getOptions();
    o.isForceDirected = true;
    cy.layout(o).run();
}

function reset(){
    
    //set isDirected to false for all nodes
    cy.nodes().forEach(function(node){
        node.data('isDirected', 0);
    });
    //run cytoscape layout
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

  function loadGraphMLFromStr(s) {
    cy.$().remove();
    cy.graphml({node: {
      css: false,
      data: true,
      position: true,
      discludeds: []
    },
    edge: {
      css: false,
      data: true,
      discludeds: []
    },layoutBy:'preset'});
    cy.graphml(s);
    
    cy.nodes().forEach(function(node){
        node.position({x:node.data('x')*1,y:node.data('y')*1});
    });

    
    cy.layout({name:'preset'}).run();
    console.log(getStyle());
    cy.style().fromJson(getStyle()).update();
    
    //insertDummyNodesIfNeeded();
  }

  function saveGraph() {
    const blob = new Blob([cy.graphml()], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "graph.graphml");
  }

  function saveAs(blob, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
  }

function loadGraph(){

  document.getElementById("fileInput").value = null;

  document.getElementById("fileInput").click();

  document.getElementById("fileInput").addEventListener("change", function () {
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function (progressEvent) {
      loadGraphMLFromStr(this.result);
    };
    reader.readAsText(file);
  });

}

function deleteSelected(){
  cy.$(':selected').remove();
}