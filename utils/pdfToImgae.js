import { promises as fs } from "fs";
import { pdf } from "pdf-to-img";
import path from "path";

export async function pdfToImage(pdfPath, outputDir) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    const stats = await fs.stat(pdfPath);
    if (stats.size === 0) {
      throw new Error('PDF file is empty');
    }

    console.log(`Converting PDF: ${pdfPath} (${stats.size} bytes)`);
    
    const document = await pdf(pdfPath, { 
      scale: 2.5,
      outputFormat: 'png'
    });
    
    const savedPaths = [];
    let counter = 1;
    
    for await (const image of document) {
      const fileName = `pdf_page_${Date.now()}_${counter}.png`;
      const filePath = path.join(outputDir, fileName);
      
      try {
        await fs.writeFile(filePath, image);
        
        const writtenStats = await fs.stat(filePath);
        if (writtenStats.size > 0) {
          savedPaths.push(filePath);
          console.log(`Saved page ${counter}: ${filePath} (${writtenStats.size} bytes)`);
        } else {
          console.warn(`Warning: Page ${counter} resulted in empty file`);
        }
      } catch (writeError) {
        console.error(`Error writing page ${counter}:`, writeError);
      }
      
      counter++;
    }

    if (savedPaths.length === 0) {
      throw new Error('No pages could be converted from PDF');
    }

    console.log(`Successfully converted ${savedPaths.length} pages`);
    return savedPaths;
    
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}