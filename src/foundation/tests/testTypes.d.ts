export type FoundationTest = [id: string, name: string, run: (context?: {signal?: AbortSignal, stage?: (value: string) => void}) => unknown | Promise<unknown>];
