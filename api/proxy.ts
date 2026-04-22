
import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
  // Determine target based on the pathname or query param
  let targetBase = '';
  let subPath = '';
  
  const actualPath = (req.query.pathname as string) || pathname;

  if (actualPath.includes('sec-api')) {
    targetBase = 'https://data.sec.gov';
    subPath = actualPath.substring(actualPath.indexOf('sec-api') + 7);
  } else if (actualPath.includes('sec-www')) {
    targetBase = 'https://www.sec.gov';
    subPath = actualPath.substring(actualPath.indexOf('sec-www') + 7);
  } else {
    return res.status(404).send('Not Found');
  }

  const targetUrl = `${targetBase}${subPath}${req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
  
  const SEC_EMAIL = process.env.VITE_SEC_API_EMAIL || 'admin@fairvaluestudio.app';
  const USER_AGENT = `FairValueStudio/1.0 (https://fairvaluestudio.app; ${SEC_EMAIL})`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
      }
    });

    const data = await response.buffer();
    
    // Forward headers from SEC but handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    
    return res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).send('Internal Server Error');
  }
}
