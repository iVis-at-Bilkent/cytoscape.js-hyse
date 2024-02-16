# cytoscape-hyse

## Description

HySE (**Hy**brid **S**pring **E**mbedder), is a layout algorithm designed for laying out a hybrid graph with a "central" main directed part and "satellite" connected undirected parts (e.g., a hybrid UML diagram where the class inheritance hierarchy forms the directed part and other types of associations form the remaining undirected parts of the diagram). The algorithm uses a holistic spring embedder approach, where, as crossing minimization and final positioning of the hierarchy are polished, the undirected part is also beautified simultaneously.

<kbd>![image](https://github.com/iVis-at-Bilkent/cytoscape.js-hyse/assets/3874988/dec2d8ab-2061-4ac0-8f3d-65d3020dbf96)
</kbd>
&emsp;
<kbd>![ezgif com-crop](https://github.com/iVis-at-Bilkent/cytoscape.js-hyse/assets/3874988/1224dc0b-01db-49ce-901f-796a061718c1)</kbd>

## Demo

1. Download the source codes or clone the repository with `git clone https://github.com/iVis-at-Bilkent/cytoscape.js-hyse.git`
2. Go to the root folder `cd cytoscape.js-hyse`
3. Run `npm install` to install the dependencies
4. Run `npm run demo`. By default it will open http://localhost:8080/demo/demo.html

## API
When calling the layout, e.g. `cy.layout({ name: 'hyse', ... })`, the following options are supported:

```js
var defaultOptions = {

  // improves the quality of the graph using a fast cooling rate, taking less time
  isFastCooling: true,
  // Use random node positions for undirected nodes in undirected components when assigning initial positions
  randomizeInitialPositions: true, 
  // Whether or not to animate the layout
  animate: true, 
  // Duration of animation in ms, if enabled
  animationDuration: 1000, 
  // Easing of animation, if enabled
  animationEasing: undefined, 
  // Fit the viewport to the repositioned nodes
  fit: true, 
  // Padding around layout
  padding: 30,
  // Whether to include labels in node dimensions.
  nodeDimensionsIncludeLabels: false,
  // Whether or not simple nodes (non-compound nodes) are of uniform dimensions
  uniformNodeDimensions: true,
  
  // Node repulsion (non overlapping) multiplier
  nodeRepulsion: node => 55000,
  // Ideal edge (non nested) length
  idealEdgeLength: edge => 50,
  // Divisor to compute edge forces
  edgeElasticity: edge => 0.45,
  // Nesting factor (multiplier) to compute ideal edge length for nested edges
  nestingFactor: 0.1,
  // Maximum number of iterations to perform - this is a suggested value and might be adjusted by the algorithm as required
  numIter: 2500,
  // Apply repulsion forces on the graph to avoid node overlaps
  performPostProcessing: true,
  // If true, will not run the force directed part and will only display the initial positions assigned
  displayInitialPositions: false,
  // Distance between the ranks or layers of the directed part, takes into account the tallest node as well
  rankGap: 50,
  // Initially assigned distance between the nodes in ranks or layers of the directed part
  orderGap: 80,
  // Force threshold above which node pairs would be swapped in the directed part
  swapForceLimit: 15000,
  // Number of iterations after which the swapping function is called
  swapPeriod: 50,
  // Hold period for the nodes after being swapped
  // Nodes will not be swapped again if swapped recently in this number of iterations
  minPairSwapPeriod: 10,

  /* layout animation parameters */

  // Time (ms) between each iteration of the layout
  tickDelay: 100,
  // Number of iterations in each frame generated on screen
  ticksPerFrame: 5,
  
  /* layout event callbacks */
  ready: () => {}, // on layoutready
  stop: () => {} // on layoutstop
};
```


## Dependencies

 * Cytoscape.js ^3.2.0
 * cose-base ^2.0.0
 * dagre.js ^0.7.3

## Usage instructions

After getting a build (use `npm run build` or `npm run build-dev`), you can import the generated files under "dist" folder. It will generate CommonJS, Universal Module Definition and ES bundles.

## Team

  * [Hamza Islam](https://github.com/hamzaislam101), [Hasan Balcı](https://github.com/hasanbalci) and [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)
