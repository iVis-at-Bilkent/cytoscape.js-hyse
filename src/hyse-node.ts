import { LNode, IMath } from "layout-base";

export class HyseNode extends LNode {
  constructor(id: number, loc: IMath.PointD, size: IMath.DimensionD) {
    super(id, loc, size);
  }
}