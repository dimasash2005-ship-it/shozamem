import Link from "next/link";
import UploadForm from "@/components/UploadForm";
import { IconClose } from "@/components/Icons";

export const metadata = { title: "Новий мем — SHO ZA MEM" };

export default function UploadPage() {
  return (
    <>
      <div style={{ padding: "14px 16px 0" }}>
        <Link href="/" className="icon-btn" aria-label="Закрити">
          <IconClose />
        </Link>
      </div>
      <UploadForm />
    </>
  );
}
