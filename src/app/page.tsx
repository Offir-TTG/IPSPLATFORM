import Link from 'next/link';
import { ArrowRight, BookOpen, Video, Users, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Parenting School</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/programs" className="text-sm font-medium hover:text-primary">
              Programs
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              About
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold mb-6">
            Master the Art of Parenting
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join expert-led live classes, connect with other parents, and access proven strategies
            to raise confident, happy children.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/programs"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 flex items-center"
            >
              Explore Programs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/about"
              className="border border-input px-6 py-3 rounded-md font-medium hover:bg-accent"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-6 rounded-lg border">
              <Video className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Live Classes</h3>
              <p className="text-muted-foreground">
                Interactive Zoom sessions with expert instructors and Q&A support
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border">
              <BookOpen className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Rich Content</h3>
              <p className="text-muted-foreground">
                Access recordings, materials, and resources anytime, anywhere
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground">
                Connect with parents on the same journey and share experiences
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border">
              <Award className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Certification</h3>
              <p className="text-muted-foreground">
                Earn certificates upon completion of programs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Parenting Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of parents who have already improved their family life
          </p>
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-md text-lg font-medium hover:bg-primary/90 inline-flex items-center"
          >
            Start Your Journey Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Parenting School Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
