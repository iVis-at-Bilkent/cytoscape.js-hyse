# cytoscape-hyse

## Description

HySE (**Hy**brid **S**pring **E**mbedder), is a layout algorithm designed for laying out hybrid graph with a central directed part and connected undirected parts (e.g., a hybrid UML diagram where the class inheritance hierarchy forms the directed part and other types of associations form the remaining undirected parts of the diagram). The algorithm uses a wholist spring embedder where as crossing minimization and final positioning of the hierarchy is polished, the undirected part is also beautified simultaneously.

<p align="center">
  <img src="https://user-images.githubusercontent.com/3874988/210953012-2200b445-5095-4e2a-a854-62192736a8e1.png" width="600" alt="HySE-example-layout">
</p>

## Demo

1. Download the source codes or clone the repository with `git clone https://github.com/iVis-at-Bilkent/cytoscape.js-hyse.git`
2. Go to the root folder `cd cytoscape.js-hyse`
3. Run `npm install` to install the dependencies
4. Run `npm run demo`. By default it will open http://localhost:8080/demo/demo.html

## API

## Default Options

## Dependencies

## Usage instructions

After getting a build (use `npm run build` or `npm run build-dev`), you can import the generated files under "dist" folder. It will generate CommonJS, Universal Module Definition and ES bundles.

<div align="center">
  <sub>Present by i-Vis at Bilkent.</sub>
</div>

## Team

  * [Hamza Islam](https://github.com/hamzaislam101), [Hasan Balcı](https://github.com/hasanbalci) and [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)
