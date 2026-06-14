import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PrintButton() {
  const handleExportPDF = async () => {
    const pages = document.querySelectorAll('.cv-page');
    if (!pages.length) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }

    pdf.save('cv.pdf');
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="default" onClick={handleExportPDF}>
        Export PDF →
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}
