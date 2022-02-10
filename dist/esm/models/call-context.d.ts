export interface CallContext {
    /**
     * Reference to this call context
     */
    reference: string;
    /**
     * your contract method name
     */
    methodName: string;
    /**
     * Method parameters you want it to pass in
     */
    methodParameters: any[];
}
