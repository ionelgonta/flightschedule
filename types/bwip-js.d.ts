declare module 'bwip-js' {
  export interface ToBufferOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: string;
    eclevel?: number | string;
    columns?: number;
    rows?: number;
    [key: string]: unknown;
  }

  export function toBuffer(opts: ToBufferOptions): Promise<Buffer>;

  const bwipjs: {
    toBuffer: (opts: ToBufferOptions) => Promise<Buffer>;
  };
  export default bwipjs;
}
