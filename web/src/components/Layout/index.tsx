import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu } from 'antd'
import {
  DashboardOutlined,
  FolderOutlined,
  LogoutOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store/auth.store'
import { useMemo } from 'react'

const { Header, Content, Sider } = AntLayout

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = useMemo(() => {
    const items: any[] = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: '仪表盘'
      },
      {
        key: '/datasets',
        icon: <FolderOutlined />,
        label: '数据集'
      }
    ]

    if (user?.isAdmin) {
      items.push({
        key: '/admin',
        icon: <TeamOutlined />,
        label: '用户管理'
      })
    }

    return items
  }, [user?.isAdmin])

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ padding: '16px', textAlign: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          GGA数据平台
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          padding: '12px 16px',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 12,
          textAlign: 'center'
        }}>
          Build: {__BUILD_TIME__}
        </div>
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>欢迎, {user?.username}</span>
          <LogoutOutlined onClick={handleLogout} style={{ cursor: 'pointer', fontSize: '18px' }} />
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
