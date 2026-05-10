import { useState } from 'react'
import { FileText, Download, Loader2, Link2, AlertCircle, CheckCircle } from 'lucide-react'
import './App.css'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface ErrorInfo {
  message: string
  details?: string
}

function App() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [filename, setFilename] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError({ message: '请输入网页地址' })
      setStatus('error')
      return
    }

    // 验证 URL 格式
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    try {
      new URL(targetUrl)
    } catch {
      setError({ message: '请输入有效的网址' })
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)
    setDownloadUrl(null)

    try {
      // 调用后端 API 生成 PDF
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || data.details || '转换失败，请稍后重试')
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition')
      let downloadFilename = 'converted.pdf'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          downloadFilename = match[1]
        }
      }
      setFilename(downloadFilename)

      // 创建下载链接
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      setDownloadUrl(downloadUrl)
      setStatus('success')

      // 自动触发下载
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = downloadFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : '转换失败',
      })
      setStatus('error')
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'converted.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setError(null)
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
    }
    setDownloadUrl(null)
    setFilename('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">网页转PDF</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              一键将网页转为 PDF
            </h2>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              输入任意网页链接，即可生成高质量的 PDF 文件，支持下载保存
            </p>
          </div>

          {/* Input Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
            {status === 'success' ? (
              // Success State
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">转换成功！</h3>
                <p className="text-gray-600 mb-6">
                  PDF 文件已生成并自动下载
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    再次下载
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    转换其他网页
                  </button>
                </div>
              </div>
            ) : (
              // Input Form
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="url"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    网页地址
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Link2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {status === 'error' && error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {error.message}
                      </p>
                      {error.details && (
                        <p className="text-sm text-red-600 mt-1">
                          {error.details}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在转换...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      开始转换
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">高质量输出</h3>
              <p className="text-sm text-gray-600">保留原始网页的样式和布局</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">一键下载</h3>
              <p className="text-sm text-gray-600">转换完成后自动下载 PDF</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">支持任意网页</h3>
              <p className="text-sm text-gray-600">兼容绝大多数网站链接</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>网页转PDF工具 &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
