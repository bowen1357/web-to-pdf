                                                                                   
  import type { VercelRequest, VercelResponse } from '@vercel/node';                                                               
  import axios from 'axios';                                                                                                       
                                                                                                                                   
  export default async function handler(req: VercelRequest, res: VercelResponse) {                                                 
    res.setHeader('Access-Control-Allow-Origin', '*');                                                                             
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');                                                                
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');                                                                 
                                                                                                                                   
    if (req.method === 'OPTIONS') {                                                                                                
      return res.status(200).end();                                                                                                
    }                                                                                                                              
                                                                                    
    if (req.method !== 'POST') {                                                                                                   
      return res.status(405).json({ error: '只支持 POST 请求' });                   
    }                                                                                                                              
                                                                                                                                   
    const { url } = req.body;                                                                                                      
                                                                                                                                   
    if (!url || typeof url !== 'string') {                                                                                         
      return res.status(400).json({ error: '请提供有效的 URL' });                   
    }                                                                                                                              
                                                                                                                                   
    let targetUrl: URL;                                                                                                            
    try {                                                                                                                          
      targetUrl = new URL(url);                                                                                                    
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {                                                                     
        throw new Error('只支持 HTTP 和 HTTPS 协议');                                                                              
      }                                                                                                                            
    } catch (error) {                                                                                                              
      return res.status(400).json({ error: 'URL 格式无效' });                                                                      
    }                                                                                                                              
                                                                                                                                   
    const apiKey = process.env.PDFSHIFT_API_KEY;                                                                                   
                                                                                                                                   
    if (!apiKey) {                                                                                                                 
      return res.status(503).json({                                                 
        error: 'PDF 服务未配置',                                                                                                   
        message: '请在 Vercel Dashboard 中配置 PDFSHIFT_API_KEY 环境变量',                                                         
      });                                                                                                                          
    }                                                                                                                              
                                                                                                                                   
    try {                                                                                                                          
      console.log(`[PDFShift] 开始转换: ${targetUrl.toString()}`);                                                                 
                                                                                                                                   
      const response = await axios.post(                                                                                           
        'https://api.pdfshift.io/v3/convert/pdf',                                                                                  
        {                                                                                                                          
          source: targetUrl.toString(),                                                                                            
          format: '1024xauto',                                                                                                     
          delay: 10000,                                                                                                            
          lazy_load_images: true,                                                                                                  
          margin: {                                                                                                                
            top: '20px',                                                                                                           
            right: '20px',                                                                                                         
            bottom: '20px',                                                                                                        
            left: '20px',                                                                                                          
          },                                                                                                                       
        },                                                                                                                         
        {                                                                                                                          
          headers: {                                                                                                               
            'X-API-Key': apiKey,                                                                                                   
            'Content-Type': 'application/json',                                                                                    
          },                                                                                                                       
          responseType: 'arraybuffer',                                                                                             
          timeout: 60000,                                                                                                          
        }                                                                                                                          
      );                                                                                                                           
                                                                                                                                   
      console.log(`[PDFShift] 转换成功: ${response.data.length} bytes`);                                                           
                                                                                    
      res.setHeader('Content-Type', 'application/pdf');                                                                            
      res.setHeader('Content-Disposition', `attachment; filename="${targetUrl.hostname}.pdf"`);
      res.setHeader('Content-Length', response.data.length);                                                                       
                                                                                                                                   
      return res.status(200).send(Buffer.from(response.data));                                                                     
                                                                                                                                   
    } catch (error) {                                                                                                              
      console.error('[PDFShift] 转换错误:', error);                                 
                                                                                                                                   
      if (axios.isAxiosError(error)) {                                                                                             
        const status = error.response?.status;                                                                                     
        const data = error.response?.data;                                                                                         
                                                                                    
        if (status === 401) {                                                                                                      
          return res.status(500).json({                                             
            error: 'PDF 生成失败',                                                                                                 
            details: 'API Key 无效，请检查 PDFSHIFT_API_KEY 环境变量',                                                             
          });                                                                                                                      
        }                                                                                                                          
                                                                                                                                   
        if (data) {                                                                                                                
          const errorText = Buffer.isBuffer(data) ? data.toString() : JSON.stringify(data);
          return res.status(500).json({                                                                                            
            error: 'PDF 生成失败',                                                                                                 
            details: errorText,                                                                                                    
          });                                                                                                                      
        }                                                                                                                          
      }                                                                                                                            
                                                                                                                                   
      const errorMessage = error instanceof Error ? error.message : '未知错误';                                                    
      return res.status(500).json({                                                                                                
        error: 'PDF 生成失败',                                                                                                     
        details: errorMessage,                                                                                                     
      });                                                                                                                          
    }                                                                                                                              
  }         
