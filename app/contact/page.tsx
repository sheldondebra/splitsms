import { redirect } from "next/navigation";

/** @deprecated Use /support */
export default function ContactPage() {
  redirect("/support");
}
