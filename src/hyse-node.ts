import { CoSENode , layoutBase } from "cose-base";

export class HySENode extends CoSENode  {

  isDirected: number;
  parentId: string;


  rank: number;
  id: string;
  layerIdx: number = -1;
  order: number = -1;
  [x: string]: any;

  constructor(gm, loc, size, vNode, id: string, rank: number) {
    super(gm, loc, size, vNode);
    this.isDirected = 0;

    this.id = id;
    this.rank = rank;
    this.noOfChildren = 1;
    this.parentId = "";
  }


  calculateDisplacement() {
    // `this` brings properties from base class 
    let layout = this.graphManager.getLayout();
    let coolingCoefficient = layout.coolingFactor;
    if(this.isDirected == 1){
      coolingCoefficient = layout.directedCoolingFactor * 0.7;
    }
    this.displacementX += (coolingCoefficient * (this.springForceX + this.repulsionForceX)/this.noOfChildren);
    if(this.isDirected!==1){
      this.displacementY += (coolingCoefficient * (this.springForceY + this.repulsionForceY)/this.noOfChildren);
    }
    
    if (Math.abs(this.displacementX) > coolingCoefficient * layout.maxNodeDisplacement) {
      this.displacementX = coolingCoefficient * layout.maxNodeDisplacement * layoutBase.IMath.sign(this.displacementX);
    }

    if (this.isDirected != 1 && Math.abs(this.displacementY) > coolingCoefficient * layout.maxNodeDisplacement) {
      this.displacementY = coolingCoefficient * layout.maxNodeDisplacement * layoutBase.IMath.sign(this.displacementY);
    }

    if(this.child)
    {
      this.propogateDisplacementToChildren(this.displacementX, this.displacementY);
    }

  }

  propogateDisplacementToChildren(displacementX: number, displacementY: number) {
    this.child.nodes.forEach(node => {
      if(node.child){
        node.propogateDisplacementToChildren(displacementX, displacementY);
      }
      else{
        node.displacementX += displacementX;
        node.displacementY += displacementY;
      }
    });
  }

  move() {
    // `this` brings properties from base class 
    let layout = this.graphManager.getLayout();
    if(this.child){
      // this.child.nodes.forEach(node => {
      //   node.move();
      // });
      // this.updateBounds();
    }
    else if(this.isDirected != 1){
      this.moveBy(this.displacementX, this.displacementY);
      layout.totalDisplacement += Math.abs(this.displacementX) + Math.abs(this.displacementY);
      if(this.isDirected === 0){
        layout.undirectedDisplacement += Math.abs(this.displacementY);
      }
      else{
        layout.directedDisplacement += Math.abs(this.displacementY);
      }
    }
    else{
      this.moveBy(this.displacementX, 0);
      layout.totalDisplacement += Math.abs(this.displacementX);
      if(this.isDirected == 1){
        layout.directedDisplacement += Math.abs(this.displacementY);
      }
      else{
        layout.undirectedDisplacement += Math.abs(this.displacementY);
      }
    }
  }

  /** Swap horizontal positions of this node and the other
   * @param  {HySENode} other
   * @param  {} isResetForceAndDisplacement=true
   */
  swapPositionWith(other: HySENode, isResetForceAndDisplacement = true) {
    let x1 = other.rect.x;
    const y1 = other.rect.y;
    let x2 = this.rect.x;
    const y2 = this.rect.y;

    //doing this so that nodes are swapped in the same region
    //instead of directly swapping centers find the point by taking in account the width difference of both nodes
    if(!layoutBase.uniformNodeDimensions){
      if(x1<x2){
        x2=this.rect.x+(this.rect.getWidthHalf()-other.rect.getWidthHalf());
        x1=other.rect.x+(this.rect.getWidthHalf()-other.rect.getWidthHalf());
      }
      else{
        x2=this.rect.x+(other.rect.getWidthHalf()-this.rect.getWidthHalf());
        x1=other.rect.x+(other.rect.getWidthHalf()-this.rect.getWidthHalf());
      }
    }
    
    this.setLocation(x1, y1);
    other.setLocation(x2, y2);
    

    if (isResetForceAndDisplacement) {
      this.resetForcesAndDisplacement();
      other.resetForcesAndDisplacement();
    }
    else{
      //swap the forces and displacements
      const tempNode = new HySENode(this.graphManager, null, null, null, "", -1);
      tempNode.springForceX = this.springForceX;
      tempNode.springForceY = this.springForceY;
      tempNode.repulsionForceX = this.repulsionForceX;
      tempNode.repulsionForceY = this.repulsionForceY;
      tempNode.gravitationForceX = this.gravitationForceX;
      tempNode.gravitationForceY = this.gravitationForceY;
      tempNode.displacementX = this.displacementX;
      tempNode.displacementY = this.displacementY;

      this.springForceX = other.springForceX;
      this.springForceY = other.springForceY;
      this.repulsionForceX = other.repulsionForceX;
      this.repulsionForceY = other.repulsionForceY;
      this.gravitationForceX = other.gravitationForceX;
      this.gravitationForceY = other.gravitationForceY;
      this.displacementX = other.displacementX;
      this.displacementY = other.displacementY;
      
      other.springForceX = tempNode.springForceX;
      other.springForceY = tempNode.springForceY;
      other.repulsionForceX = tempNode.repulsionForceX;
      other.repulsionForceY = tempNode.repulsionForceY;
      other.gravitationForceX = tempNode.gravitationForceX;
      other.gravitationForceY = tempNode.gravitationForceY;
      other.displacementX = tempNode.displacementX;
      other.displacementY = tempNode.displacementY;
    }
  }

  resetForcesAndDisplacement() {
    this.springForceX = 0;
    this.springForceY = 0;
    this.repulsionForceX = 0;
    this.repulsionForceY = 0;
    this.gravitationForceX = 0;
    this.gravitationForceY = 0;
    this.displacementX = 0;
    this.displacementY = 0;
  }


}
