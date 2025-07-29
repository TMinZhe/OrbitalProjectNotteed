import LoginPrompt from "../components/LoginPrompt/LoginPrompt";
import SignupPrompt from "../components/SignupPrompt/SignupPrompt";

import { useLocation } from 'react-router-dom';

// Login/Signup Page
export default function AccountPage() {
  const location = useLocation(); // Gets URL
  const urlKeys = new URLSearchParams(location.search); 
  const action = urlKeys.get('action'); // 'login' or 'signup'

  return (
    <>
      {action === 'signup' ? <SignupPrompt /> : <LoginPrompt />}
    </>
  );
}