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
    swapForceLimit = 100;
    swappedPairs = {};
    banned2SwapPairs = {};
    minPairSwapPeriod = 20 * this.swapPeriod;
    orderFlipPeriod = 100;
    isFastCooling = true;
    isHighlightSwappedPair = false;
    cy: any;
    distinctColors = ['#2962ff', '#00c853', '#ff3d00', '#ffd600', '#76ff03', '#18ffff', '#d500f9', '#f48fb1'];
    cntBan4swap = 0;
    nodeRepulsionCalculationWidth = 7;
    fullyCalcRep4Ticks = 0.2;
    uniformNodeDimensions = true;
    orderGap = 80;
    expansionCoefficient = 12;
    useExpansionByStreching = true;
    edgesBetweenGraphs: HySEEdge[] = [];

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
        this.useFRGridVariant = false;
        
        
        
        const nodes = this.graphManager.getAllNodes();
        for (let i = 0; i < nodes.length; i++) {
          this.id2LNode[nodes[i].id.id()] = nodes[i];
        }
        console.log("id2LNode: ", this.id2LNode);

        //this.graphManager.graphs[2].shift({x: 1000, y: 1000});

        console.log("orderedLayers: ", this.orderedLayers);
        if(this.layering.length > 0){
          this.prepareOrderedLayers();
        }
        
    
        this.prepareCompoundNodes();


        let graphs = this.graphManager.getGraphs();
        for(let i = 0; i < graphs.length; i++){
          if(graphs[i].parent.id){
            //add the parent node to the root graph
            this.graphManager.getRoot().add(graphs[i].parent);
            //this.graphManager.allNodes.push(graphs[i].parent);
          }
          console.log("graphs: ", graphs[i]);
        }

        
        let edges = this.graphManager.getAllEdges();
        for(let i = 0; i < edges.length; i++){
          let edge = edges[i];
          let source = edge.getSource();
          let target = edge.getTarget();
          if(source.owner != target.owner){
            this.edgesBetweenGraphs.push(edge);
          }
        }


        this.cy.nodes().css('border-color', 'blue');
        this.cy.nodes().css('border-width', '1px');
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
          
          let seed = getIsDirectedNeighborNode(node);
          if(seed!==null){
            seeds[group] = seed;
          }

          node.edges.filter(x=>x.source.isDirected == 0 && x.target.isDirected == 0).forEach((edge) => {
            let otherNode = edge.source.id == node.id ? edge.target : edge.source;
            dfs(otherNode,group);
          });
          
        };

        let getIsDirectedNeighborNode = function(node:HySENode){
          let neighbors = node.edges.filter(x=>x.source.isDirected == 1 || x.target.isDirected == 1);
          if(neighbors.length>0){
            return neighbors[0].source.id == node.id ? neighbors[0].target : neighbors[0].source;
          }
          return null;
        };
        
        
        //get all blue nodes i-e non-heirachical nodes
        //excluding the ones with no children
        let nodesToVisit = this.graphManager.allNodes.filter(function (ele) {
          return ele.isDirected === 0;
        });
        //run dfs on each node
        for (let i = 0; i < nodesToVisit.length; i++) {
          let node = nodesToVisit[i];
          dfs(node,i);
        }
        
        //console.log(groups);

        //display ids of nodes in each group
        // for (let i = 0; i < Object.keys(groups).length; i++) {
        //   console.log("group",i);
        //   groups[Object.keys(groups)[i]].forEach(x=>console.log(x.id));
          
        // }


        //find the most left and most right nodes in graph manager nodes
        let mostLeftNode = this.graphManager.allNodes[0];
        let mostRightNode = this.graphManager.allNodes[0];
        let allUndirected = true;
        if(this.orderedLayers.length > 0){
          allUndirected = false;
        }

        this.graphManager.allNodes.filter(x=>x.isDirected == 1).forEach(node => {
          console.log(node.id);
          console.log(node.getCenterX());
          if(node.getCenterX()<mostLeftNode.getCenterX()){
            mostLeftNode = node;
          }
          if(node.getCenterX()>mostRightNode.getCenterX()){
            mostRightNode = node;
          }
        });


        //create a compound node for each group
        for (let i = 0; i < Object.keys(groups).length; i++) {
          
          let id = Object.keys(groups)[i];
          let group = groups[Object.keys(groups)[i]];

          
          //check the position of seed node in layers and set the position of compound node accordingly
          if(allUndirected){
            let points = new layoutBase.PointD(0, 0);
            let dimension = new layoutBase.DimensionD(40,40);
            let newNode = new HySENode(this.graphManager,points,dimension,null, "compoundNode"+id,0);
            newNode.isDirected = 0;

            console.log("GraphManager : ",this.graphManager.graphs);
            this.graphManager.add(this.newGraph(), newNode);
            group.forEach(x=>{
              //get random position for the node within the compound node
              let randomX = Math.floor(Math.random() * 200)+100;
              let randomY = Math.floor(Math.random() * 200)+100;
              let childpoints = new layoutBase.PointD(randomX, randomY);
              x.setRect(childpoints,{width:30,height:30});
              newNode.getChild().add(x);
            });
            console.log("new Nodes",newNode);  
          }
          else{
            let seed = seeds[id];
            let seedLayer = this.orderedLayers.findIndex(x=>x.includes(seed));
            let seedIndex = this.orderedLayers[seedLayer].findIndex(x=>x.id == seed.id);
            
            let left = (seedIndex+1) <= this.orderedLayers[seedLayer].length/2?true:false;
            let up = (seedLayer+1) <= this.orderedLayers.length/2?true:false;

            
            let randomX = Math.floor(Math.random() * 200)+100;
            let randomY = Math.floor(Math.random() * 200)+100;
            let points = new layoutBase.PointD(randomX, randomY);
            let dimension = new layoutBase.DimensionD(40,40);
            let newNode = new HySENode(this.graphManager,points,dimension,null, "compoundNode"+id,0);
            newNode.isDirected = 0;

            console.log("GraphManager : ",this.graphManager.graphs);
            this.graphManager.add(this.newGraph(), newNode);

            //get the center of seed node so that we can set the y coordinate of child nodes
            let seedCenter = new layoutBase.PointD(seed.getCenterX(),seed.getCenterY());
            //add the nodes in the group to the new node
            group.forEach(x=>{
              //get random position for the node within the compound node
              let randomChildX= 0;
              let randomChildY= 0;
              if(left){
                randomChildX = mostLeftNode.getCenterX() - (newNode.rect.x - Math.floor(Math.random() * newNode.rect.width));
              }
              else{
                randomChildX = mostRightNode.getCenterX() + (newNode.rect.x + Math.floor(Math.random() * newNode.rect.width));
              }
              if(up){
                randomChildY = seedCenter.y - Math.floor(Math.random() * newNode.rect.height);
              }
              else{
                randomChildY = seedCenter.y + Math.floor(Math.random() * newNode.rect.height);
              }
              
              let childpoints = new layoutBase.PointD(randomChildX, randomChildY);
              x.setRect(childpoints,{width:30,height:30});
              newNode.getChild().add(x);
            });
            console.log("new Nodes",newNode);  
          }
          
          

          // let xDimension = newNode.getChild().calcEstimatedSize();
          // console.log("xDimension: ", xDimension);
          // newNode.setRect(points,{x:xDimension, y:xDimension});
          
          
          
        }
        
        //update bounds for each graph in graph manager
        this.graphManager.graphs.forEach(graph=>{
          graph.parent.updateBounds();
        });

        //this.graphManager.updateBounds();
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
              console.log("flip in layer: ", i, " node: ", j);
              counter++;
              x= false;
            }
          }
        }
        console.log("counter: ", counter);
        return x;
      }
    
      // will be called by layout-base.js
      layout() {
        const t1 = new Date().getTime();
        this.beforeLayout();
        console.log(this.graphManager.getAllNodes());
        let layoutEnded = false;
        while (!layoutEnded) {
          layoutEnded = this.tick();
        }
    
        //FOR DEBUGGING
        //let beforeLayers = JSON.parse(JSON.stringify(this.orderedLayers,['id','rank','order']));;
        //console.log("beforeLayers: ", beforeLayers);
    
        if(this.useExpansionByStreching){
          this.expandNodesByStreching();
          for(let i = 0; i < 20; i++) {
            this.repelNodePostAlogo();
            this.moveNodes(true);
          }
        }
        else{
          this.expandNodes();
        }
        
        
        const t = (new Date().getTime() - t1);
    
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
    
      tick() {
        this.totalIterations++; // defined inside parent class
        // if (this.totalIterations > 10) {
        //   return true;
        // }
        if (this.totalIterations % CoSEConstants.CONVERGENCE_CHECK_PERIOD == 0) {
          // console.log("totalDisplacement: ", this.totalDisplacement, " coolingFactor: ", this.coolingFactor);
          if (super.isConverged() || this.totalIterations > this.maxIterations) {
            // this.setPositionsFromLayering();
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
          // console.log("this.coolingFactor: ", this.coolingFactor);
        }
        this.totalDisplacement = 0; // defined inside parent class
        super.calcSpringForces();
        this.calcRepulsionForces();
        this.repulsionForUndirected();
        this.swapAndFlip();
        this.moveNodes();

        // this.springForCompundNodes();
        // this.repulsionForCompundNodes();
        // this.moveBiggerCompoundNodes();

        // //run the layout for compound nodes and keep the seeds nodes fixed
        // this.calculateSpringForcesForCompoundNodes();
        // this.calculateRepulsionForcesForCompoundNodes();
        // this.moveCompoundNodes();
        
        return false;
      }

      springForCompundNodes(){
        this.edgesBetweenGraphs.forEach(edge => {
          let source = edge.getSource();
          let target = edge.getTarget();
          let sourceGraph = source.getOwner();
          let targetGraph = target.getOwner();
          //add a hyse edge between the two graphs
          let hyseEdge = new HySEEdge(sourceGraph, targetGraph, "dummyEdge"+edge.id);
          this.calculateSpringForceForTier1Nodes(hyseEdge,40);
        });
      }

      repulsionForUndirected(){
        var nodes = this.graphManager.allNodes as HySENode[];
        for (var i = 0; i < nodes.length; i++) {
          var node1 = nodes[i];
          // if(node1.isDirected == 1){
          //   continue;
          // }
          for (var j = 0; j < nodes.length; j++) {
            var node2 = nodes[j];
            if(node1.id == node2.id){
              continue;
            }
            // if (node1.getOwner() != node2.getOwner()) {
            //   continue;
            // }
            super.calcRepulsionForce(node1, node2);
          }
        }
      }

      repulsionForCompundNodes(){
        let graphs = this.graphManager.getGraphs();
        
        for(let i = 0;i<graphs.length;i++){
          for(let j = 0;j<graphs.length;j++){
            if(i==j){
              continue;
            }
            let graph1 = graphs[i].parent;
            let graph2 = graphs[j].parent;
            this.calculateRepulsionForcesBetweenGraphs(graph1,graph2);
          }
        }
      }

      //calculate repulsion forces within each graph and between graphs
      calculateRepulsionForcesForCompoundNodes(){

        let graphs = this.graphManager.graphs;

        for(let i = 0; i < graphs.length; i++){
          
          let nodes = graphs[i].getNodes();
          for(let j = 0; j < nodes.length; j++){
            for(let k = 0; k < nodes.length; k++){
              if(j==k){
                continue;
              }
              let node1 = nodes[j];
              let node2 = nodes[k];
              if(node1.isDirected == 1 || node2.isDirected == 1){
                continue;
              }
              if(node1.getChild() == null && node2.getChild() == null){
                this.fdCalculateRepulsionForces(node1, node2);
              }
            }
          }
        }
      }

      //calculate repulsion forces between two nodes

      calculateRepuslionForceBetween2Children(child1: HySENode, child2: HySENode){
        let distanceX = child1.getCenterX() - child2.getCenterX();
        let distanceY = child1.getCenterY() - child2.getCenterY();
        let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        let repulsionForce = child1.nodeRepulsion * child2.nodeRepulsion / distance;
        let repulsionForceX = repulsionForce * distanceX / distance;
        let repulsionForceY = repulsionForce * distanceY / distance;
        child1.repulsionForceX += repulsionForceX;
        child1.repulsionForceY += repulsionForceY;
        child2.repulsionForceX -= repulsionForceX;
        child2.repulsionForceY -= repulsionForceY;
      }

      //calculate the spring forces for compound nodes
      calculateSpringForcesForCompoundNodes(){
        let graphs = this.graphManager.getGraphs();

        for(let i = 0; i < graphs.length; i++){
          this.calculateSpringForcesForChildren(graphs[i]);
        }
      }

      //calculate the spring forces for a child of a compound node
      calculateSpringForceForTier1Nodes(edge: HySEEdge, idealLength: number){
        var sourceNode = edge.getSource().parent;
        var targetNode = edge.getTarget().parent;

        var length;
        var springForce;
        var springForceX;
        var springForceY;

        // Update edge length
        //edge.updateLengthSimple();
        //update the edge length by the distance between the centers of the two nodes
        edge.length = Math.sqrt(Math.pow(sourceNode.getCenterX() - targetNode.getCenterX(), 2) + Math.pow(sourceNode.getCenterY() - targetNode.getCenterY(), 2));
        
        //get X and Y lengths
        edge.lengthX = targetNode.getCenterX() - sourceNode.getCenterX();
        edge.lengthY = targetNode.getCenterY() - sourceNode.getCenterY();
        
        length = edge.getLength();
        //console.log("length: ", length);
        if(length == 0)
          return;
        
        // Calculate spring forces
        springForce = edge.edgeElasticity * (length - idealLength);

        // Project force onto x and y axes
        springForceX = springForce * (edge.lengthX / length);
        springForceY = springForce * (edge.lengthY / length);


        if(sourceNode.id){
          sourceNode.springForceX += springForceX;
          sourceNode.springForceY += springForceY;
        }
        
        if(targetNode.id){
          targetNode.springForceX -= springForceX;
          targetNode.springForceY -= springForceY;
        }

      }


      //calculate the spring forces for the children of a compound node
      calculateSpringForcesForChildren(graph){
        let edges = graph.getEdges();
        
        for(let i = 0; i < edges.length; i++){
          let edge = edges[i];
          let source = edge.getSource();
          let target = edge.getTarget();
          if(source.isDirected == 1 || target.isDirected == 1){
            continue;
          }
          this.calculateSpringForceForChildren(edge, 40); 
        }
      }

      //calculate the spring forces for a child of a compound node
      calculateSpringForceForChildren(edge: HySEEdge, idealLength: number){
        var sourceNode = edge.getSource();
        var targetNode = edge.getTarget();

        var length;
        var springForce;
        var springForceX;
        var springForceY;

        // Update edge length
        if (this.uniformLeafNodeSizes &&
                sourceNode.getChild() == null && targetNode.getChild() == null)
        {
          edge.updateLengthSimple();
        }
        else
        {
          edge.updateLength();

          if (edge.isOverlapingSourceAndTarget)
          {
            return;
          }
        }

        length = edge.getLength();
        
        if(length == 0)
          return;
        
        // Calculate spring forces
        springForce = edge.edgeElasticity * (length - idealLength);

        // Project force onto x and y axes
        springForceX = springForce * (edge.lengthX / length);
        springForceY = springForce * (edge.lengthY / length);

        // Apply forces on the end nodes
        sourceNode.springForceX += springForceX;
        sourceNode.springForceY += springForceY;
        targetNode.springForceX -= springForceX;
        targetNode.springForceY -= springForceY;
      }


      // overrides layout-base.js method
      calcSpringForce(edge: HySEEdge, idealLength: number) {
        let sourceNode = edge.getSource();
        let targetNode = edge.getTarget();

        // if((sourceNode.isDirected == 1 && targetNode.isDirected == 0) || (sourceNode.isDirected == 0 && targetNode.isDirected == 1)){
        //   return;
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
        // Calculate spring forces
        let springForce = edge.edgeElasticity * (length - idealLength);
        // if (springForce < 0) {
        //   console.log("repulsive spring force !");
        // }
    
        // Project force onto x and y axes
        let springForceX = springForce * (edge.lengthX / length);
        let springForceY = springForce * (edge.lengthY / length);
    
        // Apply forces on the end nodes
        sourceNode.springForceX += springForceX;
        targetNode.springForceX -= springForceX;

        if(sourceNode.isDirected == 0){
          sourceNode.springForceY += springForceY;
        }
        if(targetNode.isDirected == 0){
          targetNode.springForceY -= springForceY;
        }


      }
    
      // overrides layout-base.js method
      calcRepulsionForce(nodeA, nodeB) {
        let rectA = nodeA.getRect();
        let rectB = nodeB.getRect();
        let repulsionForceX;
        const c1 = rectA.getCenterX();
        const c2 = rectB.getCenterX();
        const distX = Math.abs(c1 - c2) - (rectA.width / 2 + rectB.width / 2);
    
        if (distX < 0) { // two nodes overlap
          repulsionForceX = 0.5 * distX;
        } else { // no overlap
          let distanceX = -distX;
          // if (this.uniformLeafNodeSizes) { // simply base repulsion on distance of node centers
          //   if (c2 > c1) {
          //     distanceX = c1 - c2;
          //   } else {
          //     distanceX = c2 - c1;
          //   }
          // }
          // No repulsion range. FR grid variant should take care of this.
          //FDLayoutConstants.MIN_REPULSION_DIST is replaced with a constant here
          if (Math.abs(distanceX) < CoSEConstants.MIN_REPULSION_DIST) {
            distanceX = layoutBase.IMath.sign(distanceX) * 30;
          }
    
          // Here we use half of the nodes' repulsion values for backward compatibility
          // if(nodeA.nodeRepulsion == undefined){
          //   nodeA.nodeRepulsion = 500;
          // }
          // if(nodeB.nodeRepulsion == undefined){
          //   nodeB.nodeRepulsion = 500;
          // }
          repulsionForceX = -(nodeA.nodeRepulsion / 2 + nodeB.nodeRepulsion / 2) / (distanceX * distanceX);
        }
        if (c1 < c2) {
          repulsionForceX = -repulsionForceX;
        }
        // Apply forces on the two nodes
        nodeA.repulsionForceX -= repulsionForceX;
        nodeB.repulsionForceX += repulsionForceX;
      }

      calculateRepulsionForcesBetweenGraphs(nodeA,nodeB){

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
                  CoSEConstants.DEFAULT_EDGE_LENGTH / 2.0);

          repulsionForceX = 2 * overlapAmount[0];
          repulsionForceY = 2 * overlapAmount[1];
          var childrenConstant = nodeA.child.nodes.length * nodeB.child.nodes.length / (nodeA.child.nodes.length + nodeB.child.nodes.length);
          
          // Apply forces on the two nodes
          if(nodeA.id){
            nodeA.repulsionForceX -= childrenConstant * repulsionForceX;
            nodeA.repulsionForceY -= childrenConstant * repulsionForceY;
            //console.log("repulsion force on node " + nodeA.id + " is " + nodeA.repulsionForceX + " " + nodeA.repulsionForceY);
          }
          if(nodeB.id){
            nodeB.repulsionForceX += childrenConstant * repulsionForceX;
            nodeB.repulsionForceY += childrenConstant * repulsionForceY;
            //console.log("repulsion force on node " + nodeB.id + " is " + nodeB.repulsionForceX + " " + nodeB.repulsionForceY);
          }
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
          if (Math.abs(distanceX) < CoSEConstants.MIN_REPULSION_DIST)
          {
            distanceX = layoutBase.IMath.sign(distanceX) *
            CoSEConstants.MIN_REPULSION_DIST;
          }

          if (Math.abs(distanceY) < CoSEConstants.MIN_REPULSION_DIST)
          {
            distanceY = layoutBase.IMath.sign(distanceY) *
            CoSEConstants.MIN_REPULSION_DIST;
          }

          distanceSquared = distanceX * distanceX + distanceY * distanceY;
          distance = Math.sqrt(distanceSquared);
          // console.log("repulsion: " + nodeA.nodeRepulsion + " " + nodeB.nodeRepulsion);
          // Here we use half of the nodes' repulsion values for backward compatibility
          repulsionForce = (nodeA.nodeRepulsion / 2 + nodeB.nodeRepulsion / 2) * nodeA.child.nodes.length * nodeB.child.nodes.length / distanceSquared;

          // Project force onto x and y axes
          repulsionForceX = repulsionForce * distanceX / distance;
          repulsionForceY = repulsionForce * distanceY / distance;
          //console.log("repulsion: " + repulsionForceX + " " + repulsionForceY);
          // Apply forces on the two nodes    
          if(nodeA.id){
            nodeA.repulsionForceX -= repulsionForceX;
            nodeA.repulsionForceY -= repulsionForceY;
          }
          if(nodeB.id){
            nodeB.repulsionForceX += repulsionForceX;
            nodeB.repulsionForceY += repulsionForceY;
          }
        }

      }

      fdCalculateRepulsionForces(nodeA,nodeB){

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
                  CoSEConstants.DEFAULT_EDGE_LENGTH / 2.0);

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
          if (Math.abs(distanceX) < CoSEConstants.MIN_REPULSION_DIST)
          {
            distanceX = layoutBase.IMath.sign(distanceX) *
            CoSEConstants.MIN_REPULSION_DIST;
          }

          if (Math.abs(distanceY) < CoSEConstants.MIN_REPULSION_DIST)
          {
            distanceY = layoutBase.IMath.sign(distanceY) *
            CoSEConstants.MIN_REPULSION_DIST;
          }

          distanceSquared = distanceX * distanceX + distanceY * distanceY;
          distance = Math.sqrt(distanceSquared);
          // console.log("repulsion: " + nodeA.nodeRepulsion + " " + nodeB.nodeRepulsion);
          // Here we use half of the nodes' repulsion values for backward compatibility
          repulsionForce = (nodeA.nodeRepulsion / 2 + nodeB.nodeRepulsion / 2) * nodeA.noOfChildren * nodeB.noOfChildren / distanceSquared;

          // Project force onto x and y axes
          repulsionForceX = repulsionForce * distanceX / distance;
          repulsionForceY = repulsionForce * distanceY / distance;
          
          // Apply forces on the two nodes    
          nodeA.repulsionForceX -= repulsionForceX;
          nodeA.repulsionForceY -= repulsionForceY;
          nodeB.repulsionForceX += repulsionForceX;
          nodeB.repulsionForceY += repulsionForceY;
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
          // this.id2TotalForceX[id] += this.id2LNode[id].repulsionForceX + this.id2LNode[id].springForceX;
          this.id2TotalForceX[id] += this.id2LNode[id].springForceX;
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
            console.log("successfull flip for crossing nums: ", crossNum1, crossNum2);
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
          this.id2LNode[p.n1].swapPositionWith(this.id2LNode[p.n2]);
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
                if (n1.isChild || n2.isChild) {
                    continue;
                }
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
                if (n1.isChild || n2.isChild) {
                    continue;
                }
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

      moveBiggerCompoundNodes(){
        let graphs = this.graphManager.getGraphs();

        for(let i = 0;i<graphs.length;i++){
          if(graphs[i].parent.id){
            graphs[i].parent.calculateDisplacementForCompound(false);
            graphs[i].parent.moveCompound();
            graphs[i].parent.resetForcesAndDisplacement();
            graphs[i].parent.updateBounds();
          }
        }
      }

      moveCompoundNodes(){
        let graphs = this.graphManager.getGraphs();

        for (let i = 0; i < graphs.length; i++) {
          let nodes = graphs[i].getNodes();
          for (let j = 0; j < nodes.length; j++) {
            if(nodes[j].isDirected == 1){
              break;
            }
            nodes[j].calculateDisplacementForCompound(false);
            nodes[j].moveCompound();
            nodes[j].resetForcesAndDisplacement();
          }
        }
      }
    
      moveNodes(isPostProcess = false) {
        const nodes = this.graphManager.allNodes as HySENode[];
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].calculateDisplacement(isPostProcess);
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
        console.log("expansion took", timetaken);
      }
    
      expandNodesByStreching() {
        const t1 = new Date().getTime();
        const nodes = this.graphManager.allNodes as HySENode[];
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
            nodes[i].moveOnXaxis(newX-nodes[i].rect.x);
          }
          else{
            //calculate the distance from the middle
            let distance = mid - nodes[i].rect.x;
            //calculate the new x position
            let newX = mid - distance*stretchFactor;
            //move the node
            nodes[i].moveOnXaxis(newX-nodes[i].rect.x);
          }
    
        }
    
        const timetaken = new Date().getTime() - t1;
        console.log("expansion took", timetaken);
      }
    
    
      private repelNodePostAlogo(){
        for (let i = 0; i < this.orderedLayers.length; i++) {
          const currLayer = this.orderedLayers[i];
          for (let j = 0; j < currLayer.length; j++) {
            // if(j+1<currLayer.length)
            //   this.repelNodeForce(currLayer[j], currLayer[j+1]);
            // if(j-1>=0)
            //   this.repelNodeForce(currLayer[j-1], currLayer[j]);
            for (let k = j-5; k <=j+5; k++) {
              if(k>=0 && k<currLayer.length && j!=k)
                this.repelNodeForce(currLayer[j], currLayer[k]);
            }
          }
        }
        
      }
    
      private repelNodeForce(nodeA,nodeB){
        let rectA = nodeA.getRect();
        let rectB = nodeB.getRect();
        let repulsionForceX;
        const c1 = rectA.getCenterX();
        const c2 = rectB.getCenterX();
        const distX = Math.abs(c1 - c2) - (rectA.width/2 + rectB.width/2);
    
        if (distX < 0) { // two nodes overlap
          repulsionForceX = 0.5 * distX;
          let distanceX = -distX;
          repulsionForceX = -((nodeA.nodeRepulsion/3) * (nodeB.nodeRepulsion/3)) / (distanceX * distanceX);
        } else { // no overlap
          let distanceX = -distX
          if (this.uniformLeafNodeSizes) { // simply base repulsion on distance of node centers
            if (c2 > c1) {
              distanceX = c1 - c2;
            } else {
              distanceX = c2 - c1;
            }
          }
          // if(Math.abs(distanceX)>60){
          //   return;
          // }
          //console.log("distanceX", distanceX);
          // No repulsion range. FR grid variant should take care of this.
          //console.log("minDistanceX", FDLayoutConstants.MIN_REPULSION_DIST);
          // if (Math.abs(distanceX) < FDLayoutConstants.MIN_REPULSION_DIST) {
          //   distanceX = layoutBase.IMath.sign(distanceX) * FDLayoutConstants.MIN_REPULSION_DIST;
          // }
    
          // Here we use half of the nodes' repulsion values for backward compatibility
          repulsionForceX = -((nodeA.nodeRepulsion/10) + (nodeB.nodeRepulsion/10)) / (distanceX * distanceX);
          
        }
        if(Math.abs(repulsionForceX)<0.01){
          //console.log(nodeA.id+" got repulsion force less against"+ nodeB.id);
          return;
        }
        if (c1 < c2) {
          repulsionForceX = -repulsionForceX;
        }
        if(Math.abs(repulsionForceX)<0.01){
          //console.log(nodeA.id+" got repulsion force less against"+ nodeB.id);
          return;
        }
        // Apply forces on the two nodes
        nodeA.repulsionForceX -= repulsionForceX;
        nodeB.repulsionForceX += repulsionForceX;
        //console.log(nodeA.id+" got repulsion force of"+ nodeA.repulsionForceX);
        //console.log(nodeB.id+" got repulsion force of"+ nodeB.repulsionForceX);
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
        console.log("ordered layers", this.orderedLayers);
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