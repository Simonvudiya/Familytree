import Link from "next/link";
import { BookOpen, TreePine, Clock, Users, PenTool, Search, Sparkles } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Family Stories",
    description: "Write, collect, and preserve stories from every generation with rich text editing and version history.",
    href: "/stories",
  },
  {
    icon: TreePine,
    title: "Visual Family Tree",
    description: "Build an interactive family tree with drag-and-drop relationships, photos, and life events.",
    href: "/tree",
  },
  {
    icon: Clock,
    title: "Family Timeline",
    description: "View your family's history chronologically with events, milestones, and historical context.",
    href: "/timeline",
  },
  {
    icon: Users,
    title: "People Profiles",
    description: "Create detailed profiles for each family member with biographies, photos, and relationships.",
    href: "/people",
  },
  {
    icon: PenTool,
    title: "Guided Autobiography",
    description: "Help loved ones write their life story with thoughtful prompts and structured chapters.",
    href: "/autobiography",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find any story, person, or memory instantly with full-text search across your archive.",
    href: "/search",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-background py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/images/patterns/heritage.png')] opacity-5" aria-hidden="true" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>New: AI-powered story suggestions & automatic chapter organization</span>
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              Preserve Your Family's
              <br />
              <span className="text-primary-600">Legacy</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              A beautiful platform to collect stories, build your family tree, create timelines,
              and compile a keepsake book that lasts for generations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free – No Credit Card
              </Link>
              <Link
                href="/stories"
                className="w-full sm:w-auto px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors"
              >
                Explore Features
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Trusted by 10,000+ families • SOC 2 certified • Your data, always yours
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Tell Your Family's Story
            </h2>
            <p className="text-lg text-muted-foreground">
              From individual memories to a complete family history book — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Three Steps to Your Family History Book
            </h2>
            <p className="text-lg text-muted-foreground">
              Our guided process makes it easy to go from scattered memories to a beautiful heirloom.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center relative">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold z-10">
                1
              </div>
              <div className="pt-10">
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">Gather</h3>
                <p className="text-muted-foreground">
                  Invite family members to share stories, upload photos, and fill in guided autobiography questions.
                </p>
              </div>
            </div>
            <div className="text-center relative">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold z-10">
                2
              </div>
              <div className="pt-10">
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">Organize</h3>
                <p className="text-muted-foreground">
                  Build your family tree, create timelines, tag stories, and let AI suggest chapter organization.
                </p>
              </div>
            </div>
            <div className="text-center relative">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold z-10">
                3
              </div>
              <div className="pt-10">
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">Publish</h3>
                <p className="text-muted-foreground">
                  Compile a professional family history book — export to PDF, print on demand, or share digitally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="font-serif text-2xl lg:text-3xl text-foreground italic leading-relaxed mb-6">
              &ldquo;We discovered stories about our great-grandparents that would have been lost forever.
              Now our children and grandchildren will know where they came from.&rdquo;
            </blockquote>
            <cite className="text-muted-foreground font-medium">— The Morrison Family, Seattle</cite>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
            Start Your Family History Today
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Free for up to 50 stories and 100 photos. No credit card required. Cancel anytime.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors shadow-lg"
          >
            Begin Your Journey
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Our Family History</h4>
              <p className="text-muted-foreground text-sm">
                Preserving family memories for generations to come.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/stories" className="hover:text-foreground">Stories</Link></li>
                <li><Link href="/tree" className="hover:text-foreground">Family Tree</Link></li>
                <li><Link href="/timeline" className="hover:text-foreground">Timeline</Link></li>
                <li><Link href="/autobiography" className="hover:text-foreground">Autobiography</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/templates" className="hover:text-foreground">Templates</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API Docs</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Our Family History. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}