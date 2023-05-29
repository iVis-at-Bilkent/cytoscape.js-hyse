import { CoSELayout,CoSEConstants,layoutBase } from 'cose-base';
import { DEFAULT_OPTIONS, Str2HySENode } from "./helper";
import { HySEEdge } from "./hyse-edge";
import { HySENode } from "./hyse-node";

export class HySELayout extends CoSELayout {
    
    LEVEL = 0;
    swapPeriod = 10;
    layering: any[][]; //  array of array of layers of cytoscape.js nodes
    orderedLayers: HySENode[][];
    id2LNode: Str2HySENode = {};
    id2TotalForceX = {};
    swapForceLimit = 1000;
    swappedPairs = {};
    banned2SwapPairs = {};
    minPairSwapPeriod = 20 * this.swapPeriod;
    orderFlipPeriod = 100;
    isFastCooling = true;
    isHighlightSwappedPair = true;
    cy: any;
    distinctColors = [ '#00c853', '#ff3d00', '#ffd600', '#76ff03', '#18ffff', '#d500f9', '#f48fb1','#2962ff'];
    cntBan4swap = 0;
    nodeRepulsionCalculationWidth = 7;
    fullyCalcRep4Ticks = 0.2;
    uniformNodeDimensions = false;
    orderGap = 80;
    expansionCoefficient = 12;
    useExpansionByStreching = true;
    edgesBetweenGraphs: HySEEdge[] = [];
    dummyCompoundNodes: HySENode[] = [];
    directedDisplacement = 0;
    undirectedDisplacement = 0;
    oldDirectedDisplacement = 0;
    oldUndirectedDisplacement = 0;
    performPostProcessing = true;
    displayInitialPositions = false;
    randomizeInitialPositions = true;
    [x: string]: any;
    constructor(layering, cy) {
        console.trace();
        super();
        super.initParameters();
        this.layering = layering;
        this.orderedLayers = [];
        const layerSizes = this.layering.map(x => x.length);
        console.log("min, max layer sizes: ", Math.min(...layerSizes), Math.max(...layerSizes));
        this.cy = cy;
    }
    

    newGraphManager() {
        return super.newGraphManager();
      }
    
      /** prepare variables
       */
      beforeLayout() {
        const maxNodeDispParam = this.maxNodeDisplacement;
        super.initSpringEmbedder();
        this.maxNodeDisplacement = maxNodeDispParam;
        this.uniformLeafNodeSizes = this.uniformNodeDimensions;
        this.useFRGridVariant = true;
        
        //console.log("beforeLayout");
        //console.log("uniformLeafNodeSizes: ", this.uniformLeafNodeSizes);
        //console.log("useFRGridVariant: ", this.useFRGridVariant);

        
        const nodes = this.graphManager.getAllNodes();
        for (let i = 0; i < nodes.length; i++) {
          this.id2LNode[nodes[i].id] = nodes[i];
        }
        //console.log("id2LNode: ", this.id2LNode);

        //this.graphManager.graphs[2].shift({x: 1000, y: 1000});

        //console.log("orderedLayers: ", this.orderedLayers);
        if(this.layering.length > 0){
          this.prepareOrderedLayers();
        }
        
    
        this.prepareCompoundNodes();

        this.dummyCompoundNodes.forEach(node => {
          this.graphManager.getRoot().add(node);
          this.graphManager.allNodes.push(node);
        });

        let graphs = this.graphManager.getGraphs();
        // for(let i = 0; i < graphs.length; i++){
        //   if(graphs[i].parent.id){
        //     //add the parent node to the root graph
        //     if(this.graphManager.getRoot() && this.graphManager.getRoot().indexOf(graphs[i].parent) == -1){
        //       this.graphManager.getRoot().add(graphs[i].parent);
        //     }
        //     //if (this.graphManager.allNodes.indexOf(graphs[i].parent) == -1){
        //       this.graphManager.allNodes.push(graphs[i].parent);
        //     //}
        //   }
        //   console.log("graphs: ", graphs[i]);
        // }

        
        let edges = this.graphManager.getAllEdges();
        for(let i = 0; i < edges.length; i++){
          let edge = edges[i];
          let source = edge.getSource();
          let target = edge.getTarget();
          if(source.owner != target.owner){
            this.edgesBetweenGraphs.push(edge);
          }
        }

        this.graphManager.getRoot().calcEstimatedSize();
        //this.calcIdealEdgeLengths();
        //this.cy.nodes().css('border-color', 'blue');
        //this.cy.nodes().css('border-width', '1px');
        //color the nodes in different graphs as different colors
        let colorIndex = 0;
        
        for(let i = 0;i<nodes.length;i++){
          let node = this.cy.getElementById(nodes[i].id);
          node.css('border-color', '#eee29b');
        }

        for(let i = 0; i < this.dummyCompoundNodes.length; i++){
          // if(!graphs[i].parent.id){
          //   continue;
          // }
          let nodes = this.dummyCompoundNodes[i].child.getNodes();
          for(let j = 0; j < nodes.length; j++){
            
            let node = this.cy.getElementById(nodes[j].id);
            node.css('border-color', this.distinctColors[colorIndex]);
            node.css('border-width', '2px');
            
            
          }
          colorIndex++;
          if(colorIndex == this.distinctColors.length){
            colorIndex = 0;
          }
        }
      }


      prepareCompoundNodes() {
        //run the depth first search to get the group of nodes
        let groups = {};
        let seeds = {};
        let visited = new Set();
        let dfs = function (node:HySENode,group) {
          if (visited.has(node)) {
            return;
          }
          visited.add(node);
          if(groups[group]===undefined){
            groups[group]=[];
          }
          groups[group].push(node);
          
          let seed:any[] = getIsDirectedNeighborNodes(node);
          if(seed.length>0){
            if(seeds[group]===undefined){
              seeds[group] = new Set();
            }
            seed.forEach((s) => {
              if(!seeds[group].has(s)){
                seeds[group].add(s);
              }
            });
            
            // seeds[group] = seed;
          }
          if(node.child){
            node.child.nodes.forEach((child) => { 
              dfs(child,group);
            });
          }
          if(node.parentId){
            let parent = node.owner.parent;
            dfs(parent,group);
          }

          node.edges.filter(x=>x.source.isDirected != 1 && x.target.isDirected != 1).forEach((edge) => {
            let otherNode = edge.source.id == node.id ? edge.target : edge.source;
            dfs(otherNode,group);
          });
          
        };

        let getIsDirectedNeighborNodes = function(node:HySENode){
          let neighbors = node.edges.filter(x=>x.source.isDirected == 1 || x.target.isDirected == 1);
          if(neighbors.length>0){
            return neighbors.map(x=>x.source.id == node.id ? x.target : x.source);
          }
          return [];
        };
        
        
        //get all blue nodes i-e non-heirachical nodes
        //excluding the ones with no children
        let nodesToVisit = this.graphManager.allNodes.filter(function (ele) {
          return ele.isDirected != 1;
        });
        //run dfs on each node
        for (let i = 0; i < nodesToVisit.length; i++) {
          let node = nodesToVisit[i];
          dfs(node,i);
        }
        
        console.log(groups);

        //display ids of nodes in each group
        // for (let i = 0; i < Object.keys(groups).length; i++) {
        //   console.log("group",i);
        //   groups[Object.keys(groups)[i]].forEach(x=>console.log(x.id));
          
        // }


        //find the most left and most right nodes in graph manager nodes
        let mostLeftNode = this.graphManager.allNodes[0];
        let mostRightNode = this.graphManager.allNodes[0];
        let mostTopNode = this.graphManager.allNodes[0];
        let mostBottomNode = this.graphManager.allNodes[0];
        let leftCompoundNodes:HySENode[] = [];
        let rightCompoundNodes:HySENode[] = [];
        let topCompoundNodes:HySENode[] = [];
        let bottomCompoundNodes:HySENode[] = [];
        

        //get the bounds of heirarchical nodes
        this.graphManager.allNodes.filter(x=>x.isDirected == 1).forEach(node => {
          if(mostLeftNode.isDirected != 1 || node.rect.x < mostLeftNode.rect.x){
            mostLeftNode = node;
          }
          if(mostRightNode.isDirected != 1 || node.rect.x + node.rect.width>mostRightNode.rect.x + mostRightNode.rect.width){
            mostRightNode = node;
          }
          if(mostTopNode.isDirected != 1 || node.rect.y < mostTopNode.rect.y){
            mostTopNode = node;
          }
          if(mostBottomNode.isDirected != 1 || node.rect.y + node.rect.height>mostBottomNode.rect.y+mostBottomNode.rect.height){
            mostBottomNode = node;
          }
        });

        //create a compound node for each group
        for (let i = 0; i < Object.keys(groups).length; i++) {
          
          let id = Object.keys(groups)[i];
          let group = groups[Object.keys(groups)[i]];

          
          //check the position of seed node and set the position of compound node accordingly
          let seedNodes = seeds[id];
            let xCenters:number[] = [];
            let yCenters:number[] = [];
            if (seedNodes == null || seedNodes.size == 0){
              //if there is disconnected graph
              yCenters.push(mostBottomNode.rect.y+mostBottomNode.rect.height);
              xCenters.push(mostRightNode.rect.x+mostRightNode.rect.width);
            }
            else{
              seedNodes.forEach(seed=>{
                xCenters.push(seed.rect.x);
                yCenters.push(seed.rect.y);
              });
            }
            
            let newGraph = this.newGraph();
            group.forEach(x=>{
              x.setRect({x:0,y:0},x.rect);
              newGraph.add(x);
            });
            newGraph.calcEstimatedSize();
            
            let points = new layoutBase.PointD(0, 0);
            let dimension = new layoutBase.DimensionD(newGraph.getEstimatedSize(),newGraph.getEstimatedSize());
            let newNode = new HySENode(this.graphManager,points,dimension,null, "compoundNode"+id,0);
            newNode.isDirected = 0;
            newNode.noOfChildren = group.length;
            this.graphManager.add(this.newGraph(), newNode);

            //get the center of seed node so that we can set the y coordinate of child nodes
            let xCenter = xCenters.reduce((a,b)=>a+b)/xCenters.length;
            let yCenter = yCenters.reduce((a,b)=>a+b)/yCenters.length;

            //find which side is the closest to the xCenter and yCenter
            let distanceUp = Math.abs(yCenter);
            let distanceDown = Math.abs(mostBottomNode.rect.y+mostBottomNode.rect.height-yCenter);
            let distanceLeft = Math.abs(xCenter);
            let distanceRight = Math.abs(mostRightNode.rect.x+mostRightNode.rect.width-xCenter);

            let min = Math.min(distanceUp,distanceDown,distanceLeft,distanceRight);
            let up = distanceUp == min?true:false;
            let left = distanceLeft == min?true:false;
            let right = distanceRight == min?true:false;
            let down = distanceDown == min?true:false;
            
            let seedCenter = new layoutBase.PointD(xCenter,yCenter);
            console.log("start");
            console.log("id",newNode.id);
            console.log("xCenters",xCenters);
            console.log("yCenters",yCenters);
            group.forEach(x=>{
              //console.log("x",x.id);
            });
            console.log("distanceUp",distanceUp);
            console.log("distanceDown",distanceDown);
            console.log("distanceLeft",distanceLeft);
            console.log("distanceRight",distanceRight);
            console.log("newNode",newNode);
            console.log("up",up);
            console.log("down",down);
            console.log("left",left);
            console.log("right",right);
            console.log("seedCenter",seedCenter);

            //place the compound node by checking with other compound nodes already placed on that side
            //when going to call recursively, we remove the compound nodes that are already checked and not colliding
            //plus we need to add some distance to the compound node when calling recursively, because if not then we'll be in an infinite loop of calling recursively
            let placeNewNode = function(newNode:HySENode,side:string,nodesToCheck:HySENode[]){
              if(side == "right"){
                //check if the node is colliding with any other node
                let colliding = false;
                let collidingNode:any = null;
                let nodesPassed:any = [];
                nodesToCheck.forEach(x=>{
                  if(newNode.rect.intersects(x.rect)){
                    if(collidingNode != null && collidingNode instanceof HySENode){
                      if(collidingNode.rect.x + collidingNode.rect.width < x.rect.x + x.rect.width){
                        collidingNode = x;
                      }
                    colliding = true;
                    }
                    else{
                      collidingNode = x;
                      colliding = true;
                    }
                  }
                  else{
                    nodesPassed.push(x);
                  }
                });
                nodesToCheck = nodesToCheck.filter(x=>!nodesPassed.includes(x));
                if(colliding && collidingNode != null){
                  newNode.setRect({x:collidingNode.rect.x + collidingNode.rect.width+50,y:seedCenter.y - (newNode.rect.height/2)},newNode.rect);
                  placeNewNode(newNode,side,nodesToCheck);
                }
                
              }
              else if(side == "left"){
                //check if the node is colliding with any other node
                let colliding = false;
                let collidingNode:any = null;
                let nodesPassed:any = [];
                nodesToCheck.forEach(x=>{
                  if(newNode.rect.intersects(x.rect)){
                    if(collidingNode != null && collidingNode instanceof HySENode){
                      if(collidingNode.rect.x > x.rect.x){
                        collidingNode = x;
                      }
                    colliding = true;
                    }
                    else{
                      collidingNode = x;
                      colliding = true;
                    }
                  }
                  else{
                    nodesPassed.push(x);
                  }
                });
                nodesToCheck = nodesToCheck.filter(x=>!nodesPassed.includes(x));
                if(colliding && collidingNode != null){
                  newNode.setRect({x:collidingNode.rect.x - newNode.rect.width -50,y:seedCenter.y - (newNode.rect.height/2)},newNode.rect);
                  placeNewNode(newNode,side,nodesToCheck);
                }
              }
              else if(side == "up"){
                //check if the node is colliding with any other node
                let colliding = false;
                let collidingNode:any = null;
                let nodesPassed:any = [];
                nodesToCheck.forEach(x=>{
                  if(newNode.rect.intersects(x.rect)){
                    if(collidingNode != null && collidingNode instanceof HySENode){
                      if(collidingNode.rect.y > x.rect.y){
                        collidingNode = x;
                      }
                    colliding = true;
                    }
                    else{
                      collidingNode = x;
                      colliding = true;
                    }
                  }
                  else{
                    nodesPassed.push(x);
                  }
                });
                //console.log("up -> nodes to check before",nodesToCheck);
                nodesToCheck = nodesToCheck.filter(x=>!nodesPassed.includes(x));
                //console.log("up -> nodes to check",nodesToCheck);
                //console.log("up -> colliding",collidingNode);
                if(colliding && collidingNode != null){
                  newNode.setRect({x:seedCenter.x - (newNode.rect.width/2),y:collidingNode.rect.y - newNode.rect.height-50},newNode.rect);
                  placeNewNode(newNode,side,nodesToCheck);
                }
              }
              else if(side == "down"){
                //check if the node is colliding with any other node
                let colliding = false;
                let collidingNode:any = null;
                let nodesPassed:any = [];
                nodesToCheck.forEach(x=>{
                  if(newNode.rect.intersects(x.rect)){
                    if(collidingNode != null && collidingNode instanceof HySENode){
                      if(collidingNode.rect.y + collidingNode.rect.height < x.rect.y + x.rect.height){
                        collidingNode = x;
                      }
                    colliding = true;
                    }
                    else{
                      collidingNode = x;
                      colliding = true;
                    }
                  }
                  else{
                    nodesPassed.push(x);
                  }
                });
                nodesToCheck = nodesToCheck.filter(x=>!nodesPassed.includes(x));
                if(colliding && collidingNode != null){
                  newNode.setRect({x:seedCenter.x - (newNode.rect.width/2),y:collidingNode.rect.y + collidingNode.rect.height +50},newNode.rect);
                  placeNewNode(newNode,side,nodesToCheck);
                }
              }
            }

            //place the compound node to the correct side of the heirarchy
            if(up){
              newNode.setRect({x:seedCenter.x - (newNode.rect.width/2),y:mostTopNode.rect.y - newNode.rect.height },newNode.rect);
              placeNewNode(newNode,"up",topCompoundNodes);
              topCompoundNodes.push(newNode);
            }
            else if(down){
              newNode.setRect({x:seedCenter.x - (newNode.rect.width/2),y:mostBottomNode.rect.y + mostBottomNode.rect.height+50 },newNode.rect);
              placeNewNode(newNode,"down",bottomCompoundNodes);
              bottomCompoundNodes.push(newNode);
            }
            else if(left){
              newNode.setRect({x:mostLeftNode.rect.x - newNode.rect.width - 50,y:seedCenter.y - (newNode.rect.height/2)},newNode.rect);
              placeNewNode(newNode,"left",leftCompoundNodes);
              leftCompoundNodes.push(newNode);
            }
            else if(right){
              newNode.setRect({x:mostRightNode.rect.x + mostRightNode.rect.width + 50,y:seedCenter.y - (newNode.rect.height/2)},newNode.rect);
              placeNewNode(newNode,"right",rightCompoundNodes);
              rightCompoundNodes.push(newNode);
            }

            //add the nodes in the group to the new node
            group.forEach(x=>{
              //get random position for the node within the compound node
              let randomChildX= 0;
              let randomChildY= 0;
              if(left && up){
                if(distanceUp < distanceLeft){
                  //up
                  if(!this.randomizeInitialPositions){
                    randomChildY = newNode.rect.y;
                    randomChildX = seedCenter.x;
                  }
                  else{
                    randomChildY =  newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height-x.rect.height-150));
                    randomChildX = newNode.rect.x + Math.floor(Math.random() * (newNode.rect.width - x.rect.width));
                  }
                }
                else{
                  //left
                  if(!this.randomizeInitialPositions){
                    randomChildX = newNode.rect.x;
                    randomChildY = seedCenter.y;
                  }
                  else{
                    randomChildX = newNode.rect.x + Math.floor(Math.random() * (newNode.rect.width - x.rect.width-150));
                    randomChildY = newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height - x.rect.height));
                  }
                }
              }
              else if(left && !up){
                if(distanceDown < distanceLeft){
                  //down
                  if(!this.randomizeInitialPositions){
                    randomChildY = newNode.rect.y;
                    randomChildX = seedCenter.x;
                  }
                  else{
                    randomChildY = newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height- x.rect.height+150));
                    randomChildX = newNode.rect.x +  Math.floor(Math.random() * (newNode.rect.width - x.rect.width));
                  }
                }
                else{
                  //left
                  if(!this.randomizeInitialPositions){
                    randomChildX = newNode.rect.x;
                    randomChildY = seedCenter.y;
                  }
                  else{
                    randomChildX = newNode.rect.x + Math.floor(Math.random() * (newNode.rect.width - x.rect.width-150));
                    randomChildY = newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height - x.rect.height));
                  }
                }
              }
              else if(!left && up){
                if(distanceUp < distanceRight){
                  //up
                  if(!this.randomizeInitialPositions){
                    randomChildY = newNode.rect.y;
                    randomChildX = seedCenter.x;
                  }
                  else{
                    randomChildY = newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height - x.rect.height-150));
                    randomChildX = newNode.rect.x + Math.floor(Math.random() * (newNode.rect.width - x.rect.width));
                  }
                }
                else{
                  //right
                  if(!this.randomizeInitialPositions){
                    randomChildX = newNode.rect.x;
                    randomChildY = seedCenter.y;
                  }
                  else{
                    randomChildX = newNode.rect.x + Math.floor(Math.random() * (newNode.rect.width - x.rect.width+150));
                    randomChildY = newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height - x.rect.height));
                  }
                }
              }
              else{
                if(distanceDown < distanceRight){
                  //down
                  if(!this.randomizeInitialPositions){
                    randomChildY = newNode.rect.y;
                    randomChildX = seedCenter.x;
                  }
                  else{
                    randomChildY = newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height - x.rect.height+150));
                    randomChildX = newNode.rect.x + Math.floor(Math.random() * (newNode.rect.width - x.rect.width));
                  }
                }
                else{
                  //right
                  if(!this.randomizeInitialPositions){
                    randomChildX = newNode.rect.x;
                    randomChildY = seedCenter.y;
                  }
                  else{
                    randomChildX = newNode.rect.x + Math.floor(Math.random() * (newNode.rect.width - x.rect.width+150));
                    randomChildY = newNode.rect.y + Math.floor(Math.random() * (newNode.rect.height - x.rect.height));
                  }
                }
              }
              
              let childpoints = new layoutBase.PointD(randomChildX, randomChildY);
              x.rect.x = randomChildX;
              x.rect.y = randomChildY;
              // x.rect.x = newNode.rect.x;
              // x.rect.y = newNode.rect.y;
              
              // x.setRect(childpoints,x.rect);
              x.parent = newNode;
              newNode.getChild().add(x);
            });
            this.dummyCompoundNodes.push(newNode);
            //newNode.child.updateBounds();
            //console.log("new Nodes",newNode);  
          
        }
        
        //update bounds for each graph in graph manager
        this.graphManager.graphs.forEach(graph=>{
          //graph.parent.updateBounds();
        });

      }

      
    
      //DEBUG CODE
      //compare the order of nodes in the same layer before and after the expansion
      //if the orders are the same, return true
      //if the orders are different, return false
      isSameOrders(prevLayer: HySENode[][], currLayer: HySENode[][]) {
        let x = true;
        let counter = 0;
        for (let i = 0; i < prevLayer.length; i++) {
          for (let j = 0; j < prevLayer[i].length; j++) {
            if (prevLayer[i][j].id != currLayer[i][j].id) {
              //console.log("flip in layer: ", i, " node: ", j);
              counter++;
              x= false;
            }
          }
        }
        //console.log("counter: ", counter);
        return x;
      }
    
      // will be called by layout-base.js
      layout() {
        
        const t1 = new Date().getTime();
        this.beforeLayout();
        
        //console.log(this.graphManager.getAllNodes());
        let layoutEnded = false;
        while (!this.displayInitialPositions && !layoutEnded) {
          layoutEnded = this.tick();
        }
        
        if(!this.displayInitialPositions && this.performPostProcessing){
          //this.postLayoutOverlapRemoval();
          this.postLayoutRepulsionPhase();
        }
        const t = (new Date().getTime() - t1);
        
        //FOR DEBUGGING
        //let beforeLayers = JSON.parse(JSON.stringify(this.orderedLayers,['id','rank','order']));;
        //console.log("beforeLayers: ", beforeLayers);
    
        // if(this.useExpansionByStreching){
        //   this.expandNodesByStreching();
        //   for(let i = 0; i < 20; i++) {
        //     //this.repelNodePostAlogo();
        //     this.moveNodes();
        //   }
        // }
        // else{
        //   this.expandNodes();
        // }
        
        
        
    
        //FOR DEBUGGING
        // let afterLayers = this.orderedLayers;
        // console.log("afterLayers: ", afterLayers);
        // if(this.isSameOrders(beforeLayers, afterLayers)) {
        //   console.log("no flip");
        // }
        // else{
        //   console.log("flip");
        // }
        
        console.log("HySE executed in", t, "ms", this.totalIterations, "/", this.maxIterations, "ticks");
        if (!window['hyseExecutionTimes']) {
          window['hyseExecutionTimes'] = [];
        }
        window['hyseExecutionTimes'].push(t);
        console.log("HyseLayout ended in ", this.totalIterations, " ticks ");
      }

      isDirectedConverged() {
        var converged;
        var oscilating = false;

        if (this.totalIterations > this.maxIterations / 3)
        {
          oscilating = Math.abs(this.totalDisplacement - this.oldTotalDisplacement) < 2;
        }

        converged = this.totalDisplacement < this.totalDisplacementThreshold*2;

        this.oldTotalDisplacement = this.totalDisplacement;
        this.oldDirectedDisplacement = this.directedDisplacement;
        this.oldUndirectedDisplacement = this.undirectedDisplacement;

        return converged || oscilating;
      }
    
      tick() {
        this.totalIterations++; // defined inside parent class
        // if (this.totalIterations > 0) {
        //   return true;
        // }
        if (this.totalIterations % CoSEConstants.CONVERGENCE_CHECK_PERIOD == 0) {
          // console.log("totalDisplacement: ", this.totalDisplacement, " coolingFactor: ", this.coolingFactor);
          
          if ((this.isDirectedConverged() ) || this.totalIterations > this.maxIterations) {
            //this.setPositionsFromLayering();
            return true;
          }
          if (this.isFastCooling) {
            this.coolingFactor = this.initialCoolingFactor * ((this.maxIterations - this.totalIterations * this.coolingCoefficient) / this.maxIterations);
          } else {
            this.coolingFactor = this.initialCoolingFactor * ((this.maxIterations - this.totalIterations) / this.maxIterations);
          }
          if (this.coolingFactor < 0) { 
            this.coolingFactor = 0;
          }
          //console.log("this.coolingFactor: ", this.coolingFactor);
        }
        this.totalDisplacement = 0; // defined inside parent class
        this.undirectedDisplacement = 0;
        this.directedDisplacement = 0;
        this.graphManager.updateBounds();
        super.calcSpringForces();
        this.calcRepulsionForces();
        this.repulsionForUndirected();
        this.swapAndFlip();
        this.moveNodes();
        
        
        return false;
      }

      postLayoutRepulsionPhase() {
        this.totalDisplacement = 0;
        this.undirectedDisplacement = 0;
        this.directedDisplacement = 0;
        for (let i = 0; i < 100; i++) {
          this.graphManager.updateBounds();
          this.calcRepulsionForces();
          this.moveNodes();
        }
        //console.log("post repulsion"+this.totalDisplacement+" displacement");
      }

      postLayoutOverlapRemoval() {
        //check all the ordered layers and see if there is any overlap between nodes
        //if there is an overlap, move the nodes away from each other
        //console.log(this.orderedLayers);
        this.orderedLayers.forEach(layer=>{
          for(let i = 0; i < layer.length-1; i++) {
            let node1 = layer[i] as HySENode;
            let node2 = layer[i+1] as HySENode;
            //get the x distance between the two nodes
            let xDistance = Math.abs(node1.getRect().getCenterX() - node2.getRect().getCenterX());
            //if distance is less than the width of the two nodes, then there is an overlap
            if(xDistance < node1.getWidth() + node2.getWidth()) {
              //console.log("overlap between nodes: ", node1.id, " and ", node2.id);
              //move the nodes away from each other
              let xMove = (node1.getWidth() + node2.getWidth() - xDistance)/2;
              //console.log("moved ", node1.id, " by ", -xMove, " and ", node2.id, " by ", xMove);
              node1.moveBy(-xMove,0);
              node2.moveBy(xMove,0);
            }
          }
        });

      }

      repulsionForUndirected(){
        // var graphs = this.graphManager.graphs as HySENode[];
        // for (var i = 0; i < graphs.length; i++) {
        //   var graph = graphs[i];
        //   var nodes = graph.nodes as HySENode[];
        //   for (var j = 0; j < nodes.length; j++) {
        //     var node = nodes[j];
        //     for (var k = j+1; k < nodes.length; k++) {
        //       var node2 = nodes[k];
        //       if (node.getOwner() != node2.getOwner()) {
        //         continue;
                
        //       }
        //       // if (node.parentId != node2.parentId) {
        //       //   continue;
        //       // }
        //       this.fdCalculateRepulsionForces(node, node2);
        //     }
        //   }
        // }

        var nodes = this.graphManager.allNodes as HySENode[];
        for (var i = 0; i < nodes.length; i++) {
          var node1 = nodes[i];
          for (var j = i+1; j < nodes.length; j++) {
            var node2 = nodes[j];
            //console.log(" node1 id: ", node1.id, " node2 id: ", node2.id);
            if (node1.getOwner() != node2.getOwner() ) {
              //console.log("not same");
              continue;
            }
            if (node1.parentId != node2.parentId) {
              continue;
            }
            //console.log("same");
            //super.calcRepulsionForce(node1, node2);
            // if(node1.id == "c_5" || node2.id == "c_5"){
            //   console.log("repulsion force");
            //   console.log("node1: ", node1.id, " node2: ", node2.id);
            // }
            
            this.fdCalculateRepulsionForces(node1, node2);
            
            // if((node1.id == "c_21" && node2.id == "c_19") || (node1.id == "c_19" && node2.id == "c_21")){
            //   console.log("node1: ", node1.id, " node2: ", node2.id, " node1.nodeRepulsionForcex: ", node1.repulsionForceX, " node2.nodeRepulsionForcex: ", node2.repulsionForceX);
            //   console.log("node1: ", node1.id, " node2: ", node2.id, " node1.nodeRepulsionForcey: ", node1.repulsionForceY, " node2.nodeRepulsionForcey: ", node2.repulsionForceY);
            // }
            // console.log("node1: ", node1.id, " node2: ", node2.id, " node1.nodeRepulsionForcex: ", node1.repulsionForceX, " node2.nodeRepulsionForcex: ", node2.repulsionForceX);
            // console.log("node1: ", node1.id, " node2: ", node2.id, " node1.nodeRepulsionForcey: ", node1.repulsionForceY, " node2.nodeRepulsionForcey: ", node2.repulsionForceY);
          }
        }


      }


      // overrides layout-base.js method
      calcSpringForce(edge: HySEEdge, idealLength: number) {
        let sourceNode = edge.getSource();
        let targetNode = edge.getTarget();
        
        //console.log("sourceNode: ", sourceNode.id, " targetNode: ", targetNode.id);
        //console.log("idealLength: ", idealLength);
        // if((sourceNode.isDirected == 1 && targetNode.isDirected == 0) || (sourceNode.isDirected == 0 && targetNode.isDirected == 1)){
        //   return;
        // }

        // if(sourceNode.isDirected != 1 && targetNode.isDirected != 1){
        //   super.calcSpringForce(edge, idealLength);
        //   return;
        // }

        // if one of the nodes has a parent, then the source node is the parent
        // if (sourceNode.parent != null) {
        //   sourceNode = sourceNode.parent;
        // }
        // if (targetNode.parent != null) {
        //   targetNode = targetNode.parent;
        // }

        // Update edge length
        if (this.uniformLeafNodeSizes && sourceNode.getChild() == null && targetNode.getChild() == null) {
          edge.updateLengthSimple();
        } else {
          edge.updateLength();
          if (edge.isOverlapingSourceAndTarget) {
            return;
          }
        }
    
        let length = edge.getLength();
        if (length == 0) {
          return;
        }
        // if(sourceNode.id == "c_5" || targetNode.id == "c_5"){
        //   console.log("edge length: ", length, " idealLength: ", idealLength);
        // }
        // Calculate spring forces
        
        if(this.totalIterations < (this.fullyCalcRep4Ticks * this.maxIterations)/2){
          return;
        }
        var letDirectedMove = true;
        if(this.totalIterations > (this.fullyCalcRep4Ticks * this.maxIterations)/100 && !(sourceNode.isDirected != 1 && targetNode.isDirected != 1)){
          if(edge.edgeElasticity > 0.20){
            edge.edgeElasticity = edge.edgeElasticity * 0.95;
          }
          letDirectedMove = false;
        }
        let springForce = edge.edgeElasticity * (length - idealLength);
        // if (springForce < 0) {
        //   console.log("repulsive spring force !");
        // }
    
        // Project force onto x and y axes
        //console.log("force: ",springForce,"length: ",edge.length, "edge.lengthX: ", edge.lengthX, " edge.lengthY: ", edge.lengthY);
        let springForceX = springForce * (edge.lengthX / length);
        let springForceY = springForce * (edge.lengthY / length);
    
        // Apply forces on the end nodes
        if(sourceNode.isDirected === 1 && targetNode.isDirected !== 1){
          if(letDirectedMove){
            sourceNode.springForceX += springForceX;
          }
        }else{
          sourceNode.springForceX += springForceX;
        }
        
        if(targetNode.isDirected === 1 && sourceNode.isDirected !== 1){
          if(letDirectedMove){
            targetNode.springForceX -= springForceX;
          }
        }
        else{
          targetNode.springForceX -= springForceX;
        }
        
        // if(sourceNode.isDirected == 1 && targetNode.isDirected == 1){
        //   sourceNode.springForceX += springForceX;
        //   targetNode.springForceX -= springForceX;
        // }
        if(sourceNode.isDirected != 1){
          //sourceNode.springForceX += springForceX;
          sourceNode.springForceY += springForceY;
        }
        if(targetNode.isDirected != 1){
          //targetNode.springForceX -= springForceX;
          targetNode.springForceY -= springForceY;
        }
        if(sourceNode.isDirected == 1 && targetNode.isDirected != 1){
          targetNode.springForceY += springForceY/1.1;
          targetNode.springForceX += springForceX/1.1;
        }
        if(sourceNode.isDirected != 1 && targetNode.isDirected == 1){
          sourceNode.springForceY -= springForceY/1.1;
          sourceNode.springForceX -= springForceX/1.1;
        }
        // if((sourceNode.id == "c_21" && targetNode.id == "c_19") || ( targetNode.id == "c_21" && sourceNode.id == "c_19")){
        //   console.log("spring force");
        //   console.log("node1: ", sourceNode.id, " node2: ", targetNode.id);
        //   console.log("springForceX: ", springForceX, " springForceY: ", springForceY);
        //   console.log("edge.lengthX: ", edge.lengthX, " edge.lengthY: ", edge.lengthY);
        //   console.log("spring force",springForce);
        //   console.log("edge Length",length);
        // }

      }
    
      // overrides layout-base.js method
      calcRepulsionForce(nodeA, nodeB) {
        let rectA = nodeA.getRect();
        let rectB = nodeB.getRect();
        let repulsionForceX;
        const c1 = rectA.getCenterX();
        const c2 = rectB.getCenterX();
        const distX = Math.abs(c1 - c2) - (rectA.width / 2 + rectB.width / 2);
    
        if (distX <= 0) { // two nodes overlap
          repulsionForceX = 2 * distX;
        } else { // no overlap
          let distanceX = -distX;
          if (this.uniformLeafNodeSizes) { // simply base repulsion on distance of node centers
            if (c2 > c1) {
              distanceX = c1 - c2;
            } else {
              distanceX = c2 - c1;
            }
          }
          // No repulsion range. FR grid variant should take care of this.
          if (Math.abs(distanceX) < layoutBase.FDLayoutConstants.MIN_REPULSION_DIST) {
            distanceX = layoutBase.IMath.sign(distanceX) * layoutBase.FDLayoutConstants.MIN_REPULSION_DIST;
          }
    
          // Here we use half of the nodes' repulsion values for backward compatibility
          repulsionForceX = -(nodeA.nodeRepulsion + nodeB.nodeRepulsion) / (distanceX * distanceX);
        }
        if (c1 < c2) {
          repulsionForceX = -repulsionForceX;
        }
        // Apply forces on the two nodes
        nodeA.repulsionForceX -= repulsionForceX;
        nodeB.repulsionForceX += repulsionForceX;
      }

      
      fdCalculateRepulsionForces(nodeA, nodeB) {
        var rectA = nodeA.getRect();
        var rectB = nodeB.getRect();
        var overlapAmount = new Array(2);
        var clipPoints = new Array(4);
        var distanceX;
        var distanceY;
        var distanceSquared;
        var distance;
        var repulsionForce;
        var repulsionForceX;
        var repulsionForceY;
      
        if (rectA.intersects(rectB))// two nodes overlap
        {
          // calculate separation amount in x and y directions
          layoutBase.IGeometry.calcSeparationAmount(rectA,
                  rectB,
                  overlapAmount,
                  layoutBase.FDLayoutConstants.DEFAULT_EDGE_LENGTH / 2.0);
      
          repulsionForceX = 2 * overlapAmount[0];
          repulsionForceY = 2 * overlapAmount[1];
          
          var childrenConstant = nodeA.noOfChildren * nodeB.noOfChildren / (nodeA.noOfChildren + nodeB.noOfChildren);
          
          // Apply forces on the two nodes
          nodeA.repulsionForceX -= childrenConstant * repulsionForceX;
          nodeA.repulsionForceY -= childrenConstant * repulsionForceY;
          nodeB.repulsionForceX += childrenConstant * repulsionForceX;
          nodeB.repulsionForceY += childrenConstant * repulsionForceY;
        }
        else// no overlap
        {
          // calculate distance
      
          if (this.uniformLeafNodeSizes &&
                  nodeA.getChild() == null && nodeB.getChild() == null)// simply base repulsion on distance of node centers
          {
            distanceX = rectB.getCenterX() - rectA.getCenterX();
            distanceY = rectB.getCenterY() - rectA.getCenterY();
          }
          else// use clipping points
          {
            layoutBase.IGeometry.getIntersection(rectA, rectB, clipPoints);
      
            distanceX = clipPoints[2] - clipPoints[0];
            distanceY = clipPoints[3] - clipPoints[1];
          }
      
          // No repulsion range. FR grid variant should take care of this.
          if (Math.abs(distanceX) < layoutBase.FDLayoutConstants.MIN_REPULSION_DIST)
          {
            distanceX = layoutBase.IMath.sign(distanceX) *
            layoutBase.FDLayoutConstants.MIN_REPULSION_DIST;
          }
      
          if (Math.abs(distanceY) < layoutBase.FDLayoutConstants.MIN_REPULSION_DIST)
          {
            distanceY = layoutBase.IMath.sign(distanceY) *
            layoutBase.FDLayoutConstants.MIN_REPULSION_DIST;
          }
      
          distanceSquared = distanceX * distanceX + distanceY * distanceY;
          distance = Math.sqrt(distanceSquared);
          
          // Here we use half of the nodes' repulsion values for backward compatibility
          repulsionForce = (nodeA.nodeRepulsion / 2 + nodeB.nodeRepulsion / 2) * nodeA.noOfChildren * nodeB.noOfChildren / distanceSquared;
      
          // Project force onto x and y axes
          repulsionForceX = repulsionForce * distanceX / distance;
          repulsionForceY = repulsionForce * distanceY / distance;
           
          // Apply forces on the two nodes    
          if(nodeA.isDirected != 1){
            nodeA.repulsionForceX -= repulsionForceX;
            nodeA.repulsionForceY -= repulsionForceY;
          }
          if(nodeB.isDirected != 1){
            nodeB.repulsionForceX += repulsionForceX;
            nodeB.repulsionForceY += repulsionForceY;
          }
        }

      }
    
      /** swap and flip the nodes to reduce crossing numbers
       */
      swapAndFlip() {
        // prepare data for swapping
        for (let id in this.id2LNode) {
          if(this.id2LNode[id].isDirected !== 1){
            continue;
          }
          if (this.id2TotalForceX[id] == undefined || this.id2TotalForceX[id] == null) {
            this.id2TotalForceX[id] = 0;
          }
          this.id2TotalForceX[id] += this.id2LNode[id].repulsionForceX + this.id2LNode[id].springForceX;
          //this.id2TotalForceX[id] += this.id2LNode[id].springForceX;
        }
        // swap the nodes
        if (this.totalIterations % this.swapPeriod == 0) {
          // this.flipOrders();
          this.swapAdjacentsIfNeed();
          for (let id in this.id2TotalForceX) {
            this.id2TotalForceX[id] = 0;
          }
        }
      }
    
      // assumes all edges in a layer is always from i to i+1 level | i is integer
      flipOrders() {
        const layers = this.orderedLayers;
        if (this.totalIterations % this.orderFlipPeriod != 0) {
          return;
        }
        for (let i = 1; i < layers.length - 1; i++) {
          const crossNum1 = this.getTotalNumCrossing(layers[i - 1], layers[i]);
          this.flipLayer(layers[i], i);
          const crossNum2 = this.getTotalNumCrossing(layers[i - 1], layers[i]);
    
          // no need to flip, so reverse back to original
          if (crossNum1 < crossNum2) {
            this.flipLayer(layers[i], i);
          } else {
            // reset for and displacement since they are flipped
            //console.log("successfull flip for crossing nums: ", crossNum1, crossNum2);
            for (let j = 0; j < layers[i].length; j++) {
              layers[i][j].resetForcesAndDisplacement();
            }
          }
        }
      }
    
      getNumCrossings(edges: HySEEdge[]): number {
        let r = 0;
        for (let i = 0; i < edges.length; i++) {
          for (let j = i + 1; j < edges.length; j++) {
            const src1x = edges[i].source.rect.x;
            const tgt1x = edges[i].target.rect.x;
            const src2x = edges[j].source.rect.x;
            const tgt2x = edges[j].target.rect.x;
    
            if ((src1x < src2x && tgt1x > tgt2x) || (src1x > src2x && tgt1x < tgt2x)) {
              r++;
            }
          }
        }
        return r;
      }
    
      getTotalNumCrossing(prevLayer: HySENode[], currLayer: HySENode[]) {
        const prev2CurrEdges = prevLayer.reduce((a, b) => a.concat(b.edges.filter(x => x.source.id == b.id)), []) as HySEEdge[];
        const cnt1 = this.getNumCrossings(prev2CurrEdges);
        const curr2NextEdges = currLayer.reduce((a, b) => a.concat(b.edges.filter(x => x.source.id == b.id)), []) as HySEEdge[];
        const cnt2 = this.getNumCrossings(curr2NextEdges);
        return cnt1 + cnt2;
      }
    
      flipLayer(layer: HySENode[], layerIdx: number) {
        let lowIdx = 0;
        let highIdx = layer.length - 1;
        while (lowIdx < highIdx) {
          const n1 = layer[lowIdx];
          const n2 = layer[highIdx];
          n1.swapPositionWith(n2, false);
          this.swapOnOrderedLayers(layerIdx, lowIdx, highIdx);
          lowIdx++;
          highIdx--;
        }
      }
    
      /** swap adjacent nodes to reduce crossings if there is a strong force
       */
      swapAdjacentsIfNeed() {
        const layers = this.orderedLayers;
        const pairs: { pairId: string, swapForce: number, layerId: number, n1: string, n2: string, order1: number, order2: number, connectedEdgeCount: number }[] = [];
        for (let i = 0; i < layers.length; i++) {
          const layerId = i;
          for (let j = 0; j < layers[i].length - 1; j++) {
            const n1 = layers[i][j].id;
            const n2 = layers[i][j + 1].id;
            const pairId = [n1, n2].sort().join('|');
            // check if swapped too recently
            if (this.swappedPairs[pairId] && (this.totalIterations - this.swappedPairs[pairId]) < this.minPairSwapPeriod) {
              continue;
            }
            const connectedEdgeCount = layers[i][j].edges.length + layers[i][j + 1].edges.length;
            const swapForce = Math.abs(this.id2TotalForceX[n1] - this.id2TotalForceX[n2]);
            if (swapForce > this.swapForceLimit) {
              pairs.push({ pairId, swapForce, layerId, n1, n2, order1: j, order2: j + 1, connectedEdgeCount })
            }
          }
        }
        pairs.sort((a, b) => { return b.swapForce - a.swapForce; }); // start swapping from the most willingly
        
        // while(pairs.length > 1) {
        //   pairs.pop();
        // }
        const connectedSwap = {};
        
        
        for (let i = 0; i < pairs.length; i++) {
          const p = pairs[i];
          const pairId = p.pairId;
          // don't let swapping the related elements
          if (connectedSwap[p.n1] || connectedSwap[p.n2]) {
            continue;
          }
    
          // const cross1 = this.countCrosses();
          this.banned2SwapPairs[pairId] = false;
          this.highlightPair(pairId, true);
          // swap if both nodes request swapping
          // console.log('swap ', pairId);
          this.id2LNode[p.n1].swapPositionWith(this.id2LNode[p.n2],false);
          this.swapOnOrderedLayers(p.layerId, p.order1, p.order2);
          this.swappedPairs[pairId] = this.totalIterations;
          this.banned2SwapPairs[pairId] = true;
          this.highlightPair(pairId, false);
    
          const e1 = this.id2LNode[p.n1].edges;
          const e2 = this.id2LNode[p.n2].edges;
          for (let i = 0; i < e1.length; i++) {
            connectedSwap[e1[i].source.id] = true;
            connectedSwap[e1[i].target.id] = true;
          }
          for (let i = 0; i < e2.length; i++) {
            connectedSwap[e2[i].source.id] = true;
            connectedSwap[e2[i].target.id] = true;
          }
          // const cross2 = this.countCrosses();
          // if (cross2 > cross1) {
          //   console.log('crosses increase!', cross1, cross2);
          // }
        }
      }
    
      /** highlight the swapped to show on animation
       * @param  {string} pairId
       * @param  {} isRemoveHighlight=false
       */
      highlightPair(pairId: string, isRemoveHighlight = false) {
        if (!this.isHighlightSwappedPair) {
          return;
        }
        const arr = pairId.split('|');
        if (!this.cy) {
          return;
        }
        const pair = this.cy.$id(arr[0]).union(this.cy.$id(arr[1]));
        if (isRemoveHighlight) {
          pair.css('border-color', '');
          pair.css('border-width', '0');
        } else {
          this.cntBan4swap++;
          pair.css('border-color', this.distinctColors[this.cntBan4swap % this.distinctColors.length]);
          pair.css('border-width', '3px');
        }
      }
    
      /** calculate repulsions only among the nodes of the same level
       */
      calcRepulsionForces() {
        if (this.totalIterations < this.fullyCalcRep4Ticks * this.maxIterations) {
          for (let i = 0; i < this.orderedLayers.length; i++) {
            const currLayer = this.orderedLayers[i];
            for (let j = 0; j < currLayer.length; j++) {
              for (let k = j + 1; k < currLayer.length; k++) {
                const n1 = currLayer[j];
                const n2 = currLayer[k];
                //if any of these is child then don't calculate repulsion
                // if (n1.isChild || n2.isChild) {
                //     continue;
                // }
                this.calcRepulsionForce(currLayer[j], currLayer[k]);
              }
            }
          }
        } else {
          for (let i = 0; i < this.orderedLayers.length; i++) {
            const currLayer = this.orderedLayers[i];
            for (let j = 0; j < currLayer.length - 1; j++) {
                let n1 = currLayer[j];
                let n2 = currLayer[j + 1];
                // if (n1.isChild || n2.isChild) {
                //     continue;
                // }
              this.calcRepulsionForce(currLayer[j], currLayer[j + 1]);
              for (let skip = 2; skip <= this.nodeRepulsionCalculationWidth; skip++) {
                if (j < currLayer.length - skip) {
                    let n3 = currLayer[j + skip];
                    if (n3.isChild) {
                        continue;
                    }
                  this.calcRepulsionForce(currLayer[j], currLayer[j + skip]);
                }
              }
            }
          }
        }
      }

    
      moveNodes() {
        const nodes = this.graphManager.allNodes as HySENode[];
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].calculateDisplacement();
          nodes[i].move();
          if(nodes[i].isDirected == 1){
            this.maintainLayers(nodes[i]);
          }
          nodes[i].resetForcesAndDisplacement();
        }
      }
    
      //this function places the nodes in layers based on their order in the layer
      expandNodes() {
        const t1 = new Date().getTime();
        const nodes = this.graphManager.allNodes.filter(x=>x.isDirected == 1) as HySENode[];
        let ranks:number[] = [];
        let rankElements = {};
        let orders:number[] = [];
    
        for (let i = 0; i < nodes.length; i++) {
          orders.push(nodes[i].order);
          if(!ranks.includes(nodes[i].rank)){
            ranks.push(nodes[i].rank);
          }
          if (rankElements[nodes[i].rank]){
            rankElements[nodes[i].rank]++;
          }
          else{
            rankElements[nodes[i].rank] = 1;
          }
        }
    
        ranks.forEach(rank => {
          let rankNodes = nodes.filter(x=>x.rank == rank);
          let mid = rankNodes.length/2;
          rankNodes.forEach(rankNode => {
            if(rankNode.order<mid){
              let distance = (rankNode.order-mid)*30;
              rankNode.moveOnXaxis(distance);
            }
            else{
              let distance = (rankNode.order-mid)*30;
              rankNode.moveOnXaxis(distance);
            }
          });
        });
        const timetaken = new Date().getTime() - t1;
        //console.log("expansion took", timetaken);
      }
    
      expandNodesByStreching() {
        const t1 = new Date().getTime();
        const nodes = this.graphManager.allNodes.filter(x=>x.isDirected==1) as HySENode[];
        var mostLeft = Math.min(...nodes.map(node => node.rect.x));
        var mostRight = Math.max(...nodes.map(node => node.rect.x + node.rect.width));
    
        var width = mostRight - mostLeft;
        var mid = mostLeft + width/2;
        var stretchFactor = this.expansionCoefficient;
        
        for (let i = 0; i < nodes.length; i++) {
          //check where the node is with respect to mid i-e left or right
          if(nodes[i].rect.x > mid){
            //calculate the distance from the middle
            let distance = nodes[i].rect.x - mid;
            //calculate the new x position
            let newX = mid + distance*stretchFactor;
            //move the node
            nodes[i].moveBy(newX-nodes[i].rect.x,0);
          }
          else{
            //calculate the distance from the middle
            let distance = mid - nodes[i].rect.x;
            //calculate the new x position
            let newX = mid - distance*stretchFactor;
            //move the node
            nodes[i].moveBy(newX-nodes[i].rect.x,0);
          }
    
        }
    
        const timetaken = new Date().getTime() - t1;
        //console.log("expansion took", timetaken);
      }
  
    
      // this method is used to override layout-base.js
      calcRepulsionRange = function () {
        // formula is 2 x (level + 1) x idealEdgeLength
        return (2 * (this.LEVEL + 1) * this.IDEAL_EDGE_LENGTH);
      };
    
      /** tries to fix node overlaps with a simple logic
       */
      private setPositionsFromLayering() {
        const layering = this.orderedLayers;
        const rankGap = 80;
        const orderGap = this.orderGap;
        const maxLayerSize = Math.max(...layering.map(x => x.length));
        const maxWidth = maxLayerSize * orderGap;
        for (let i = 0; i < layering.length; i++) {
          for (let j = 0; j < layering[i].length; j++) {
            const n = layering[i][j];
            const layerSize = layering[i].length;
            const p = { x: (maxWidth / (layerSize + 1)) * (j + 1), y: rankGap * i };
            n.setLocation(p.x, p.y);
          }
        }
      }
    
      /** Implemented only for debugging purposes
       */
      private countCrosses() {
        let cnt = 0;
        for (let i = 0; i < this.orderedLayers.length; i++) {
          let edgesOnLayer = [];
          for (let j = 0; j < this.orderedLayers[i].length; j++) {
            edgesOnLayer = edgesOnLayer.concat(this.orderedLayers[i][j].edges.filter(x => x.source.id == this.orderedLayers[i][j].id));
          }
          for (let j = 0; j < edgesOnLayer.length; j++) {
            let currE: any = edgesOnLayer[j];
            for (let k = j + 1; k < edgesOnLayer.length; k++) {
              let otherE: any = edgesOnLayer[k];
              if (currE.source.id == otherE.source.id || currE.target.id == otherE.target.id) {
                continue;
              }
              if ((currE.source.rect.x > otherE.source.rect.x && currE.target.rect.x < otherE.target.rect.x) ||
                (currE.source.rect.x < otherE.source.rect.x && currE.target.rect.x > otherE.target.rect.x)) {
                cnt++;
              }
            }
          }
        }
        return cnt;
      }
    
      /** Implemented only for debugging purposes
       */
      private isAllSorted() {
        const isSorted = true;
        for (let i = 0; i < this.orderedLayers.length; i++) {
          for (let j = 0; j < this.orderedLayers[i].length - 1; j++) {
            if (this.orderedLayers[i][j].rect.x >= this.orderedLayers[i][j + 1].rect.x) {
              return false;
            }
          }
        }
        return isSorted;
      }
    
    
      /** after a node is moved, preserve layer orders 
       * @param  {HySENode} node
       */
      private maintainLayers(node: HySENode) {
        let nextIdx = node.displacementX > 0 ? node.order + 1 : node.order - 1;
        let next = this.orderedLayers[node.layerIdx][nextIdx];
        if (node.displacementX > 0) {
          while (next && node.rect.x > next.rect.x) {
            this.swapOnOrderedLayers(node.layerIdx, nextIdx - 1, nextIdx);
            nextIdx++;
            next = this.orderedLayers[node.layerIdx][nextIdx];
          }
        } else {
          while (next && node.rect.x < next.rect.x) {
            this.swapOnOrderedLayers(node.layerIdx, nextIdx + 1, nextIdx);
            nextIdx--;
            next = this.orderedLayers[node.layerIdx][nextIdx];
          }
        }
      }
    
      /** keep layers info
      */
      private prepareOrderedLayers() {
        const mapperFn = typeof this.layering[0][0] === 'string' ? x => this.id2LNode[x] : x => this.id2LNode[x.id()] ;
        this.orderedLayers = [];
        for (let i = 0; i < this.layering.length; i++) {
          const currLayer = this.layering[i].map(mapperFn).sort((a, b) => a.rect.x - b.rect.x);
          for (let j = 0; j < currLayer.length; j++) {
            currLayer[j].layerIdx = i;
            currLayer[j].order = j;
          }
          this.orderedLayers.push(currLayer);
        }
        //console.log("ordered layers", this.orderedLayers);
      }
    
    
      /** When 2 elements are swapped, keep the layer sorted 
       * @param  {number} layerIdx
       * @param  {number} i
       * @param  {number} j
       */
      private swapOnOrderedLayers(layerIdx: number, i: number, j: number) {
        const tmp = this.orderedLayers[layerIdx][i];
        this.orderedLayers[layerIdx][i] = this.orderedLayers[layerIdx][j];
        this.orderedLayers[layerIdx][j] = tmp;
        this.orderedLayers[layerIdx][i].order = i;
        this.orderedLayers[layerIdx][j].order = j;
      }


}
