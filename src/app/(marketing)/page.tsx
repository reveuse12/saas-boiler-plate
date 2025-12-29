/**
 * Marketing Landing Page
 * Hero section, features, and CTA
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, Zap, Database, Code, Layers } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <div className="flex max-w-[980px] flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Build your SaaS faster with our{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              production-ready
            </span>{" "}
            boilerplate
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Multi-tenant architecture, authentication, and everything you need
            to launch your next SaaS product. Built with Next.js, TypeScript,
            and Tailwind CSS.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started Free
            </Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Documentation
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              Features
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to build a modern SaaS application
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-3 mt-12">
            <FeatureCard
              icon={<Layers className="h-10 w-10 text-primary" />}
              title="Multi-Tenant"
              description="Subdomain-based multi-tenancy with complete data isolation between tenants."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Authentication"
              description="Secure authentication with NextAuth.js v5, including role-based access control."
            />
            <FeatureCard
              icon={<CheckCircle className="h-10 w-10 text-primary" />}
              title="Type-Safe"
              description="End-to-end type safety with TypeScript, Zod validation, and Drizzle ORM."
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="Modern Stack"
              description="Built with Next.js 15, React Server Components, and Tailwind CSS."
            />
            <FeatureCard
              icon={<Database className="h-10 w-10 text-primary" />}
              title="Database Ready"
              description="PostgreSQL with Drizzle ORM, optimized for serverless with Neon."
            />
            <FeatureCard
              icon={<Code className="h-10 w-10 text-primary" />}
              title="Developer Experience"
              description="Hot reload, strict TypeScript, ESLint, and comprehensive documentation."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
            Ready to get started?
          </h2>
          <p className="max-w-[600px] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Create your account and start building your SaaS today.
          </p>
          <Link href="/signup">
            <Button size="lg">Start Building</Button>
          </Link>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
