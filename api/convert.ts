  import type { VercelRequest, VercelResponse } from '@vercel/node';                                                               
  import axios from 'axios';                                                                                                       
                                                                                                                                   
  /**                                                                                                                              
   * Vercel Serverless Function - PDF 转换 API                                                                                     
   * 使用 PDFShift 外部服务生成 PDF                                                                                                
   */                                    
                                                                                                                                   
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
      return res.status(400).json({ error: 'URL 格式无效，请提供完整的网址（如 https://example.com）' });                          
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
          format: '1440xauto',                                                                                                     
          delay: 3000,                                                                                                             
          lazy_load_images: true,                                                                                                  
          javascript: `                                                                                                            
            window.pdfshiftReady = function() { return false; };                                                                   
            (async () => {                                                                                                         
              var wait = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };                                 
              var getHeight = function() {                                                                                         
                return Math.max(                                                                                                   
                  document.body.scrollHeight,                                                                                      
                  document.documentElement.scrollHeight                                                                            
                );                                                                                                                 
              };                                                                                                                   
              var vh = window.innerHeight;                                                                                         
              var h = getHeight();                                                                                                 
              for (var y = 0; y < h; y += vh) {                                                                                    
                window.scrollTo(0, y);                                                                                             
                await wait(300);                                                                                                   
                h = getHeight();                                                                                                   
              }                                                                                                                    
              window.scrollTo(0, getHeight());                                                                                     
              await wait(1000);                                                                                                    
              var finalH = getHeight();                                                                                            
              document.documentElement.style.setProperty('min-height', finalH + 'px', 'important');                                
              document.body.style.setProperty('min-height', finalH + 'px', 'important');                                           
              window.scrollTo(0, 0);                                                                                               
              await wait(200);                                                                                                     
              window.pdfshiftReady = function() { return true; };                                                                  
            })();                                                                                                                  
          `,                                                                                                                       
          wait_for: 'pdfshiftReady',                                                                                               
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
