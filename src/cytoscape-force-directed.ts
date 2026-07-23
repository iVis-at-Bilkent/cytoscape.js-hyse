import { DEFAULT_OPTIONS, Str2HySENode } from "./helper";
import { HySELayout } from "./hyse-layout";
import { HySENode } from "./hyse-node";
import { PointD, DimensionD } from "cose-base";
import { HySEEdge } from "./hyse-edge";

export class ForceDirectedLayout {
  options: any;
  id2LNode: Str2HySENode = {};

  constructor(options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  }

  run() {
    const options = this.options;
    const cy = options.cy; // cy is automatically populated for us in the constructor
    const nodes = options.eles.nodes();
    let layering = this.initPositionsLikeDagre(cy, nodes, options);
    if (options.isManuelRankAndOrder) {
      layering = this.getLayeringFromData(nodes);
    }
    this.randomizeOrderInLayers(layering);
    this.setPositionsFromLayering(layering, options);

    if (options.justHierarchy) {
      nodes.layoutPositions(this, options, function (ele) {
        return {
          x: ele.position('x'),
          y: ele.position('y')
        };
      });
      return this;
    }
    const l = new HySELayout(layering, cy);
    l.swapPeriod = options.swapPeriod;
    l.minPairSwapPeriod = options.minPairSwapPeriod;
    l.swapForceLimit = options.swapForceLimit;
    l.isHighlightSwappedPair = options.animate == "during";
    let gm = l.newGraphManager();

    console.log("processing nodes");

    this.processNodes(cy, gm.addRoot(), l, options);
    this.processEdges(cy, gm, options);

    if (options.animate != "during") {
      l.runLayout();

      // convey position data from 'Graph Manager'
      for (let i = 0; i < gm.allNodes.length; i++) {
        const n = gm.allNodes[i];
        cy.nodes('#' + n.id).scratch("force_directed_pos", { x: n.rect.x, y: n.rect.y });
      }

      nodes.layoutPositions(this, options, function (ele) {
        ele = typeof ele === "object" ? ele : this;
        let dModel = ele.scratch('force_directed_pos');

        return {
          x: dModel.x,
          y: dModel.y
        };
      });
      if (options.stop && typeof options.stop == "function") {
        options.stop();
      }
    } else {
      this.runTickByTickAnimated(l, nodes, options);
    }

    return this; // chaining
  }

  runTickByTickAnimated(layout: HySELayout, nodes, options) {
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
    const executeTickFn = () => {
      setTimeout(() => {
        let isLayoutEnded = false;
        for (let i = 0; i < options.ticksPerFrame && !isLayoutEnded; i++) {
          isLayoutEnded = layout.tick();
        }
        nodes.positions((ele) => {
          const lNode = this.id2LNode[ele.id()]
          return {
            x: lNode.getRect().getCenterX(),
            y: lNode.getRect().getCenterY()
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

  processNodes(cy, parent, layout, options) {
    const nodes = cy.nodes();
    // node ların sol üst köşesinin koordinatları veriliyor
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const p = n.position();
      const w = n.width();
      const h = n.height();
      const hyseNode = new HySENode(layout.graphManager, new PointD(p.x, p.y), new DimensionD(w, h), null, n.id(), n.rank);
      hyseNode.nodeRepulsion = options.nodeRepulsion;
      hyseNode.isDirected = n.data("isDirected");
      console.log(hyseNode);
      const lNode = parent.add(hyseNode);
      this.id2LNode[n.id()] = lNode;
    }
  }

  processEdges(cy, gm, options) {
    const edges = cy.edges();
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const sourceNode = this.id2LNode[edge.source().id()];
      const targetNode = this.id2LNode[edge.target().id()];
      const e = new HySEEdge(sourceNode, targetNode, null);
      e.idealLength = options.idealEdgeLength;
      e.edgeElasticity = options.edgeElasticity;
      gm.add(e, sourceNode, targetNode);
    }
  }

  /** center aligned positioning
   * @param  {} cy
   * @param  {} nodes
   * @param  {} options
   */
  initPositionsLikeDagre(cy, nodes, options) {
    const layering = this.getLayers(cy, nodes);

    const rankGap = options.rankGap;
    const orderGap = options.orderGap;
    const maxLayerSize = Math.max(...layering.map(x => x.length));
    const maxWidth = maxLayerSize * orderGap;
    for (let i = 0; i < layering.length; i++) {
      for (let j = 0; j < layering[i].length; j++) {
        const n = layering[i][j];
        const layerSize = layering[i].length;
        const p = { x: (maxWidth / (layerSize + 1)) * (j + 1), y: rankGap * i };
        n.position(p);
      }
    }
    return layering;
  }

  /** For DAGMAR graphs, layering info is inside `node.data('level')` 
   * for others it is inside node IDs. if node id is `n2_1`, it means level 2 order 1. Numbers start from 1.
   * @param  {} nodes
   */
  getLayeringFromData(nodes) {
    if (nodes[0].data('level')) {
      const layerId2cnt = {};
      const layerIds = nodes.map(x => Number(x.data('level')));
      for (let id of layerIds) {
        if (!layerId2cnt[id]) {
          layerId2cnt[id] = 0;
        }
        layerId2cnt[id] += 1;
      }
      const totalLayerCnt = Object.keys(layerId2cnt).length;
      const layering: any[][] = new Array(totalLayerCnt);
      for (let id in layerId2cnt) {
        // DAGmar dataset starts levels from 0
        layering[Number(id)] = new Array(layerId2cnt[id]);
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const level = Number(n.data('level'));
        const order = layerId2cnt[level] - 1;
        layering[level][order] = n;
        layerId2cnt[level] = layerId2cnt[level] - 1; // since order info doesn't exist, just count 
      }
      return layering;
    } else {
      const layerId2cnt = {};
      const layerIds = nodes.map(x => Number(x.id().substr(1).split('_')[0]));
      for (let id of layerIds) {
        if (!layerId2cnt[id]) {
          layerId2cnt[id] = 0;
        }
        layerId2cnt[id] += 1;
      }
      const totalLayerCnt = Object.keys(layerId2cnt).length;
      const layering: any[][] = new Array(totalLayerCnt);
      for (let id in layerId2cnt) {
        layering[Number(id) - 1] = new Array(layerId2cnt[id]);
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const idxes = n.id().substr(1).split('_');
        layering[idxes[0] - 1][idxes[1] - 1] = n;
      }
      return layering;
    }
  }

  private randomizeOrderInLayers(layering: any[][]) {
    for (let i = 0; i < layering.length; i++) {
      layering[i].sort(() => Math.random() - 0.5);
    }
  }

  private setPositionsFromLayering(layering: any[][], options) {
    const rankGap = options.rankGap;
    const orderGap = options.orderGap;
    const maxLayerSize = Math.max(...layering.map(x => x.length));
    const maxWidth = maxLayerSize * orderGap;
    for (let i = 0; i < layering.length; i++) {
      for (let j = 0; j < layering[i].length; j++) {
        const n = layering[i][j];
        const layerSize = layering[i].length;
        const p = { x: (maxWidth / (layerSize + 1)) * (j + 1), y: rankGap * i };
        n.position(p);
      }
    }
  }

  printLayers(cy, nodes) {
    const layers = this.getLayers(cy, nodes);
    let s = '';
    for (let i = 0; i < layers.length; i++) {
      s += '[';
      for (let j = 0; j < layers[i].length; j++) {
        s += layers[i][j].id() + ', ';
      }
      s = s.slice(0, s.length - 2);
      s += ']\n';
    }
    console.log(s);
  }

  getLayers(cy, nodes): any[][] {
    const r: any[][] = [];
    const visited = cy.collection();

    while (visited.length < nodes.length) {
      let newLayer: any[] = [];
      const unlayered = nodes.not(visited)
      for (let i = 0; i < unlayered.length; i++) {
        const curr = unlayered[i];
        // get nodes who doesn't have any incomer
        if (curr.incomers('node').not(visited).length < 1) {
          newLayer.push(curr);
        }
      }
      r.push(newLayer);
      visited.merge(newLayer);
    }
    return r;
  }
}