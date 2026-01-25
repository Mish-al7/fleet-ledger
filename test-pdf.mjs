import PDFDocument from 'pdfkit';
import fs from 'fs';

try {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream('test_output.pdf'));
    doc.text('Hello World');
    doc.end();
    console.log('PDF generation successful');
} catch (err) {
    console.error('PDF generation failed:', err);
}
