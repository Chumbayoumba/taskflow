import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Kanban,
  Users,
  BarChart3,
  Bell,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-xl">TaskFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Войти</Button>
            </Link>
            <Link href="/register">
              <Button>Начать бесплатно</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Управление задачами нового поколения
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Управляйте проектами.
            <br />
            <span className="text-indigo-600">Достигайте целей.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8">
            TaskFlow — это SaaS-платформа для управления задачами с Kanban-доской,
            аналитикой и уведомлениями. Всё что нужно вашей команде в одном месте.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8">
                Начать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Всё для эффективной работы
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Набор инструментов, который поможет вашей команде работать быстрее и слаженнее
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Kanban,
                title: "Kanban-доска",
                desc: "Drag-and-drop задачи между статусами. Визуальный контроль прогресса.",
                color: "bg-sky-50 text-sky-600",
              },
              {
                icon: Users,
                title: "Команды",
                desc: "Создавайте проекты, приглашайте участников, назначайте задачи.",
                color: "bg-indigo-50 text-indigo-600",
              },
              {
                icon: BarChart3,
                title: "Аналитика",
                desc: "Статистика задач, приоритеты, просроченные дедлайны — всё на виду.",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                icon: Bell,
                title: "Уведомления",
                desc: "Мгновенные уведомления о дедлайнах, назначениях и изменениях.",
                color: "bg-amber-50 text-amber-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Создайте проект", desc: "Зарегистрируйтесь и создайте свой первый проект за несколько кликов." },
              { step: "02", title: "Добавьте задачи", desc: "Создавайте задачи, назначайте приоритеты и устанавливайте дедлайны." },
              { step: "03", title: "Управляйте прогрессом", desc: "Перетаскивайте задачи по Kanban-доске и отслеживайте аналитику." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-indigo-200 mb-8 text-lg">
            Присоединяйтесь и управляйте проектами эффективнее
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-base px-8">
              Создать аккаунт бесплатно
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-indigo-600" />
            <span>TaskFlow</span>
          </div>
          <p>© {new Date().getFullYear()} TaskFlow. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
