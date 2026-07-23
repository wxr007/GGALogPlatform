import { useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Button } from 'antd'
import {
  DashboardOutlined,
  FolderOutlined,
  LogoutOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store/auth.store'

const { Header, Content, Sider } = AntLayout

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

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
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div style={{
          padding: collapsed ? '16px 0' : '16px',
          textAlign: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          {collapsed ? '' : 'GGA数据平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        {!collapsed && (
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
        )}
      </Sider>
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <span>欢迎, {user?.username}</span>
          </div>
          <LogoutOutlined onClick={handleLogout} style={{ cursor: 'pointer', fontSize: 18 }} />
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
