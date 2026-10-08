import LoginForm from '@/components/LoginForm';

// Safely export the config from a Server Component
export const instant = false;

export default function LoginPage() {
  return <LoginForm />;
}