// src/pages/api/readData.js

// src/pages/api/readData.js

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'src/app/Data_Resources/normalized_services.csv');
  const results = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        res.status(200).json(results);
      });
  } catch (error) {
    console.error('Error reading CSV file:', error);
    res.status(500).json({ error: 'Error reading CSV file' });
  }
}
