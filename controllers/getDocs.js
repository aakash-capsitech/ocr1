import File from '../models/File.js';

export const getAllFiles = async (req, res) => {
  try {

    const files = await File.find();

    res.status(200).json({ success: true, data: files });
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
