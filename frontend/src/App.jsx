import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Settings from './pages/Settings';

// Dashboard Layout & Pages
import DashboardLayout from './layouts/DashboardLayout';
import DashboardOverview from './pages/Dashboard/Overview';
import DashboardDaily from './pages/Dashboard/Daily';
import DashboardPlanned from './pages/Dashboard/Planned';
import DashboardStatistics from './pages/Dashboard/Statistics';

// Teacher Dashboard Layout & Pages
import TeacherDashboardLayout from './layouts/TeacherDashboardLayout';
import TeacherDashboardOverview from './pages/TeacherDashboard/Overview';
import TeacherDashboardAnalytics from './pages/TeacherDashboard/Analytics';
import TeacherDashboardAssign from './pages/TeacherDashboard/Assign';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

        {/* Student Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="daily" element={<DashboardDaily />} />
          <Route path="planned" element={<DashboardPlanned />} />
          <Route path="statistics" element={<DashboardStatistics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Teacher Dashboard */}
        <Route 
          path="/teacher-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <TeacherDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboardOverview />} />
          <Route path="analytics" element={<TeacherDashboardAnalytics />} />
          <Route path="assign" element={<TeacherDashboardAssign />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
