document.addEventListener("DOMContentLoaded", pageLoaded);

function setNodeRepulsionText(){
  document.getElementById("nodeRepulsionText").innerText = document.getElementById("defaultNodeRepulsion").value;
  console.log("running");
}

async function pageLoaded() {
    console.log("page loaded");
    //fill the experiment select box with the experiment graph names in the experiment-small-graphs folder
    var select = document.getElementById("experimentGraphs");
    var options = [];
    options.push("python-call-stack");
    for (let i = 1;i<7;i++){
      options.push("Sample"+i);
    }
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
    //select.remove(0);

    //var resp = await fetch('./samples/unix.graphml');
    // var resp = await fetch('./small-sized-compound/g_00200_02_compound.json');
    // var resp = await fetch('./samples/sample1.graphml');
    
    //resp = await resp.json();

    //initialize cytoscapes
    const cy = window.cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [],
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
                    rerun();
                },  
                hasTrailingDivider: true
            },
            {
              id: 'add-node-family-to-heirarchy',
              content: 'Add Node and its successors to Heirarchy',
              tooltipText: 'Add Node and its successors to Heirarchy',
              selector: 'node',
              onClickFunction: function (event) {
                  //change the data of the node to be in the heirarchy i-e set isDirected to true
                  var node = event.target;
                  node.data('isDirected', 1);
                  createRandomGraph(node.id());
              },  
              hasTrailingDivider: true
            },
            {
              id: 'add-edge-between-nodes',
              content: 'Add edge between nodes',
              tooltipText: 'Add edge between nodes',
              selector: 'node',
              onClickFunction: function (event) {
                  var targetNode = event.target;
                  var selectedNodes = cy.$('node:selected');
                  
                  if (selectedNodes.length === 2) {
                    var sourceNode = selectedNodes[0];
                    var targetNode = selectedNodes[1];
                    
                    cy.add({
                      group: 'edges',
                      data: {
                        id: sourceNode.id() + '-' + targetNode.id(),
                        source: sourceNode.id(),
                        target: targetNode.id()
                      }
                    });          
                  } 
              },  
              hasTrailingDivider: true
            },
            {
              id: 'create-a-parent-node',
              content: 'Create a parent node',
              tooltipText: 'Create a parent node',
              selector: 'node',
              onClickFunction: function (event) {
                  var selectedNodes = cy.$('node:selected');
                  selectedNodes.push(event.target);
                  var parent = cy.add({
                    group: 'nodes',
                    data: {
                      id: 'p-' + Math.floor(Math.random() * 1000),
                      parent: selectedNodes[0].parent().id(),
                      isParent: true
                    }
                  });
                  selectedNodes.move({ parent: parent.id() });
              },  
              hasTrailingDivider: true
            },
            {
              id: 'add-a-child-node',
              content: 'Add a child node',
              tooltipText: 'Add a child node',
              selector: 'node',
              onClickFunction: function (event) {
                  var parent = event.target;
                  var child = cy.add({
                    group: 'nodes',
                    data: {
                      id: 'c-' + Math.floor(Math.random() * 1000),
                      parent: parent.id()
                    }
                  });
              },  
              hasTrailingDivider: true
            },
          ]
    });

    



    
    //window.cy = cy;
    window.layvo = cy.layvo("get");

    var resp = await fetch('./samples/unix-family-tree.graphml');
    //console.log(resp.text());
    var graphText = await resp.text();
    loadGraphMLFromStr(graphText);

    // cy.nodes().forEach(function(node){
    //     node.data('isDirected', 1);
    // }
    // );
    //run cytoscape layout
    rerun();

};

function assignRandomWidthAndHeight(){
    var top = document.getElementById("maxWH").value;
    //assign random width and height to the nodes
    cy.nodes().forEach(function(node){
        node.data('width', Math.floor(Math.random() * top) + 20);
        node.data('height', Math.floor(Math.random() * top) + 20);
    });
}

function getEdgeArrowShape(edge){
  if(edge.source().data('isDirected')*1 == 1 && edge.target().data('isDirected')*1 == 1){
    return "triangle";
  }
  else{
    return "none";
  }
}

function getStyle(){
  return  [
            {
                selector: 'node',
                style: {
                    
                    'background-color': '#a3a3a3',
                    'label': node => node.data('label') ? node.data('label') : node.data('id'),
                    'text-wrap': 'wrap',
                    'width': function (ele) {
                      return ele.data('width')*1 || 30;
                    },
                    'height': function (ele) {
                      return ele.data('height')*1 || 30;
                    },
                    'text-max-width' : function(ele){
                      return 30;
                    }
                }
            },
            {
              selector: ":parent",
              css: {
                'background-opacity' : '0.2',
                //shape: 'cutrectangle',
                //shape: 'roundrectangle',
              }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    "curve-style": "bezier",
                    "target-arrow-shape": getEdgeArrowShape,
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
                selector: 'node[isDirected = 1],node[isDirected = "1"]',
                style: {
                    'background-color': '#eee29b',
                    'border-width': '2px',
                    'border-color': '#eee29b',
                    'label': node => node.data('label') ? node.data('label') : node.data('id'),
                    //"text-valign" : "center",
                    //"text-halign" : "center"
                }
            },
            //color the selected nodes in the heirarchy
            {
                selector: 'node[isDirected = 1]:selected,node[isDirected = "1"]:selected',
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

async function runLayout() {
  
    //get the selected experiment graph name
    var select = document.getElementById("experimentGraphs");
    var selectedGraph = select.options[select.selectedIndex].value;

    if(selectedGraph.startsWith("Sample")){
      var resp = await fetch('./samples/'+selectedGraph+'.graphml');
      resp = await resp.text();
      loadGraphMLFromStr(resp);
      return;
    }
    else if(select.selectedIndex < 2){
      var resp = await fetch('./samples/'+selectedGraph+'.graphml');
      resp = await resp.text();
      loadGraphMLFromStr(resp);
      return;
    }

    //get the selected experiment graph
    var graph = window.experimentSmallGraphs[selectedGraph];
    //set the graph elements
    if(graph != undefined){
      console.log(graph);
      loadGraphMLFromStr(graph);
    }
    else{
      var resp = await fetch('./small-sized-compound/g_00200_02_compound.json');
      resp = await resp.json();
      cy.elements().remove();
      cy.json({ elements: resp });
    }
    //run cytoscape layout
    rerun();
}

function rerun(){
    //run cytoscape layout
    //remove all nodes whose id starts with compound
    //cy.remove('node[id ^= "compound"]');
    let nodesLength = cy.nodes().length;
    if (nodesLength < 150) {
      var nodeRepulsion = document.getElementById("defaultNodeRepulsion").value;
      nodeRepulsion = nodeRepulsion * 0.1;
      document.getElementById("nodeRepulsion").value = nodeRepulsion;
      document.getElementById("swapForceLimit").value = 1500;
      document.getElementById("swapPeriod").value = 5;
      document.getElementById("minPairSwapPeriod").value = 5;
    }
    else{
      document.getElementById("nodeRepulsion").value = document.getElementById("defaultNodeRepulsion").value;;
      document.getElementById("swapForceLimit").value = 15000;
      document.getElementById("swapPeriod").value = 50;
      document.getElementById("minPairSwapPeriod").value = 10;
    }
      
    const o = getOptions();
    o.isForceDirected = true;
    cy.layout(o).run();
}

function runCose(){
    //run cose-bilkent layout
    const o = getOptions();
    o.name = 'fcose';
    o.isForceDirected = true;
    cy.layout(o).run();
}

function runCoseAnimated(){
    //run cose-bilkent layout
    const o = getOptions();
    o.name = 'fcose';
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

function runDagre() {
    //run dagre layout
    const o = getOptions();
    o.name = 'dagre';
      o.nodeSep = 20;
      o.edgeSep = 10;
      o.rankSep = 20;
    o.isForceDirected = false;
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
    rerun();
}

function reset(){
    
    //set isDirected to false for all nodes
    cy.nodes().forEach(function(node){
        node.data('isDirected', 0);
    });
    //run cytoscape layout
    rerun();
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
      "performPostProcessing",
      "displayInitialPositions",
      "randomizeInitialPositions",
      "useFRGridVariant",
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
    cy.style().fromJson(getStyle()).update();
    //cy.nodes('[isDirected = 1]').style({style:getStyle()}).update();

    
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

function removeLabels(){
  cy.style()
          .selector('node')
          .style({
            'label': '', // Removing the label style
          })
          .update();
}

function renderChart(results, title = null) {
  const metrics = [
    "numberOfEdgeCrosses",
    "numberOfNodeOverlaps",
    "numberOfNodeEdgeOverlaps",
    "totalArea",
    "totalEdgeLength",
    "averageEdgeLength",
    "executionTime",
  ];
  for (let i = 0; i < metrics.length; i++) {
    const ctx = addCanvas().getContext("2d");
    let labels = [];
    let directedData = [];
    let undirectedData = [];
    let directedUndirectedData = [];
    let hyseData = [];
    let dagreData = [];
    for (let g in results) {
      labels.push(g);
      directedData.push(results[g].HySE_Directed[metrics[i]]);
      undirectedData.push(results[g].HySE_Undirected[metrics[i]]);
      directedUndirectedData.push(results[g]["HySE_Directed-Undirected"][metrics[i]]);
      hyseData.push(results[g].HySE_Total[metrics[i]]);
      dagreData.push(results[g].dagre[metrics[i]]);
    }
    const fontSize = 32;
    let chartTitle = {
      display: true,
      text: title,
      font: {
        size: fontSize,
      },
    };
    if (!title) {
      chartTitle = null;
    }
    const _ = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "HySE_Total # " + metrics[i],
            data: hyseData,
            borderColor: "#0E24FF",
            backgroundColor: "#0E24FF80",
          },
          {
            label: "HySE_Directed # " + metrics[i],
            data: directedData,
            borderColor: "#FF0E9D",
            backgroundColor: "#FF0E9D80",
          },
          {
            label: "HySE_Undirected # " + metrics[i],
            data: undirectedData,
            borderColor: "#0EFF70",
            backgroundColor: "#0EFF7080",
          },
          {
            label: "HySE_Directed-Undirected # " + metrics[i],
            data: directedUndirectedData,
            borderColor: "#FFE90E",
            backgroundColor: "#FFE90E80",
          },
          {
            label: "Dagre # " + metrics[i],
            data: dagreData,
            borderDash: [5, 5],
            borderColor: "#D59A2A",
            backgroundColor: "#D59A2A",
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              font: {
                size: fontSize,
              },
            },
          },
          title: chartTitle,
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: fontSize,
              },
            },
          },
          y: {
            ticks: {
              font: {
                size: fontSize,
              },
            },
          },
        },
      },
    });
  }
}


function renderChart2(results, title = null) {
  const metrics = [
    "numberOfEdgeCrosses",
    "numberOfNodeOverlaps",
    "numberOfNodeEdgeOverlaps",
    "totalArea",
    "totalEdgeLength",
    "averageEdgeLength",
    "executionTime",
  ];
  for (let i = 0; i < metrics.length; i++) {
    const ctx = addCanvas().getContext("2d");
    let labels = [];
    let dagreData = [];
    // let fdData = [];
    for (let g in results) {
      labels.push(g);
      dagreData.push(results[g].dagre[metrics[i]]);
      // fdData.push(results[g].hyse[metrics[i]]);
    }
    const fontSize = 32;
    let chartTitle = {
      display: true,
      text: title,
      font: {
        size: fontSize,
      },
    };
    if (!title) {
      chartTitle = null;
    }
    const _ = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Dagre # " + metrics[i],
            data: dagreData,
            borderColor: "#ff0000",
            backgroundColor: "#ff000080",
          },
          // {
          //   label: "HySE_Total # " + metrics[i],
          //   data: fdData,
          //   borderColor: "#0000ff",
          //   backgroundColor: "#0000ff80",
          // },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              font: {
                size: fontSize,
              },
            },
          },
          title: chartTitle,
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: fontSize,
              },
            },
          },
          y: {
            ticks: {
              font: {
                size: fontSize,
              },
            },
          },
        },
      },
    });
  }
}


async function runExperiment() {
  const results = {};
  let cnt = 0;
  // for (let g in window.test) {
  //   cy.json({ elements: window.test });
  //   // run force directed
  //   const o = getOptions();
  //   o.isForceDirected = true;
  //   cy.layout(o).run();
  //   results[g] = { fd: window.layvo.generalProperties() };
  //   // results[g]["HySE_Total"] = layvo.generalProperties();
  //   results[g]["HySE_Total"]["executionTime"] = window.hyseExecutionTimes.pop();
  //   cnt++;
  //   if (cnt === 5) {
  //     break;
  //   }
  // }

    // var resp = await fetch('./small-sized-compound/aves-weaver-social-06_compound.json');

    let files = [
      "./small-sized-compound/g_00010_04_compound.json",
      "./small-sized-compound/g_00010_07_compound.json",
      "./small-sized-compound/g_00010_09_compound.json",
      "./small-sized-compound/g_00020_01_compound.json",
      "./small-sized-compound/g_00020_04_compound.json",
      "./small-sized-compound/g_00020_09_compound.json",
      "./small-sized-compound/g_00030_02_compound.json",
      "./small-sized-compound/g_00030_08_compound.json",
      "./small-sized-compound/g_00030_09_compound.json",
      "./small-sized-compound/g_00040_03_compound.json",
      "./small-sized-compound/g_00040_08_compound.json",
      "./small-sized-compound/g_00040_09_compound.json",
      "./small-sized-compound/g_00050_05_compound.json",
      "./small-sized-compound/g_00050_09_compound.json",
      "./small-sized-compound/g_00050_10_compound.json",
      "./small-sized-compound/g_00060_02_compound.json",
      "./small-sized-compound/g_00060_06_compound.json",
      "./small-sized-compound/g_00060_08_compound.json",
      "./small-sized-compound/g_00070_03_compound.json",
      "./small-sized-compound/g_00080_04_compound.json",
      "./small-sized-compound/g_00090_03_compound.json",
      "./small-sized-compound/g_00100_04_compound.json",
      "./small-sized-compound/g_00110_05_compound.json",
      "./small-sized-compound/g_00120_08_compound.json",
      "./small-sized-compound/g_00130_01_compound.json",
      "./small-sized-compound/g_00140_10_compound.json",
      "./small-sized-compound/g_00150_08_compound.json",
      "./small-sized-compound/g_00160_04_compound.json",
      "./small-sized-compound/g_00170_07_compound.json",
      "./small-sized-compound/g_00180_08_compound.json",
      "./small-sized-compound/g_00190_05_compound.json",
      "./small-sized-compound/g_00200_02_compound.json",
      "./small-sized-compound/g_00200_09_compound.json",
      "./small-sized-compound/g_00200_10_compound.json",
      "./medium-sized-compound/g_00500_03_compound.json",
      // "./medium-sized-compound/g_01000_01_compound.json"

    ];
    for (let i = 0; i < files.length; i++) {
      
      var prob = 1 - document.getElementById("prob").value;
      var ratio = document.getElementById("ratio").value;

      var resp = await fetch(files[i]);


      resp = await resp.json();
      cy.json({ elements: resp });
      var nodes = cy.nodes();
      
      visited = {};

      function addToHeirarchy(node,visited){
        if(visited[node.id()]){
          return;
        }
        visited[node.id()] = true;
        if(directedNodes > totalNodes * ratio){
          return;
        }
        if(totalNodes - Object.keys(visited).length  <= (totalNodes * ratio) - directedNodes){
          prob = 0;
        }
        Math.random() >= prob ? node.data('isDirected', 1) : node.data('isDirected', 0);

        if(node.data('isDirected') == 1){
          directedNodes++;
          var neighbors = node.outgoers().nodes();
          neighbors.forEach(function(neighbor){
            addToHeirarchy(neighbor,visited);
          });
        }

        

      }

      var totalNodes = nodes.length;
      var directedNodes = 0;
      // nodes.forEach(function(node){
      //   addToHeirarchy(node,visited);
      // });
      var r = Math.floor(Math.random() * totalNodes);
      addToHeirarchy(nodes[r],visited);

      console.log("directed nodes length ",cy.nodes('[isDirected = 1]').length);
      // run force directed
      rerun();
      results[i] = { fd: window.layvo.generalProperties() };
      results[i]["HySE_Total"] = layvo.generalProperties();
      results[i]["HySE_Total"]["executionTime"] = window.hyseExecutionTimes.pop();
      cnt++;
    }
    console.log(results);
    renderChart(results);
}

function addCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1224;
  canvas.height = 768;
  const body = document.getElementsByTagName("body")[0];
  body.appendChild(canvas);
  return canvas;
}


function createRandomGraph(nodeId){
  var prob = 1 - document.getElementById("prob").value;
  var ratio = document.getElementById("ratio").value;

  var nodes = cy.nodes();
      
  visited = {};

      function addToHeirarchy(node,visited){
        if(visited[node.id()]){
          return;
        }
        visited[node.id()] = true;
        if(directedNodes > totalNodes * ratio){
          return;
        }
        if(totalNodes - Object.keys(visited).length  <= (totalNodes * ratio) - directedNodes){
          prob = 0;
        }
        Math.random() >= prob ? node.data('isDirected', 1) : node.data('isDirected', 0);

        if(node.data('isDirected') == 1){
          directedNodes++;
          var neighbors = node.outgoers().nodes();
          neighbors.forEach(function(neighbor){
            addToHeirarchy(neighbor,visited);
          });
        }

        

      }

      var totalNodes = nodes.length;
      var directedNodes = 0;
      // nodes.forEach(function(node){
      //   addToHeirarchy(node,visited);
      // });
      if(nodeId == undefined){
        var r = Math.floor(Math.random() * totalNodes);
        addToHeirarchy(nodes[r],visited);
      }
      else{
        addToHeirarchy(cy.getElementById(nodeId),visited);
      }

      //check if the ratio is satisfied
      if(cy.nodes('[isDirected = 1]').length < totalNodes * ratio){
        //run bfs on the isDirected nodes and add the incoming nodes to the heirarchy until the ratio is satisfied
        var queue = [];
        var visited = {};
        var directedNodes = cy.nodes('[isDirected = 1]');
        directedNodes.forEach(function(node){
          queue.push(node);
        }
        );
        while(queue.length > 0){
          var node = queue.shift();
          if(visited[node.id()]){
            continue;
          }
          visited[node.id()] = true;
          if(cy.nodes('[isDirected = 1]').length >= totalNodes * ratio){
            break;
          }
          var neighbors = node.incomers().nodes();
          neighbors.forEach(function(neighbor){
            queue.push(neighbor);
          });
          node.data('isDirected', 1);
        }
        

      }

      //check if the ratio is satisfied
      if(cy.nodes('[isDirected = 1]').length < totalNodes * ratio){
        //run bfs on the isDirected nodes and add the incoming nodes to the heirarchy until the ratio is satisfied
        var queue = [];
        var visited = {};
        var directedNodes = cy.nodes('[isDirected = 1]');
        directedNodes.forEach(function(node){
          queue.push(node);
        }
        );
        while(queue.length > 0){
          var node = queue.shift();
          if(visited[node.id()]){
            continue;
          }
          visited[node.id()] = true;
          if(cy.nodes('[isDirected = 1]').length >= totalNodes * ratio){
            break;
          }
          var neighbors = node.neighborhood().nodes();
          neighbors.forEach(function(neighbor){
            queue.push(neighbor);
          });
          node.data('isDirected', 1);
        }
        

      }

}

function filterNodesAndEdges(){
  var queue = [];
  var visited = {};
  var visistedEdges = {};
  var directedNodes = cy.nodes('[isDirected = 1]');
  var depthThreshold = document.getElementById("depthThreshold").value;

  function runDFSonUndirectedNodes(node,edge,depth){
    console.log("visited",visited);
    
    if(visited[node.id()]){
      return;
    }
    if(depth > depthThreshold){
      return;
    }
    visited[node.id()] = true;
    if(edge != null){
      visistedEdges[edge.id()] = true;
    }
    
    var neighbors = node.neighborhood().nodes('[isDirected != 1]');
    neighbors.forEach(function(neighbor){
      var newEdge = node.edgesWith(neighbor)[0]
      runDFSonUndirectedNodes(neighbor,newEdge,depth+1);
    });
    
  }

  console.log("directed nodes",directedNodes);
  directedNodes.forEach(function(node){
    //if the node is attached to an undirected node
    if(node.neighborhood().nodes('[isDirected != 1]').length > 0){
      queue.push(node);
    }
  }
  );

  console.log("queue",queue);
  

  queue.forEach(function(node){
    runDFSonUndirectedNodes(node,null,0);
  });
  console.log("final visited",visited);

  //remove the nodes and edges that are not in the heirarchy and also not in visited
  cy.nodes().forEach(function(node){
    if(!visited[node.id()] && !node.data('isDirected') == 1){
      node.remove();
    }
  }
  );
  let edgeDU = document.getElementById("edgeDU").value;
  let edgeUU = document.getElementById("edgeUU").value;
  cy.edges().forEach(function(edge){
    if((edge.source().data('isDirected') != 1 || edge.target().data('isDirected') != 1) && !visistedEdges[edge.id()]){
      //if edge is between two undirected nodes and is not in the heirarchy
      if (edge.source().data('isDirected') != 1 && edge.target().data('isDirected') != 1){
        if ( Math.random() > edgeUU){
          edge.remove();
        }
        
      }
      else if(Math.random() > edgeDU){
        edge.remove();
      }
      
    }
  }
  );

}

function createTestGraph(){
  createRandomGraph();
  filterNodesAndEdges();
}

async function createTestGraphFromTwoGraphs(directedGraph,undirectedGraph){
  //load the first graph elements in cytoscape
  // var resp = await fetch("./Directed_Graphs/g_00060_01.json");
  var resp = await fetch(directedGraph);
  resp = await resp.json();
  cy.json({ elements: resp });
  var nodes = cy.nodes();
  nodes.forEach(function(node){
    node.data('isDirected', 1);
  }
  );
  var N = nodes.length;
  var R = document.getElementById("ratio").value;
  var M = Math.floor(N * (1-R));
  // var M = N;
  var D = document.getElementById("depthThreshold").value;
  resp = await fetch(undirectedGraph);
  resp = await resp.json();
  //add the suffix to the nodes and edges in resp
  resp.nodes.forEach(function(node){
    node.data.id = node.data.id + "_undirected";
  }
  );
  resp.edges.forEach(function(edge){
    edge.data.id = edge.data.id + "_undirected";
    edge.data.source = edge.data.source + "_undirected";
    edge.data.target = edge.data.target + "_undirected";
  }
  );

  //add the nodes and edges from the second graph
  cy.add(resp);
  
  //get a random node from the first graph
  var directedNodes = cy.nodes('[isDirected = 1]');
  var undirectedNodes = cy.nodes('[isDirected != 1]');
  
  
  internalBFS = function(){
    //run bfs on the second graph for the levels upto the depth threshold
    //keep record of the nodes in each level
    //choose a random node from last level
    //create an edge from the random node to the node in the first graph
    var queue = [];
    var visited = {};
    var level = 0;
    var undirectedNodes = cy.nodes('[isDirected != 1]');
    var random = Math.floor(Math.random() * undirectedNodes.length);
    var undirectedNode = undirectedNodes[random];
    queue.push(undirectedNode);
    queue.push(null);
    levelNodes = [];
    lastLevelNodes = [];
    
    while(queue.length > 0 && level < D && Object.keys(visited).length < M){
      lastLevelNodes = [];
      while(queue[0] != null){
        
        var node = queue.shift();
        if(visited[node.id()]){
          continue;
        }
        visited[node.id()] = true;

        //cy.add({node});
        lastLevelNodes.push(node);
        var neighbors = node.neighborhood().nodes('[isDirected != 1]');
        neighbors.forEach(function(neighbor){
          queue.push(neighbor);
        }
        );
      }
      levelNodes.push(lastLevelNodes);
      queue.shift();
      if(queue.length != 0){
        queue.push(null);
      }
      level++;
    }
    components.push(visited);
    // return Object.keys(visited)[Math.floor(Math.random()*Object.keys(visited).length)];
    return lastLevelNodes[Math.floor(Math.random()*lastLevelNodes.length)].id();
  }
  var components = [];
  var visitedNodesLength = 0;
  while(visitedNodesLength < M){
    var r = Math.floor(Math.random() * directedNodes.length);
    var directedNode = directedNodes[r];
    undirectedNodeID = internalBFS();

    //create an edge between directedNode and undirectedNode
    cy.add({data: {id: "edge_" + directedNode.id() + "_" + undirectedNodeID+"_"+Math.random(), source: directedNode.id(), target: undirectedNodeID}});
    visitedNodesLength += Object.keys(components[components.length - 1]).length;
  }

  //remove the nodes that are not in the heirarchy and also not in the visited
  cy.nodes().forEach(function(node){

    var flag = false;
    components.forEach(function(component){
      if(component[node.id()]){
        flag = true;
      }
    });
    if(!flag && !node.data('isDirected') == 1){
      node.remove();
    }
  }
  );

  cy.edges().forEach(function(edge){
    var flag = false;
    components.forEach(function(component){
      if(component[edge.source().id()] && component[edge.target().id()]){
        flag = true;
      }
    });
    if(!flag && (edge.source().data('isDirected') != 1 && edge.target().data('isDirected') != 1)){
      edge.remove();
    }
  }
  );

}


async function runExperiment2(){
  const results = {};
  let cnt = 0;
  let folder = "./Directed_Graphs/";
    let graphFiles = [
      "g_00010",
      "g_00020",
      "g_00030",
      "g_00040",
      "g_00050",
      "g_00060",
      "g_00070",
      "g_00080",
      "g_00090",
      "g_00100",
      "g_00110",
      "g_00120",
      "g_00130",
      "g_00140",
      "g_00150",
      "g_00160",
      "g_00170",
      "g_00180",
      "g_00190",
      "g_00200",
      "g_00210",
      "g_00220",
      "g_00230",
      "g_00240",
      "g_00250",
      "g_00260",
      "g_00270",
      "g_00280",
      "g_00290",
      "g_00300",
      "g_00310",
      "g_00320",
      "g_00330",
      "g_00340",
      "g_00350",
      "g_00360",
      "g_00370",
      "g_00380",
      "g_00390",
      "g_00400",
      "g_00410",
      "g_00420",
      "g_00430",
      "g_00440",
      "g_00450",
      "g_00460",
      "g_00470",
      "g_00480",
      "g_00490",
      "g_00500",
      "g_01000",
      "g_02000",
      "g_03000",
    ];

    for (let i = 0; i < graphFiles.length; i++) {

      var fileName = folder + graphFiles[i] + "_06.json";
      await createTestGraphFromTwoGraphs(fileName,fileName);
      // run force directed
      rerun();
      var nodesLength = cy.nodes().length;
      let directedEdges = [];
      let undirectedEdges = [];
      let mixedEdges = [];
      let mixedNodes = [];
      cy.edges().forEach(function(edge){
        if(edge.source().data('isDirected') == 1 && edge.target().data('isDirected') == 1){
          directedEdges.push(edge);
        }
        else if (edge.source().data('isDirected') != 1 && edge.target().data('isDirected') != 1){
          undirectedEdges.push(edge);
        }
        else{
          mixedEdges.push(edge);
          if (mixedNodes.indexOf(edge.source()) == -1){
            mixedNodes.push(edge.source());
          }
          if (mixedNodes.indexOf(edge.target()) == -1){
            mixedNodes.push(edge.target());
          }
        }
      }
      );
      results[nodesLength] = {HySE_Directed : window.layvo.generalProperties(cy.nodes('[isDirected = 1]').toArray(),directedEdges)};
      results[nodesLength]["HySE_Undirected"] = layvo.generalProperties(cy.nodes('[isDirected != 1]').toArray(),undirectedEdges);
      results[nodesLength]["HySE_Directed-Undirected"] = layvo.generalProperties(mixedNodes,mixedEdges);
      results[nodesLength]["HySE_Total"] = layvo.generalProperties();
      results[nodesLength]["HySE_Total"]["executionTime"] = window.hyseExecutionTimes.pop();
      results[nodesLength]["HySE_Directed"]["executionTime"] = results[nodesLength]["HySE_Total"]["executionTime"];
      results[nodesLength]["HySE_Undirected"]["executionTime"] = results[nodesLength]["HySE_Total"]["executionTime"];
      results[nodesLength]["HySE_Directed-Undirected"]["executionTime"] = results[nodesLength]["HySE_Total"]["executionTime"];

      var resp = await fetch(fileName);
      resp = await resp.json();
      cy.json({ elements: resp });

      const o = getOptions();
      o.name = 'dagre';
      o.nodeSep = 20;
      o.edgeSep = 10;
      o.rankSep = 20;
      let time1 = new Date();
      cy.layout(o).run();
      let time2 = new Date();
      results[nodesLength]["dagre"] = window.layvo.generalProperties();
      results[nodesLength]["dagre"]["executionTime"] = time2 - time1;

      cnt++;
    }
    console.log(results);
    //download the results as json
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results));
    var file = new Blob([JSON.stringify(results)], {type: 'application/json'});
    // var dlAnchorElem = document.getElementById('downloadAnchorElem');
    var dlAnchorElem = document.createElement('a');
    // dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.href = URL.createObjectURL(file);
    dlAnchorElem.download= "results.json";
    dlAnchorElem.click();
    
    renderChart(results);
}

async function runExperiment3(){
  
  const results = {};
  let cnt = 0;
  let folder = "./Directed_Graphs/";
    let graphFiles = [
      "g_00010",
      "g_00020",
      "g_00020",
      "g_00020",
      "g_00030",
      "g_00030",
      "g_00030",
      "g_00040",
      "g_00050",
      "g_00060",
      "g_00070",
      "g_00080",
      "g_00090",
      "g_00090",
      // "g_00100",
      // "g_00110",
      // "g_00120",
      // "g_00130",
      // "g_00140",
      // "g_00150",
      // "g_00160",
      // "g_00170",
      // "g_00180",
      // "g_00190",
      // "g_00200",
      // "g_00210",
      // "g_00220",
      // "g_00230",
      // "g_00240",
      // "g_00250",
      // "g_00260",
      // "g_00270",
      // "g_00280",
      // "g_00290",
      // "g_00300",
      // "g_00310",
      // "g_00320",
      // "g_00330",
      // "g_00340",
      // "g_00350",
      // "g_00360",
      // "g_00370",
      // "g_00380",
      // "g_00390",
      // "g_00400",
    ];



    for (let i = 0; i < graphFiles.length; i++) {

      var fileName = folder + graphFiles[i] + "_03.json";
      //run dagre and get execution time
      var resp = await fetch(fileName);
      resp = await resp.json();
      cy.json({ elements: resp });
      let nodesLength = cy.nodes().length;
      //set the node isDirected property to 1 for all nodes
      let rank = 1;
      cy.nodes().forEach(function(node){
        node.data('rank', rank);
        rank++;
      }
      );
      // run force directed
      const o = getOptions();
      o.isForceDirected = false;
      

      // o.name = 'hyse';
      // cy.layout(o).run();
      // results[i]["hyse"] = window.layvo.generalProperties();
      // results[i]["hyse"]["executionTime"] = window.hyseExecutionTimes.pop();

    }
    console.log(results);
    renderChart2(results);

}
