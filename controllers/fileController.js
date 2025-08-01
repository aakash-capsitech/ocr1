// import fs from 'fs';
// import path from 'path';
// import pdfParse from 'pdf-parse';
// import Tesseract from 'tesseract.js';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import FileModel from '../models/File.js';
// import { pdfToImage } from '../utils/pdfToImgae.js';

// import dotenv from "dotenv"
// dotenv.config()

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// function getMimeType(filePath) {
//   const ext = path.extname(filePath).toLowerCase();
//   console.log(ext)
//   if (ext === '.png') return 'image/png';
//   if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
//   return null;
// }

// async function cleanupFiles(filePaths) {
//   for (const filePath of filePaths) {
//     try {
//       if (fs.existsSync(filePath)) {
//         await fs.promises.unlink(filePath);
//       }
//     } catch (error) {
//       console.warn(`Could not delete file ${filePath}:`, error.message);
//     }
//   }
// }












// export const processFile = async (req, res) => {
//   const file = req.file;
//   const filePath = path.resolve(file.path);
//   console.log(filePath)
//   let extractedText = '';
//   let structuredJson = {};
//   let tempFiles = [filePath];

//   console.log(process.env.GEMINI_API_KEY)

//   try {
//     if (file.mimetype === 'application/pdf') {
//       try {
//         const pdfBuffer = fs.readFileSync(filePath);
//         const pdfData = await pdfParse(pdfBuffer);
//         extractedText = pdfData.text;

//         if (!extractedText.trim()) {
//           console.log('No text found in PDF, converting to images for OCR...');
//           const imagePaths = await pdfToImage(filePath, 'uploads');
//           tempFiles.push(...imagePaths);
          
//           if (imagePaths.length > 0) {
//             const firstImagePath = imagePaths[0];

//             if (!fs.existsSync(firstImagePath)) {
//               throw new Error(`Image file not found: ${firstImagePath}`);
//             }
            
//             const stats = fs.statSync(firstImagePath);
//             if (stats.size === 0) {
//               throw new Error(`Image file is empty: ${firstImagePath}`);
//             }
            
//             console.log(`Processing image: ${firstImagePath} (${stats.size} bytes)`);
            
//             const result = await Tesseract.recognize(firstImagePath, 'eng', {
//               logger: m => {
//                 // console.log(m)
//             }
//             });
//             extractedText = result.data.text;
//           }
//         }
//       } catch (pdfError) {
//         console.error('PDF processing error:', pdfError);
//         throw new Error(`Failed to process PDF: ${pdfError.message}`);
//       }
//     } else if (file.mimetype.startsWith('image/')) {
//       try {
//         if (!fs.existsSync(filePath)) {
//           throw new Error(`Image file not found: ${filePath}`);
//         }
        
//         const stats = fs.statSync(filePath);
//         if (stats.size === 0) {
//           throw new Error(`Image file is empty: ${filePath}`);
//         }
        
//         console.log(`Processing image: ${filePath} (${stats.size} bytes)`);
        
//         const result = await Tesseract.recognize(filePath, 'eng', {
//           logger: m => {
//             // console.log(m)
//         }
//         });
//         extractedText = result.data.text;
//       } catch (ocrError) {
//         console.error('OCR processing error:', ocrError);
//         throw new Error(`Failed to process image: ${ocrError.message}`);
//       }
//     } else {
//       throw new Error(`Unsupported file type: ${file.mimetype}`);
//     }

//     console.log('Extracted text length:', extractedText.length);





















//     let geminiResponseText = '';
    
//     if (extractedText.trim()) {
//       try {
//         const mimeType = getMimeType(filePath);

//         console.log(mimeType)
        
//         if (file.mimetype.startsWith('image/') || (file.mimetype === 'application/pdf' && !extractedText.includes('\n'))) {
//           let imagePathForGemini = filePath;

//           if (file.mimetype === 'application/pdf') {
//             const imagePaths = await pdfToImage(filePath, 'uploads');
//             if (imagePaths.length > 0) {
//               imagePathForGemini = imagePaths[0];
//               tempFiles.push(...imagePaths);
//             }
//           }
          
//           const base64Data = fs.readFileSync(imagePathForGemini).toString('base64');
//           const imageMimeType = getMimeType(imagePathForGemini) || 'image/png';
          
//           const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
//           const result = await model.generateContent([
//             {
//               inlineData: {
//                 data: base64Data,
//                 mimeType: imageMimeType,
//               },
//             },
//             {
//               text: `
// Here is OCR extracted text from this image:

// "${extractedText}"

// Please verify and correct the text using the image. If it's a structured document (like a passport, ID card, invoice, or receipt), return a clean JSON object with labeled fields. Otherwise, return:
// { "correctedText": "corrected text here" }

// For passport/ID documents, include fields like: documentType, country, passportNumber, surname, givenNames, nationality, dateOfBirth, sex, placeOfBirth, expirationDate, etc.
//               `,
//             },
//           ]);
          
//           geminiResponseText = await result.response.text();
//         } else {
//           const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
//           const result = await model.generateContent(`
// Here is extracted text from a document:

// "${extractedText}"

// Please clean, correct, and structure this text. If it's a structured document (passport, ID, invoice, receipt, etc.), return a JSON object with labeled fields. If it's just plain text, return:
// { "correctedText": "cleaned text here" }

// For passport/ID documents, include fields like: documentType, country, passportNumber, surname, givenNames, nationality, dateOfBirth, sex, placeOfBirth, expirationDate, etc.
//           `);
          
//           geminiResponseText = await result.response.text();
//         }
//       } catch (geminiError) {
//         console.error('Gemini processing error:', geminiError);
//         geminiResponseText = JSON.stringify({ correctedText: extractedText });
//       }
//     } else {
//       geminiResponseText = JSON.stringify({ correctedText: "No text could be extracted from the document." });
//     }

//     try {
//       let cleanText = geminiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
//       structuredJson = JSON.parse(cleanText);
//     } catch (parseError) {
//       console.log('Could not parse as JSON, treating as plain text');
//       structuredJson = { correctedText: geminiResponseText.trim() };
//     }

//     const saved = await FileModel.create({
//       filename: file.originalname,
//       path: file.path,
//       text: extractedText,
//     });

//     res.json({
//       originalText: extractedText,
//       geminiResponse: structuredJson,
//       id: saved._id,
//     });

//   } catch (err) {
//     console.error('Processing error:', err);
//     res.status(500).json({ 
//       error: 'Processing failed', 
//       details: err.message 
//     });
//   } finally {
//     setTimeout(() => {
//       cleanupFiles(tempFiles);
//     }, 5000);
//   }
// };

















































import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import FileModel from '../models/File.js';
import { pdfToImage } from '../utils/pdfToImgae.js';

import dotenv from "dotenv"
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  console.log('Extension detected:', ext); // Better logging
  
  switch(ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.bmp':
      return 'image/bmp';
    default:
      console.warn(`Unsupported image extension: ${ext}`);
      return 'image/png'; // Default fallback instead of null
  }
}

async function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.warn(`Could not delete file ${filePath}:`, error.message);
    }
  }
}

export const processFile = async (req, res) => {
  const file = req.file;
  const filePath = path.resolve(file.path);
  console.log('File path:', filePath);
  let extractedText = '';
  let structuredJson = {};
  let tempFiles = [filePath];

  console.log('Gemini API Key present:', !!process.env.GEMINI_API_KEY);

  try {
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;

        if (!extractedText.trim()) {
          console.log('No text found in PDF, converting to images for OCR...');
          const imagePaths = await pdfToImage(filePath, 'uploads');
          tempFiles.push(...imagePaths);
          
          if (imagePaths.length > 0) {
            const firstImagePath = imagePaths[0];

            if (!fs.existsSync(firstImagePath)) {
              throw new Error(`Image file not found: ${firstImagePath}`);
            }
            
            const stats = fs.statSync(firstImagePath);
            if (stats.size === 0) {
              throw new Error(`Image file is empty: ${firstImagePath}`);
            }
            
            console.log(`Processing image: ${firstImagePath} (${stats.size} bytes)`);
            
            const result = await Tesseract.recognize(firstImagePath, 'eng', {
              logger: m => {
                // console.log(m)
              }
            });
            extractedText = result.data.text;
          }
        }
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        throw new Error(`Failed to process PDF: ${pdfError.message}`);
      }
    } else if (file.mimetype.startsWith('image/')) {
      try {
        if (!fs.existsSync(filePath)) {
          throw new Error(`Image file not found: ${filePath}`);
        }
        
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          throw new Error(`Image file is empty: ${filePath}`);
        }
        
        console.log(`Processing image: ${filePath} (${stats.size} bytes)`);
        
        const result = await Tesseract.recognize(filePath, 'eng', {
          logger: m => {
            // console.log(m)
          }
        });
        extractedText = result.data.text;
      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);
        throw new Error(`Failed to process image: ${ocrError.message}`);
      }
    } else {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    console.log('Extracted text length:', extractedText.length);
    console.log('First 100 chars of extracted text:', extractedText.substring(0, 100));

    let geminiResponseText = '';
    
    if (extractedText.trim()) {
      try {
        // Determine which path to take for Gemini processing
        const shouldUseImageAnalysis = file.mimetype.startsWith('image/') || 
          (file.mimetype === 'application/pdf' && extractedText.length < 500); // Threshold for short text
        
        if (shouldUseImageAnalysis) {
          let imagePathForGemini = filePath;

          // If it's a PDF, use the converted image
          if (file.mimetype === 'application/pdf') {
            const imagePaths = await pdfToImage(filePath, 'uploads');
            if (imagePaths.length > 0) {
              imagePathForGemini = imagePaths[0];
              tempFiles.push(...imagePaths);
            }
          }
          
          console.log('Using image path for Gemini:', imagePathForGemini);
          
          // Verify the image file exists and get MIME type
          if (!fs.existsSync(imagePathForGemini)) {
            throw new Error(`Image file for Gemini not found: ${imagePathForGemini}`);
          }
          
          const imageMimeType = getMimeType(imagePathForGemini);
          console.log('Image MIME type for Gemini:', imageMimeType);
          
          const base64Data = fs.readFileSync(imagePathForGemini).toString('base64');
          
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          const result = await model.generateContent([
            {
              inlineData: {
                data: base64Data,
                mimeType: imageMimeType,
              },
            },
            {
              text: `
Here is OCR extracted text from this image:

"${extractedText}"

Please verify and correct the text using the image. If it's a structured document (like a passport, ID card, invoice, or receipt), return a clean JSON object with labeled fields. Otherwise, return:
{ "correctedText": "corrected text here" }

For passport/ID documents, include fields like: documentType, country, passportNumber, surname, givenNames, nationality, dateOfBirth, sex, placeOfBirth, expirationDate, etc.
For invoices/receipts, include fields like: vendor, date, amount, items, etc.
              `,
            },
          ]);
          
          geminiResponseText = await result.response.text();
        } else {
          // Text-only processing for PDFs with substantial text
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          const result = await model.generateContent(`
Here is extracted text from a document:

"${extractedText}"

Please clean, correct, and structure this text. If it's a structured document (passport, ID, invoice, receipt, etc.), return a JSON object with labeled fields. If it's just plain text, return:
{ "correctedText": "cleaned text here" }

For passport/ID documents, include fields like: documentType, country, passportNumber, surname, givenNames, nationality, dateOfBirth, sex, placeOfBirth, expirationDate, etc.
For invoices/receipts, include fields like: vendor, date, amount, items, etc.
          `);
          
          geminiResponseText = await result.response.text();
        }
        
        console.log('Gemini response received, length:', geminiResponseText.length);
        
      } catch (geminiError) {
        console.error('Gemini processing error:', geminiError);
        console.error('Error details:', geminiError.message);
        geminiResponseText = JSON.stringify({ correctedText: extractedText });
      }
    } else {
      geminiResponseText = JSON.stringify({ correctedText: "No text could be extracted from the document." });
    }

    try {
      let cleanText = geminiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      structuredJson = JSON.parse(cleanText);
      console.log('Successfully parsed Gemini response as JSON');
      console.log(structuredJson)
    } catch (parseError) {
      console.log('Could not parse as JSON, treating as plain text');
      console.log('Parse error:', parseError.message);
      console.log('Raw response:', geminiResponseText.substring(0, 200));
      structuredJson = { correctedText: geminiResponseText.trim() };
    }

    const saved = await FileModel.create({
      filename: file.originalname,
      path: file.path,
      text: extractedText,
      doc: structuredJson
    });

    console.log('File saved to database with ID:', saved._id);

    res.json({
      originalText: extractedText,
      geminiResponse: structuredJson,
      id: saved._id,
    });

  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ 
      error: 'Processing failed', 
      details: err.message 
    });
  } finally {
    // Cleanup temporary files after a delay
    setTimeout(() => {
      cleanupFiles(tempFiles);
    }, 5000);
  }
};