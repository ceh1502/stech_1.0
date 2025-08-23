import React, { useState } from 'react';
import './ProfileMain.css';
import './ProfileManage.css';

const ProfileManage = () => {
  const [uploadStatus, setUploadStatus] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/excel", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadStatus("정상적으로 업로드 됨 ✅");
      } else {
        setUploadStatus("업로드 실패 ❌");
      }
    } catch (error) {
      console.error(error);
      setUploadStatus("서버 오류 ❌");
    }
  };

  return (
    <div className="profile-main">
      <div className="profile-buttons-top">
        <a href="./teamplayer" className="profile-button">팀 선수 스탯</a>
        <a href="./modify" className="profile-button">프로필 수정</a>
        <a href="./clip" className="profile-button">메모 클립 영상</a>
        <a href="./manage" className="profile-button active">구단 관리</a>
      </div>

      <div className="profile-manage-container">

        <div className="manage-item">
          <div className="manage-label">1. 선수단 명단</div>
          <div className="manage-actions">
            <label htmlFor="excel-upload" className="excel-upload-btn">
              엑셀 파일 업로드
            </label>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <span className="upload-hint">{uploadStatus}</span>
          </div>
        </div>


        <div className="manage-item">
          <div className="manage-label">2. 플레이북</div>
          <div className="manage-status">출시 예정</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManage;
