import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("db connected")
});

const upload = multer({ dest: 'uploads/' });

import { processFile } from'./controllers/fileController.js';
import { getAllFiles } from './controllers/getDocs.js';

app.post('/upload', upload.single('file'), processFile);

app.get("/all", getAllFiles)

app.listen(5000, () => console.log('Server running on port 5000'));
