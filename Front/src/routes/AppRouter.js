import { Routes, Route } from 'react-router-dom';

import * as LandingPages from '../pages/Landing';
import * as ServicePages from '../pages/Service';
import * as CommonPages from '../pages/Common';

export default function AppRouter() {
  return (
    <Routes>
      {/* Landing Pages */}
      <Route path="/" element={<LandingPages.LandingHome />} />
      <Route path="/team" element={<LandingPages.TeamPage />} />

      {/* Service Pages */}
      <Route path="/service" element={<ServicePages.ServiceLayout />}>
        <Route index element={<ServicePages.ServiceHome />} />
        <Route path="clip" element={<ServicePages.ClipPage />} />
        <Route path="data" element={<ServicePages.DataPage />} />
        <Route path="login" element={<ServicePages.LoginPage />} />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<CommonPages.NotFoundPage />} />
    </Routes>
  );
}
