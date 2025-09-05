import { useNavigate } from "react-router-dom";
import VideoSettingModal from "../../../../components/VideoSettingModal";
import '../../../../'


export default function VideoSettingsPage() {
  const navigate = useNavigate();
  return (
    <VideoSettingModal onClose={() => navigate(-1)} />
  );
}