// src/pages/Service/ServiceLayout/index.js
import React, { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import ServiceSidebar from "./ServiceSidebar";
import SupportModal from "../../../components/SupportModal";
import ServiceHeader from "../../Service/ServiceLayout/ServiceHeader";
import UploadVideoModal from "../../../components/UploadVideoModal.jsx";
import "./index.css";

const ServiceLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <div className="serviceLayoutContainer">
        <ServiceSidebar className="serviceSidebar" />

        <main className="flex-1">
          {location.pathname.startsWith("/service/game") && (
            <ServiceHeader onNewVideo={() => setShowUpload(true)} />
          )}
          {location.pathname.startsWith("/service/guest/game") && (
            <ServiceHeader onNewVideo={() => setShowUpload(true)} />
          )}
          <Outlet />
        </main>
      </div>

      <UploadVideoModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => console.log("upload ok")}
      />

      {/* ---------- 3. 모달 ---------- */}
      {location.pathname.startsWith("/service/support") && (
        <SupportModal onClose={() => navigate(-1)} />
      )}
    </>
  );
};

export default ServiceLayout;
