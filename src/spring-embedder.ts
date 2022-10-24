import { HySELayout } from "./hyse-layout";
import { HySENode } from "./hyse-node";
// import { layoutBase.PointD, DimensionD } from "cose-base";
import {layoutBase} from "cose-base";
import { HySEEdge } from "./hyse-edge";
import { Str2HySENode } from "./helper";

const id2LNode: Str2HySENode = {};

export function runSpringEmbedder(g, layering: string[][], opts, cy) {


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

  let gm = l.newGraphManager();

  processNodes(g, gm.addRoot(), l, opts);
  processEdges(g, gm, opts);
  l.runLayout();
  console.log("setting positions");
  for (let i = 0; i < gm.allNodes.length; i++) {
    const n = gm.allNodes[i];
    if (!opts.isRelayer) {
      console.log("setting position of "+n.id+" to "+n.rect.x+","+n.rect.y);
      window['cy'].nodes('#' + n.id).scratch("force_directed_pos", { x: n.rect.x, y: n.rect.y });
    }
  }
  if (opts.isRelayer) {
    layering = getNewLayeringFromForceDirected(gm, layering);
  }
  return layering;
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

function processNodes(g, parent, layout, opts) {
  const nodes = g.nodes().filter(x => !x.startsWith('_d'));
  // node ların sol üst köşesinin koordinatları veriliyor
  for (let i = 0; i < nodes.length; i++) {
    const n = g.node(nodes[i]);
    const hyseNode = new HySENode(layout.graphManager, new layoutBase.PointD(n.x, n.y), new layoutBase.DimensionD(n.width, n.height), null, nodes[i], n.rank);
    hyseNode.nodeRepulsion = opts.nodeRepulsion;
    hyseNode.isDirected = opts.eles.nodes('#' + nodes[i]).data('isDirected');
    hyseNode.parentId = opts.eles.nodes('#' + nodes[i]).parent().id();
    const lNode = parent.add(hyseNode);
    id2LNode[nodes[i]] = lNode;
  }
}

function processEdges(g, gm, opts) {
  const edges = g.edges();
  const name2vw = {};
  for (let i = 0; i < edges.length; i++) {
    if (!name2vw[edges[i].name]) {
      name2vw[edges[i].name] = {};
    }
    const v = edges[i].v;
    const w = edges[i].w;
    if (!v.startsWith('_d')) {
      name2vw[edges[i].name].v = v;
    }
    if (!w.startsWith('_d')) {
      name2vw[edges[i].name].w = w;
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