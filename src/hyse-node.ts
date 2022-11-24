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


  calculateDisplacement(isPostProcess = false) {
    // `this` brings properties from base class 
    let layout = this.graphManager.getLayout();
    this.displacementX += layout.coolingFactor * (this.springForceX + this.repulsionForceX);
    // this.displacementY += layout.coolingFactor * (this.springForceY + this.repulsionForceY);

    if(isPostProcess){
      if (Math.abs(this.displacementX) > layout.coolingFactor * layout.maxNodeDisplacement/3) {
        this.displacementX = layout.coolingFactor * layout.maxNodeDisplacement/3 * layoutBase.IMath.sign(this.displacementX);
      }
      
    }

    if (Math.abs(this.displacementX) > layout.coolingFactor * layout.maxNodeDisplacement) {
      this.displacementX = layout.coolingFactor * layout.maxNodeDisplacement *
        layoutBase.IMath.sign(this.displacementX);
    }
  }

  calculateDisplacementForCompound(isPostProcess = false) {
    // `this` brings properties from base class 
    let layout = this.graphManager.getLayout();
    this.displacementX += layout.coolingFactor * (this.springForceX + this.repulsionForceX);
    this.displacementY += layout.coolingFactor * (this.springForceY + this.repulsionForceY);

    if(isPostProcess){
      if (Math.abs(this.displacementX) > layout.coolingFactor * layout.maxNodeDisplacement/3) {
        this.displacementX = layout.coolingFactor * layout.maxNodeDisplacement/3 * layoutBase.IMath.sign(this.displacementX);
      }
      
    }

    if (Math.abs(this.displacementX) > layout.coolingFactor * layout.maxNodeDisplacement) {
      this.displacementX = layout.coolingFactor * layout.maxNodeDisplacement *
        layoutBase.IMath.sign(this.displacementX);
    }

    if (Math.abs(this.displacementY) > layout.coolingFactor * layout.maxNodeDisplacement) {
      this.displacementY = layout.coolingFactor * layout.maxNodeDisplacement *
        layoutBase.IMath.sign(this.displacementY);
    }

  }

  move() {
    // `this` brings properties from base class 
    let layout = this.graphManager.getLayout();
    this.moveBy(this.displacementX, 0);
    layout.totalDisplacement += Math.abs(this.displacementX);
  }

  moveCompound() {
    // `this` brings properties from base class
    let layout = this.graphManager.getLayout();
    this.moveBy(this.displacementX, this.displacementY);
    layout.totalDisplacement += Math.abs(this.displacementX) + Math.abs(this.displacementY);
  }

  moveOnXaxis(movement:number) {
    // `this` brings properties from base class 
    let layout = this.graphManager.getLayout();
    this.moveBy(movement, 0);
    layout.totalDisplacement += Math.abs(movement);
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

    if(x1<x2){
      x2=this.rect.x+(this.rect.getWidthHalf()-other.rect.getWidthHalf());
      x1=other.rect.x+(this.rect.getWidthHalf()-other.rect.getWidthHalf());
    }
    else{
      x2=this.rect.x+(other.rect.getWidthHalf()-this.rect.getWidthHalf());
      x1=other.rect.x+(other.rect.getWidthHalf()-this.rect.getWidthHalf());
    }
    this.setLocation(x1, y1);
    other.setLocation(x2, y2);
    if (isResetForceAndDisplacement) {
      this.resetForcesAndDisplacement();
      other.resetForcesAndDisplacement();
    }
  }

  resetForcesAndDisplacement() {
    this.springForceX = 0;
    this.repulsionForceX = 0;
    this.gravitationForceX = 0;
    this.displacementX = 0;
  }


}