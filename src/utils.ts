export class Utils {
  public static deepClone<T>(object: T): T {
    return structuredClone(object) as T
  }
}