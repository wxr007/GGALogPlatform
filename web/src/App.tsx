import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DatasetList from './pages/DatasetList'
import DatasetDetail from './pages/DatasetDetail'
import Admin from './pages/Admin'
import AdminUserDatasets from './pages/AdminUserDatasets'
import Layout from './components/Layout'
import { useAuthStore } from './store/auth.store'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  const { isAuthenticated, loadUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      loadUser()
    }
  }, [isAuthenticated, loadUser])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="datasets" element={<DatasetList />} />
        <Route path="datasets/:id" element={<DatasetDetail />} />
        <Route path="admin" element={<Admin />} />
        <Route path="admin/users/:id/datasets" element={<AdminUserDatasets />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App
