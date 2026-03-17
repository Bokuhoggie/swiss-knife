import { Link } from 'react-router-dom'

const TOOLS = [
  {
    name: 'Image Converter',
    icon: '🖼',
    desc: 'JPG, PNG, WebP, AVIF, GIF, BMP, TIFF',
    to: '/image',
    color: 'rgba(59,130,246,0.2)',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.2)',
    badge: 'Batch',
  },
  {
    name: 'Audio Converter',
    icon: '🎵',
    desc: 'MP3, WAV, FLAC, AAC, OGG, M4A',
    to: '/audio',
    color: 'rgba(236,72,153,0.2)',
    bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.2)',
    badge: 'FFmpeg',
  },
  {
    name: 'Video Converter',
    icon: '🎬',
    desc: 'MP4, MKV, AVI, MOV, WebM',
    to: '/video',
    color: 'rgba(239,68,68,0.2)',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.2)',
    badge: 'FFmpeg',
  },
  {
    name: 'Downloader',
    icon: '⬇',
    desc: 'YouTube, Twitter, Reddit + more',
    to: '/download',
    color: 'rgba(34,197,94,0.2)',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.2)',
    badge: 'yt-dlp',
  },
  {
    name: 'PDF Tools',
    icon: '📄',
    desc: 'Merge, split, compress PDFs',
    to: '/pdf',
    color: 'rgba(245,158,11,0.2)',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.2)',
    badge: 'Local',
  },
  {
    name: 'File Hasher',
    icon: '🔐',
    desc: 'MD5, SHA-1, SHA-256, SHA-512',
    to: '/hash',
    color: 'rgba(124,111,255,0.2)',
    bg: 'rgba(124,111,255,0.12)',
    border: 'rgba(124,111,255,0.2)',
    badge: 'Verify',
  },
]

export default function Home() {
  return (
    <div className="page-anim">
      <div className="page-header">
        <h1 className="page-title">Welcome to Swiss Knife 🔪</h1>
        <p className="page-subtitle">All your file tools in one place — private, fast, and offline.</p>
      </div>

      <div className="tools-grid">
        {TOOLS.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            className="tool-card"
            style={{
              '--card-color': tool.color,
              '--card-bg': tool.bg,
              '--card-border': tool.border,
            }}
          >
            <div className="tool-card-icon">{tool.icon}</div>
            <div>
              <div className="tool-card-name">{tool.name}</div>
              <div className="tool-card-desc">{tool.desc}</div>
            </div>
            <div className="tool-card-badge">{tool.badge}</div>
          </Link>
        ))}
      </div>

      <div className="section-divider" style={{ marginTop: 36 }} />

      <div style={{ display: 'flex', gap: 12, color: 'var(--text-muted)', fontSize: 12, alignItems: 'center' }}>
        <span>🔒 100% local processing</span>
        <span>·</span>
        <span>⚡ Powered by FFmpeg, Sharp & yt-dlp</span>
        <span>·</span>
        <span>🚫 No uploads, no limits</span>
      </div>
    </div>
  )
}
