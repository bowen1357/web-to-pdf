  import type { VercelRequest, VercelResponse } from '@vercel/node';                                                               
  import axios from 'axios';                                                                                                       
                                                                                                                                   
  /**                                                                                                                              
   * Vercel Serverless Function - PDF 转换 API                                                                                     
   * 使用 PDFShift 外部服务生成 PDF                                                                                                
   */                                                                                                                              
                                                                                                                                   
  export default async function handler(req: VercelRequest, res: VercelResponse) {                                                 
    // 设置 CORS 头                                                                                                                
    res.setHeader('Access-Control-Allow-Origin', '*');                                                                             
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');                                                                
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');                                                                 
                                                                                                                                   
    // 处理预检请求                                                                                                                
    if (req.method === 'OPTIONS') {                                                                                                
      return res.status(200).end();                                                                                                
    }                                                                                                                              
                                                                                                                                   
    // 只允许 POST 请求                                                                                                            
    if (req.method !== 'POST') {                                                                                                   
      return res.status(405).json({ error: '只支持 POST 请求' });                                                                  
    }                                                                                                                              
                                                                                                                                   
    const { url } = req.body;                                                                                                      
                                                                                                                                   
    // 验证 URL                                                                                                                    
    if (!url || typeof url !== 'string') {                                           
      return res.status(400).json({ error: '请提供有效的 URL' });                                                                  
    }                                                                                                                              
                                                                                                                                   
    // 验证 URL 格式                                                                                                               
    let targetUrl: URL;                                                                                                            
    try {                                                                                                                          
      targetUrl = new URL(url);                                                                                                    
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {                                                                     
        throw new Error('只支持 HTTP 和 HTTPS 协议');                                                                              
      }                                                                                                                            
    } catch (error) {                                                                                                              
      return res.status(400).json({ error: 'URL 格式无效，请提供完整的网址（如 https://example.com）' });                          
    }                                                                                                                              
                                                                                                                                   
    // 获取 API Key                                                                                                                
    const apiKey = process.env.PDFSHIFT_API_KEY;                                     
                                                                                                                                   
    // 如果没有配置 API Key，返回提示                                                                                              
    if (!apiKey) {                                                                                                                 
      return res.status(503).json({                                                                                                
        error: 'PDF 服务未配置',                                                                                                   
        message: '请在 Vercel Dashboard 中配置 PDFSHIFT_API_KEY 环境变量',                                                         
      });                                                                                                                          
    }                                                                                                                              
                                                                                                                                   
    try {                                                                                                                          
      console.log(`[PDFShift] 开始转换: ${targetUrl.toString()}`);                                                                 
                                                                                                                                   
      // 调用 PDFShift API                                                                                                         
      const response = await axios.post(                                                                                           
        'https://api.pdfshift.io/v3/convert/pdf',                                                                                  
        {                                                                                                                          
 source: targetUrl.toString(),                                                                                            
          // 1440px 宽 × 20000px 高（足够覆盖绝大多数长页面）                                                                      
          format: '1440x20000',                                                                                                    
          // 页面初始加载等待时间（wait_for 会确保 JS 执行完成再截图）                                                             
          delay: 3000,                                                                                                             
          // 逐屏滚动触发懒加载，完成后通过 pdfshiftReady 通知 PDFShift                                                            
          javascript: `                                                                                                            
            window.pdfshiftReady = function() { return false; };                                                                   
            (async () => {                                                                                                         
              try {                                                                                                                
                var s = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };                                  
                var h = function() { return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight); };        
                var total = h();                                                                                                   
                for (var y = 0; y < total && y < 150 * window.innerHeight; y += window.innerHeight) {                              
                  window.scrollTo(0, y);                                                                                           
                  await s(400);                                                                                                    
                  total = Math.max(total, h());                                                                                    
                }                                                                                                                  
                window.scrollTo(0, total);                                                                                         
                await s(2000);                                                                                                     
                window.scrollTo(0, 0);                                                                                             
                await s(500);                                                                                                      
              } catch(e) {}                                                                                                        
              window.pdfshiftReady = function() { return true; };                                                                  
            })();                                                                                                                  
          `,                                                                                                                       
          wait_for: 'pdfshiftReady',                                                                                               
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
                                                                                                                                   
      // 设置响应头并返回 PDF                                                                                                      
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
                                                                                                                                   
        if (status === 400) {                                                                                                      
          return res.status(500).json({                                                                                            
            error: 'PDF 生成失败',                                                                                                 
            details: '请求参数错误，请检查 URL 格式',                                                                              
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
