import { ForceDirectedLayout } from "./cytoscape-force-directed";
import { DagreAndSpringEmbedderLayout } from "./cytoscape-hyse";

export default function register(cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified

  // register dagre and spring embedder combined version
  cytoscape('layout', 'hyse', DagreAndSpringEmbedderLayout);
  // register force directed layout algorithm (used for step by step animated version)
  cytoscape('layout', 'force-directed', ForceDirectedLayout);
}

if (typeof window["cytoscape"] !== "undefined") {
  register(window["cytoscape"]);
}
