import { LoginView } from "@next-booking/cms-core";

export default function AdminLoginPage() {
  return <LoginView callbackUrl="/admin" />;
}
