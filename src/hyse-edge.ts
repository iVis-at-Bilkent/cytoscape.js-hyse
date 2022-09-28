import { CoSEEdge } from "cose-base";
import { HySENode } from "./hyse-node";

export class HySEEdge extends CoSEEdge  {
    
  [x: string]: any;
  constructor(source: HySENode, target: HySENode, vEdge) {
    super(source, target,vEdge);
  }
}