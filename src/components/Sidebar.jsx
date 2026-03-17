import { NavLink } from 'react-router-dom'
import {
  IconHome, IconImage, IconAudio, IconVideo,
  IconDownload, IconPDF, IconHash,
  IconChevronLeft, IconChevronRight, IconKnife
} from './Icons.jsx'

const NAV_ITEMS = [
  { label: 'Home',            to: '/',         Icon: IconHome,     section: 'General'   },
  { label: 'Image Converter', to: '/image',    Icon: IconImage,    section: 'Convert'   },
  { label: 'Audio Converter', to: '/audio',    Icon: IconAudio,    section: 'Convert'   },
  { label: 'Video Converter', to: '/video',    Icon: IconVideo,    section: 'Convert'   },
  { label: 'Downloader',      to: '/download', Icon: IconDownload, section: 'Download'  },
  { label: 'PDF Tools',       to: '/pdf',      Icon: IconPDF,      section: 'Documents' },
  { label: 'File Hasher',     to: '/hash',     Icon: IconHash,     section: 'Utilities' },
]

const sections = [...new Set(NAV_ITEMS.map(i => i.section))]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <IconKnife size={18} />
          </div>
          {!collapsed && <span className="sidebar-logo-text">SWISS KNIFE</span>}
        </div>
        <button className="sidebar-collapse-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
          {NAV_ITEMS.filter(i => i.section === section).map((item) => {
              const NavIcon = item.Icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-item-icon"><NavIcon size={16} /></span>
                  <span className="nav-item-label">{item.label}</span>
                  <span className="nav-item-tooltip">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">{collapsed ? 'v0.1' : 'SWISS KNIFE v0.1.0'}</div>
      </div>
    </aside>
  )
}
