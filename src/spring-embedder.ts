import { HySELayout } from "./hyse-layout";
import { HySENode } from "./hyse-node";
// import { layoutBase.PointD, DimensionD } from "cose-base";
import {layoutBase} from "cose-base";
import coseBase from "cose-base";
import { HySEEdge } from "./hyse-edge";
import { Str2HySENode } from "./helper";

const id2LNode: Str2HySENode = {};

export function runSpringEmbedder(g, layering: string[][], opts, cy) {

  const nodes = opts.eles.nodes();
  let filteredLayers = filterDummyNodesFromLayers(layering);
  randomizeOrderInLayers(filteredLayers);
  const l = new HySELayout(filteredLayers, cy);
  assignInitialPositions(g, filteredLayers, opts);
  l.swapPeriod = opts.swapPeriod;
  l.minPairSwapPeriod = opts.minPairSwapPeriod;
  l.isFastCooling = opts.isFastCooling;
  l.swapForceLimit = opts.swapForceLimit;
  l.coolingCoefficient = opts.coolingCoefficient;
  l.orderFlipPeriod = opts.orderFlipPeriod;
  l.nodeRepulsionCalculationWidth = opts.nodeRepulsionCalculationWidth;
  l.fullyCalcRep4Ticks = opts.fullyCalcRep4Ticks;
  l.uniformNodeDimensions = opts.uniformNodeDimensions;
  l.maxNodeDisplacement = opts.maxNodeDisplacement;
  l.expansionCoefficient = opts.expansionCoefficient;
  l.orderGap = opts.orderGap;
  l.performPostProcessing = opts.performPostProcessing;
  coseBase.CoSEConstants.TILE = false;
  console.log("opts: " ,opts);

  let gm = l.newGraphManager();

  processNodes(g, gm.addRoot(), l, opts);
  processEdges(g, gm, opts);


  if(opts.animate != "during"){
    l.runLayout();
    console.log("setting positions");
    let counter = 0;
    for (let i = 0; i < gm.getAllNodes().length; i++) {
      const n = gm.getAllNodes()[i];
      // console.log(counter++);
      if (!opts.isRelayer) {
        // console.log("setting position of "+n.id.id()+" to "+n.rect.x+","+n.rect.y);
        if(n.id instanceof Object){
          window['cy'].nodes('#' + n.id.id()).scratch("force_directed_pos", { x: n.rect.x, y: n.rect.y });
        }
        else{
          window['cy'].nodes('#' + n.id).scratch("force_directed_pos", { x: n.rect.x, y: n.rect.y });
        }
        
      }
    }
    if (opts.isRelayer) {
      layering = getNewLayeringFromForceDirected(gm, layering);
    }
  }
  else{
    runTickByTickAnimated(l,nodes,opts);
  }
  return layering;
}

function runTickByTickAnimated(layout: HySELayout, nodes, options) {
  layout.beforeLayout();
  layout.swapPeriod = options.swapPeriod;
  layout.minPairSwapPeriod = options.minPairSwapPeriod;
  layout.isFastCooling = options.isFastCooling;
  layout.swapForceLimit = options.swapForceLimit;
  layout.coolingCoefficient = options.coolingCoefficient;
  layout.orderFlipPeriod = options.orderFlipPeriod;
  layout.nodeRepulsionCalculationWidth = options.nodeRepulsionCalculationWidth;
  layout.fullyCalcRep4Ticks = options.fullyCalcRep4Ticks;
  layout.uniformNodeDimensions = options.uniformNodeDimensions;
  layout.maxNodeDisplacement = options.maxNodeDisplacement;
  layout.orderGap = options.orderGap;
  layout.performPostProcessing = options.performPostProcessing;
  const executeTickFn = () => {
    setTimeout(() => {
      let isLayoutEnded = false;
      for (let i = 0; i < options.ticksPerFrame && !isLayoutEnded; i++) {
        isLayoutEnded = layout.tick();
      }
      nodes.positions((ele) => {
        const lNode = id2LNode[ele.id()]
        return {
          x: lNode.getRect().x,
          y: lNode.getRect().y
        };
      });
      if (!isLayoutEnded) {
        requestAnimationFrame(executeTickFn);
      } else {
        console.log("Ended in ", layout.totalIterations, " ticks ");
        if (options.stop && typeof options.stop == "function") {
          options.stop();
        }
      }
    }, options.tickDelay);
  };

  requestAnimationFrame(executeTickFn);
}

function getNewLayeringFromForceDirected(gm, layering) {
  let newLayering: any[] = [];
  for (let i = 0; i < layering.length; i++) {
    const layer = gm.allNodes.filter(x => x.rank == i).sort((a, b) => a.rect.x - b.rect.x).map(x => x.id);
    newLayering.push(layer);
  }
  return newLayering
}

function assignInitialPositions(g, layering, opts) {
  const rankGap = opts.rankGap;
  const orderGap = opts.orderGap;
  const maxLayerSize = Math.max(...layering.map(x => x.length));
  const maxWidth = maxLayerSize * orderGap;
  for (let i = 0; i < layering.length; i++) {
    for (let j = 0; j < layering[i].length; j++) {
      const n = g.node(layering[i][j]);
      const layerSize = layering[i].length;
      n.x = (maxWidth / (layerSize + 1)) * (j + 1);
      n.y = rankGap * i;
    }
  }
}

function addChildren(g, parent, layout, opts ,nodesVisited,node,hyseParent) {

  for(let i =0;i<node.children().length;i ++){
    let n = node.children()[i];
    if(nodesVisited.includes(n.id())){
      return;
    }
    nodesVisited.push(n.id());
    let points = null;
    let dimension = null;
    console.log("n", n);
    if(n.data("isDirected") !=1 ){
      points = new layoutBase.PointD(0, 0);
      dimension = new layoutBase.DimensionD(0, 0);
      const hyseNode = new HySENode(layout.graphManager, points, dimension, null, n.id(), 0);
      hyseNode.nodeRepulsion = opts.nodeRepulsion;
      hyseNode.isDirected = opts.eles.nodes('#' + n.id()).data('isDirected');
      hyseNode.noOfChildren = opts.eles.nodes('#' + n.id()).children().length+1;
      
      if(hyseNode.noOfChildren > 1){
        let newGraph = layout.newGraph();
        layout.graphManager.add(newGraph, hyseNode);
        addChildren(g, newGraph, layout, opts, nodesVisited, n, hyseNode);
      }
      if(opts.eles.nodes('#' + n.id()).data("parent")){
        hyseNode.parentId = opts.eles.nodes('#' + n.id()).data("parent");
      }
      if (hyseNode.noOfChildren >= 2) {
        hyseNode.noOfChildren -= 1;
      }
      const lNode = hyseParent.getChild().add(hyseNode);
      id2LNode[n.id()] = lNode;
    }
  }
}


function processNodes(g, parent, layout, opts) {
  const nodes = opts.eles.nodes().filter(x => !x.id().startsWith('_d'));
  // node ların sol üst köşesinin koordinatları veriliyor
  let nodesVisited:string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    if(nodesVisited.includes(n.id())){
      continue;
    }
    nodesVisited.push(n.id());
    let points = null;
    let dimension = null;
    console.log("n", n);
    if(n.data("isDirected") !=1 ){
      points = new layoutBase.PointD(0, 0);
      dimension = new layoutBase.DimensionD(0, 0);
      const hyseNode = new HySENode(layout.graphManager, points, dimension, null, nodes[i].id(), 0);
      hyseNode.nodeRepulsion = opts.nodeRepulsion;
      hyseNode.isDirected = 0;
      if(hyseNode.isDirected == undefined){
        hyseNode.isDirected = 0;
      }
      hyseNode.noOfChildren = opts.eles.nodes('#' + nodes[i].id()).children().length+1;
      
      console.log("hyseNode.noOfChildren", opts.eles.nodes('#' + nodes[i].id()).children());
      if(hyseNode.noOfChildren > 1){
        let newGraph = layout.newGraph();
        layout.graphManager.add(newGraph, hyseNode);
        addChildren(g, newGraph, layout, opts, nodesVisited, n, hyseNode);
      }
      if(opts.eles.nodes('#' + nodes[i].id()).data("parent")){
        hyseNode.parentId = opts.eles.nodes('#' + nodes[i].id()).data("parent");
      }
      //hyseNode.parentId = opts.eles.nodes('#' + nodes[i]).parent().id();
      if (hyseNode.noOfChildren >= 2) {
        hyseNode.noOfChildren -= 1;
      }
      const lNode = parent.add(hyseNode);
      id2LNode[nodes[i].id()] = lNode;
    }
    else{
      n= g.node(n.id());
      points = new layoutBase.PointD(n.x, n.y);
      dimension = new layoutBase.DimensionD(n.width, n.height);
      const hyseNode = new HySENode(layout.graphManager, points, dimension, null, nodes[i].id(), n.rank);
      hyseNode.nodeRepulsion = opts.nodeRepulsion;
      hyseNode.isDirected = 1;
      //hyseNode.parentId = opts.eles.nodes('#' + nodes[i]).parent().id();
      const lNode = parent.add(hyseNode);
      id2LNode[nodes[i].id()] = lNode;
    }
    
  }
}

function processEdges(g, gm, opts) {
  const edges = opts.eles.edges();
  console.log(edges);
  const name2vw = {};
  for (let i = 0; i < edges.length; i++) {
    if (!name2vw[edges[i].id()]) {
      name2vw[edges[i].id()] = {};
    }
    console.log(edges[i]);
    const v = edges[i].source().id();
    const w = edges[i].target().id();
    
    if (!v.startsWith('_d')) {
      name2vw[edges[i].id()].v = v;
    }
    if (!w.startsWith('_d')) {
      name2vw[edges[i].id()].w = w;
    }
  }
  for (let name in name2vw) {
    const edge = name2vw[name];
    const sourceNode = id2LNode[edge.v];
    const targetNode = id2LNode[edge.w];
    const hiseEdge = new HySEEdge(sourceNode, targetNode, null);
    hiseEdge.idealLength = opts.idealEdgeLength;
    hiseEdge.edgeElasticity = opts.edgeElasticity;
    gm.add(hiseEdge, sourceNode, targetNode);
  }
}

function filterDummyNodesFromLayers(layering: any[][]) {
  const l2: any[][] = [];

  for (let i = 0; i < layering.length; i++) {
    const currLayer: string[] = [];
    for (let j = 0; j < layering[i].length; j++) {
      if (layering[i][j].startsWith('_d')) {
        continue;
      }
      currLayer.push(layering[i][j]);
    }
    if (currLayer.length > 0) {
      l2.push(currLayer);
    }
  }
  return l2;
}

function randomizeOrderInLayers(layering: any[][]) {
  for (let i = 0; i < layering.length; i++) {
    layering[i].sort(() => Math.random() - 0.5);
  }
}