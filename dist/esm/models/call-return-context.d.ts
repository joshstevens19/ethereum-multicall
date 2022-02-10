import { CallContext } from './call-context';
export interface CallReturnContext extends CallContext {
    returnValues: any[];
    /**
     * This stats if it could decode the result or not
     */
    decoded: boolean;
    /**
     * If this context was successful, this will always be try
     * if you dont use the try aggregate logic
     */
    success: boolean;
}
export interface Result extends ReadonlyArray<any> {
    readonly [key: string]: any;
}
