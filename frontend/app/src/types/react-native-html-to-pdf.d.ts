declare module 'react-native-html-to-pdf' {
  export interface RNHTMLtoPDFOptions {
    html: string;
    fileName?: string;
    base64?: boolean;
    directory?: string;
    height?: number;
    width?: number;
    padding?: number;
  }

  export interface RNHTMLtoPDFResponse {
    filePath: string;
    base64?: string;
  }

  export default class RNHTMLtoPDF {
    static convert(options: RNHTMLtoPDFOptions): Promise<RNHTMLtoPDFResponse>;
  }
} 