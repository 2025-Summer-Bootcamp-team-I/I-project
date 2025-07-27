// src/types/html2pdf.d.ts
declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    enableLinks?: boolean;
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      allowTaint?: boolean;
    };
    jsPDF?: {
      orientation?: 'portrait' | 'landscape';
      unit?: 'pt' | 'mm' | 'cm' | 'in';
      format?: string | [number, number];
    };
  }

  interface Html2PdfInstance {
    from(element: HTMLElement): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
    save(): Promise<void>;
    outputPdf(): Promise<Blob>;
    outputImg(): Promise<string>;
  }

  const html2pdf: {
    (element: HTMLElement, options?: Html2PdfOptions): Html2PdfInstance;
    (options?: Html2PdfOptions): Html2PdfInstance;
  };

  export default html2pdf;
}
  