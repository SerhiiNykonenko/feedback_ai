import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, signIn } from "@/server/auth";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { LocalizedText } from "@/components/localized-text";
import Image from "next/image";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard"
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=CredentialsSignin");
    throw error;
  }
}

const demoAccounts = [
  { label: "Employee", email: "nykonenko_sv@groupbwt.com" },
  { label: "Manager", email: "nykonenko_sv+manager@groupbwt.com" },
  { label: "HR", email: "nykonenko_sv+hr@groupbwt.com" },
  { label: "Admin", email: "nykonenko_sv+admin@groupbwt.com" }
];

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))]">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="hidden lg:block">
          <Image
            src="/brand/bwt-logo.png"
            alt="BWT"
            width={190}
            height={95}
            className="mb-8 h-auto w-40"
            priority
          />
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-sm text-muted-foreground shadow-soft backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Feedback workflows for software teams
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
            Make performance feedback clear, timely, and actually useful.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Run review cycles, collect structured feedback, track approvals, and give HR, managers,
            and employees the right view of progress.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "RBAC first",
                copy: "Every route and action checks permissions."
              },
              {
                icon: Users,
                title: "Team aware",
                copy: "Manager, HR, and admin scopes are separated."
              },
              {
                icon: Sparkles,
                title: "Fast reviews",
                copy: "Autosave, templates, search, and analytics included."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border bg-background/70 p-4 shadow-soft backdrop-blur"
              >
                <item.icon className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="mt-3 text-sm font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border bg-background/90 shadow-soft backdrop-blur">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <Image src="/brand/bwt-logo.png" alt="BWT" width={92} height={46} priority />
              <LanguageSwitcher />
            </div>
            <CardTitle className="text-2xl">
              <LocalizedText textKey="welcomeBack" />
            </CardTitle>
            <CardDescription>
              <LocalizedText textKey="loginSubtitle" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {params.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <LocalizedText textKey="loginFailed" />
              </div>
            ) : null}

            <form action={loginAction} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
                  <LocalizedText textKey="email" />
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nykonenko_sv@groupbwt.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
                  <LocalizedText textKey="password" />
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password123!"
                  required
                />
              </div>
              <Button className="w-full" type="submit">
                <LocalizedText textKey="signIn" />
              </Button>
            </form>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <LocalizedText textKey="demoAccounts" />
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <form key={account.email} action={loginAction}>
                    <input type="hidden" name="email" value={account.email} />
                    <input type="hidden" name="password" value="Password123!" />
                    <Button className="w-full" type="submit" variant="outline" size="sm">
                      {account.label}
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
