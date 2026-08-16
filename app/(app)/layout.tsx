import Link from "next/link";
import { getSession } from "@/lib/auth";
import SignOutButton from "./sign-out-button";

const ROLE_LABEL: Record<string, string> = {
  PURCHASING: "采购",
  WAREHOUSE: "仓库",
  FINANCE: "财务",
  ADMIN: "管理员",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold">
              Sisleyhome ERP
            </Link>
            <nav className="flex gap-4 text-sm text-gray-600">
              <Link href="/suppliers" className="hover:text-gray-900">
                供应商
              </Link>
              <Link href="/purchase" className="hover:text-gray-900">
                采购订单
              </Link>
              <Link href="/purchase/upload" className="hover:text-gray-900">
                拍照上传
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {session && (
              <span>
                {session.name} · {ROLE_LABEL[session.role] ?? session.role}
              </span>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
