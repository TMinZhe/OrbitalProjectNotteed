import LoginPrompt from "../components/LoginPrompt/LoginPrompt";
import SignupPrompt from "../components/SignupPrompt/SignupPrompt";

import { useLocation } from 'react-router-dom';

export default function AccountPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const action = params.get('action'); // 'login' or 'signup'

  return (
    <>
      {action === 'signup' ? <SignupPrompt /> : <LoginPrompt />}
    </>
  );
}