import { requireGuest } from "@/lib/guards";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await requireGuest();

  return <LoginForm />;
}