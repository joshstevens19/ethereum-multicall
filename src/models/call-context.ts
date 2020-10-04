export interface CallContext {
  /**
   * Reference to this call context
   */
  reference: string;
  /**
   * The contract execution target
   */
  contractTarget: string;
  /**
   * Your encoded data
   */
  callData: string;
  /**
   * The output types from the ABI, if this is blank it will not decode the result
   */
  outputTypes?: string[];
}
