import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Home', to: '/', icon: '⌂', section: 'General' },
  { label: 'Image Converter', to: '/image', icon: '🖼', section: 'Convert' },
  { label: 'Audio Converter', to: '/audio', icon: '🎵', section: 'Convert' },
  { label: 'Video Converter', to: '/video', icon: '🎬', section: 'Convert' },
  { label: 'Downloader', to: '/download', icon: '⬇', section: 'Download' },
  { label: 'PDF Tools', to: '/pdf', icon: '📄', section: 'Documents' },
  { label: 'File Hasher', to: '/hash', icon: '🔐', section: 'Utilities' },
]

const sections = [...new Set(NAV_ITEMS.map(i => i.section))]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🔪</div>
          <span className="sidebar-logo-text">Swiss Knife</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {NAV_ITEMS.filter(i => i.section === section).map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">Swiss Knife v0.1.0</div>
      </div>
    </aside>
  )
}
