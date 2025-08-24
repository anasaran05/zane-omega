
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { GlowButton, OutlineButton } from '@/components/Button';
import Card, { CardContent } from '@/components/Card';
import { Play, BookOpen, Award, BarChart3, Users, Zap } from 'lucide-react';

const stats = [
  { label: 'Students Trained', value: '500+', icon: Users },
  { label: 'Job Placement Rate', value: '95%', icon: BarChart3 },
  { label: 'Industry Partners', value: '50+', icon: Award },
  { label: 'Student Rating', value: '4.8/5', icon: Zap },
];

const features = [
  {
    icon: BookOpen,
    title: 'Comprehensive Curriculum',
    description: 'Master healthcare administration through expert-guided training programs and real-world simulations.'
  },
  {
    icon: Award,
    title: 'Industry Recognition',
    description: 'Earn certifications recognized by leading healthcare organizations and regulatory bodies.'
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed analytics and personalized feedback.'
  },
  {
    icon: Zap,
    title: 'Interactive Learning',
    description: 'Engage with immersive simulations and hands-on exercises that mirror real scenarios.'
  }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-surface-elevated" />
        <div className="relative theme-container py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-full mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Next-Generation Training Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-heading font-bold mb-6 animate-fade-out">
              ZANE <span className="theme-text-gradient">Ω</span>MEGA
            </h1>
            
            <div className="text-lg text-muted-foreground mb-4 animate-fade-in">
              ZaneProEd Workplace Studio
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-heading font-semibold text-foreground mb-8 animate-fade-in">
              Real Healthcare Training Simulation
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in">
              Master healthcare administration, patient management, and regulatory affairs through 
              immersive simulations and expert-guided training programs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Link href="/courses">
                <GlowButton size="lg" icon={<Play className="w-5 h-5" />}>
                  Start Training
                </GlowButton>
              </Link>
              
              
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-surface-elevated">
        <div className="theme-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={stat.label}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="text-3xl font-heading font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="theme-container">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
              Why Choose ZANE Workplace?
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of healthcare training with our comprehensive platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title}
                  variant="elevated"
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-surface-elevated rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-heading font-semibold text-foreground mb-3">
                          {feature.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-surface-elevated">
        <div className="theme-container text-center">
          <h3 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-6">
            Ready to Transform Your Healthcare Career?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals who have advanced their careers through our training programs.
          </p>
          
          <Link href="/courses">
            <GlowButton size="lg" icon={<BookOpen className="w-5 h-5" />}>
              Explore Courses
            </GlowButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
