import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from "./components/ProtectedRoute";
import UsersPage from "./pages/UsersPage";
import UserDetails from "./pages/UserDetails";
import AddUser from "./pages/AddUser";
import BrandTreasuryPage from "./pages/BrandTreasuryPage";
import MasterDataPage from "./pages/MasterDataPage";
import AddBrandTreasuryPage from "./pages/AddBrandTreasuryPage";
import ViewBrandTreasuryPage from "./pages/ViewBrandTreasuryPage";
import BrandTreasuryList from "./pages/BrandTreasuryList";
import JobCreate from "./pages/JobCreate";
import JobList from "./pages/JobList";
import JobViewPage from "./pages/JobViewPage";

function App() {

  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/healthcheck" element={<HealthCheck />} />

          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/user/:id" element={<UserDetails />} />
            <Route path="/adduser" element={<AddUser />} />
            {/* <Route path="/brand-treasury" element={<BrandTreasuryPage />} /> */}
            <Route path="/add-brand-treasury" element={<AddBrandTreasuryPage />} />
            <Route path="/masterdata" element={<MasterDataPage />} />
            <Route path="/view-brandtreasury/:fileId" element={<ViewBrandTreasuryPage />} />
            <Route path="/brand-treasury" element={<BrandTreasuryList />} />
            <Route path="/create-artwork" element={<JobCreate />} />
            <Route path="/artworks" element={<JobList />} />
            <Route path="/artwork/:fileId" element={<JobViewPage />} />
            </Route>
          </Route>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
