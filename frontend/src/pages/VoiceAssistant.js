import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VoiceAssistant() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/app/tino-ai');
  }, [navigate]);
  return null;
}
