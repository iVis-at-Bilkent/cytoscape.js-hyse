document.addEventListener("DOMContentLoaded", pageLoaded);

function setNodeRepulsionText(){
  document.getElementById("nodeRepulsionText").innerText = document.getElementById("nodeRepulsion").value;
  console.log("running");
}

async function pageLoaded() {
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

    var resp = await fetch('./small-sized-compound/g_00200_02_compound.json');
    
    resp = await resp.json();

    //initialize cytoscapes
    const cy = window.cy = cytoscape({
        container: document.getElementById('cy'),
        elements: resp,
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
          }
          ]
    });

    


    //run cytoscape layout
    const o = getOptions();
    o.isForceDirected = true;
    cy.layout(o).run();
    //window.cy = cy;
    window.layvo = cy.layvo("get");

};

function assignRandomWidthAndHeight(){
    var top = document.getElementById("maxWH").value;
    //assign random width and height to the nodes
    cy.nodes().forEach(function(node){
        node.data('width', Math.floor(Math.random() * top) + 20);
        node.data('height', Math.floor(Math.random() * top) + 20);
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
                    "curve-style": "bezier",
                    "target-arrow-shape": "triangle"
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

async function runLayout() {
  
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
    else{
      var resp = await fetch('./small-sized-compound/g_00200_02_compound.json');
      resp = await resp.json();
      cy.elements().remove();
      cy.json({ elements: resp });
    }
    //run cytoscape layout
    const o = getOptions();
    o.isForceDirected = true;
    o.isAnimated = false;
    cy.layout(o).run();
}

function rerun(){
    //run cytoscape layout
    //remove all nodes whose id starts with compound
    //cy.remove('node[id ^= "compound"]');
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
      "performPostProcessing",
      "displayInitialPositions",
      "randomizeInitialPositions"
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
    let fdData = [];
    let dagreData = [];
    for (let g in results) {
      labels.push(g);
      directedData.push(results[g].Directed[metrics[i]]);
      undirectedData.push(results[g].Undirected[metrics[i]]);
      directedUndirectedData.push(results[g].DirectedUndirected[metrics[i]]);
      fdData.push(results[g].fd[metrics[i]]);
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
            label: "Directed # " + metrics[i],
            data: directedData,
            borderColor: "#ff0000",
            backgroundColor: "#ff000080",
          },
          {
            label: "Undirected # " + metrics[i],
            data: undirectedData,
            borderColor: "#00ff00",
            backgroundColor: "#00ffffff",
          },
          {
            label: "DirectedUndirected # " + metrics[i],
            data: directedUndirectedData,
            borderColor: "#ffff00",
            backgroundColor: "#00808000",
          },
          {
            label: "FD # " + metrics[i],
            data: fdData,
            borderColor: "#0000ff",
            backgroundColor: "#0000ff80",
          },
          {
            label: "Dagre # " + metrics[i],
            data: dagreData,
            borderDash: [5, 5],
            borderColor: "#aa00aa",
            backgroundColor: "#aa00aaff",
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
          //   label: "FD # " + metrics[i],
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
  //   // results[g]["fd"] = layvo.generalProperties();
  //   results[g]["fd"]["executionTime"] = window.hyseExecutionTimes.pop();
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
      const o = getOptions();
      o.isForceDirected = true;
      cy.layout(o).run();
      results[i] = { fd: window.layvo.generalProperties() };
      results[i]["fd"] = layvo.generalProperties();
      results[i]["fd"]["executionTime"] = window.hyseExecutionTimes.pop();
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
    ];

    for (let i = 0; i < graphFiles.length; i++) {

      var fileName = folder + graphFiles[i] + "_04.json";
      await createTestGraphFromTwoGraphs(fileName,fileName);
      // run force directed
      const o = getOptions();
      o.isForceDirected = true;
      cy.layout(o).run();
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
      results[nodesLength] = {Directed : window.layvo.generalProperties(cy.nodes('[isDirected = 1]').toArray(),directedEdges)};
      results[nodesLength]["Undirected"] = layvo.generalProperties(cy.nodes('[isDirected != 1]').toArray(),undirectedEdges);
      results[nodesLength]["DirectedUndirected"] = layvo.generalProperties(mixedNodes,mixedEdges);
      results[nodesLength]["fd"] = layvo.generalProperties();
      results[nodesLength]["fd"]["executionTime"] = window.hyseExecutionTimes.pop();
      results[nodesLength]["Directed"]["executionTime"] = results[nodesLength]["fd"]["executionTime"];
      results[nodesLength]["Undirected"]["executionTime"] = results[nodesLength]["fd"]["executionTime"];
      results[nodesLength]["DirectedUndirected"]["executionTime"] = results[nodesLength]["fd"]["executionTime"];

      var resp = await fetch(fileName);
      resp = await resp.json();
      cy.json({ elements: resp });

      o.name = 'dagre';
      o.nodeSep = 80;
      o.edgeSep = 10;
      o.rankSep = 80;
      let time1 = new Date();
      cy.layout(o).run();
      let time2 = new Date();
      results[nodesLength]["dagre"] = window.layvo.generalProperties();
      results[nodesLength]["dagre"]["executionTime"] = time2 - time1;

      cnt++;
    }
    console.log(results);
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
