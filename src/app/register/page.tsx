import { requireGuest } from "@/lib/guards";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  await requireGuest();

  return <RegisterForm />;
}