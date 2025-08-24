// pages/api/learning.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const TOPICS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-XXXX/pub?output=csv';
const QUIZ_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-YYYY/pub?output=csv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type } = req.query; // "topics" or "quiz"
    const url = type === 'quiz' ? QUIZ_CSV_URL : TOPICS_CSV_URL;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed: ${response.status}`);
    }

    const csvText = await response.text();
    res.status(200).send(csvText); // send raw CSV back to frontend
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
