import { DEFAULT_OPTIONS, isFunction } from "./helper";
import { layout } from "./dagre/layout";
import * as graphlib from "graphlib";

// mosty copy-pasted from https://github.com/cytoscape/cytoscape.js-dagre used spring embedder in some places
export class DagreAndSpringEmbedderLayout {
  options: any;
  constructor(options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  }

  run() {
    console.log("running dagre and spring embedder layout");
    let options = this.options;
    let cy = options.cy; // cy is automatically populated for us in the constructor
    let eles = options.eles;

    let getVal = function (ele, val) {
      return isFunction(val) ? val.apply(ele, [ele]) : val;
    };

    let bb = options.boundingBox || { x1: 0, y1: 0, w: cy.width(), h: cy.height() };
    if (bb.x2 === undefined) { bb.x2 = bb.x1 + bb.w; }
    if (bb.w === undefined) { bb.w = bb.x2 - bb.x1; }
    if (bb.y2 === undefined) { bb.y2 = bb.y1 + bb.h; }
    if (bb.h === undefined) { bb.h = bb.y2 - bb.y1; }

    let g = new graphlib.Graph({
      multigraph: true,
      compound: true
    });

    let gObj = {};
    let setGObj = function (name, val) {
      if (val != null) { 
        gObj[name] = val;
      }
    };

    
    // add nodes to dagre
    //only add those nodes which are in the heirachical layout

    let nodes = eles.nodes().filter(function (ele) {
      return  ele.data("isDirected") == 1;
    });
    //let nodes = eles.nodes();
    let maxHeight = 0;
    let maxWidth = 0;
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      
      let nbb = node.layoutDimensions(options);

      g.setNode(node.id(), {
        width: nbb.w,
        height: nbb.h,
        name: node.id(),
        isDirected:node.data("isDirected"),
      });
      if(nbb.h > maxHeight){
        maxHeight = nbb.h;
      }
      if(nbb.w > maxWidth){
        maxWidth = nbb.w;
      }
      // console.log( g.node(node.id()) );
    }

    if(options.rankGap<40+maxHeight/2){
      options.rankGap = 40+maxHeight/2;
    }
    if(options.orderGap<20+maxWidth){
      options.orderGap = 20+maxWidth;
    }

    setGObj('nodesep', options.nodeSep);
    setGObj('edgesep', options.edgeSep);
    setGObj('ranksep', options.rankSep);
    setGObj('rankdir', options.rankDir);
    setGObj('align', options.align);
    setGObj('ranker', options.ranker);
    setGObj('acyclicer', options.acyclicer);

    g.setGraph(gObj);

    g.setDefaultEdgeLabel(function () { return {}; });
    g.setDefaultNodeLabel(function () { return {}; });


    // add edges to dagre
    let edges = eles.edges().stdFilter(function (edge) {
        
      return edge.source().data("isDirected")==1 && edge.target().data("isDirected")==1;
    });
    for (let i = 0; i < edges.length; i++) {
      let edge = edges[i];
      console.log(edge);
      g.setEdge(edge.source().id(), edge.target().id(), {
        minlen: getVal(edge, options.minLen),
        weight: getVal(edge, options.edgeWeight),
        name: edge.id()
      }, edge.id());

    }
    
    layout(g, options, cy);

    let gNodeIds = g.nodes();
    for (let i = 0; i < gNodeIds.length; i++) {
      let id = gNodeIds[i];
      console.log("id", id);
      let n = g.node(id);
      cy.getElementById(id).scratch().dagre = n;
    }

    let dagreBB;

    if (options.boundingBox) {
      dagreBB = { x1: Infinity, x2: -Infinity, y1: Infinity, y2: -Infinity };
      nodes.forEach(function (node) {
        let dModel = node.scratch().dagre;

        dagreBB.x1 = Math.min(dagreBB.x1, dModel.x);
        dagreBB.x2 = Math.max(dagreBB.x2, dModel.x);

        dagreBB.y1 = Math.min(dagreBB.y1, dModel.y);
        dagreBB.y2 = Math.max(dagreBB.y2, dModel.y);
      });

      dagreBB.w = dagreBB.x2 - dagreBB.x1;
      dagreBB.h = dagreBB.y2 - dagreBB.y1;
    } else {
      dagreBB = bb;
    }

    let constrainPos = function (p) {
      if (options.boundingBox) {
        let xPct = dagreBB.w === 0 ? 0 : (p.x - dagreBB.x1) / dagreBB.w;
        let yPct = dagreBB.h === 0 ? 0 : (p.y - dagreBB.y1) / dagreBB.h;

        return {
          x: bb.x1 + xPct * bb.w,
          y: bb.y1 + yPct * bb.h
        };
      } else {
        return p;
      }
    };
    let counter = 0;
    if (options.isForceDirected && !options.isRelayer) {
      nodes.layoutPositions(this, options, function (ele) {
        counter++;
        ele = typeof ele === "object" ? ele : this;
        if(ele != undefined){
            let dModel = ele.scratch('force_directed_pos');
            // console.log("found force directed position for node " + ele.id() + " as ", dModel);
            // console.log(counter);
            if(dModel != undefined){
                return {
                x: dModel.x,
                y: dModel.y
                };
            }
        }
        
      });
    } else {
        console.log("not force directed");
        console.log("not f nodes", nodes);
      nodes.layoutPositions(this, options, function (ele) {
        counter++;
        ele = typeof ele === "object" ? ele : this;
        let dModel = ele.scratch().dagre;

        return constrainPos({
          x: dModel.x,
          y: dModel.y
        });
      });
    }
    console.log(counter);

    return this; // chaining
  }
}