import { CheckSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side — branding */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 text-white lg:flex lg:w-1/2">
        <div className="flex items-center gap-2">
          <CheckSquare className="size-8" />
          <span className="text-2xl font-bold tracking-tight">TaskFlow</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Управляйте проектами.
            <br />
            Достигайте целей.
          </h1>
          <p className="max-w-md text-lg text-indigo-200">
            Планируйте задачи, отслеживайте прогресс и работайте в команде —
            всё в одном месте.
          </p>
        </div>

        <p className="text-sm text-indigo-300">
          © {new Date().getFullYear()} TaskFlow. Все права защищены.
        </p>
      </div>

      {/* Right side — auth form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <CheckSquare className="size-7 text-indigo-600" />
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
