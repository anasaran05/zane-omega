import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlowButton } from '@/components/Button';
import { Play, BookOpen, Award, BarChart3, Zap } from 'lucide-react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '@/firebase'; // your firebase.ts export

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

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartTraining = () => {
    if (loading) return;
    if (isAuthenticated) {
      navigate('/courses'); // or /dashboard if that's your landing
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-surface-elevated" />
        <div className="relative theme-container text-center py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-full mb-8 animate-fade-in">
              <span className="text-2xl text-muted-foreground">WELCOME 👋🏻</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-heading font-bold mb-6 animate-fade-in">
              <span className="text-white">ZANE</span>{' '}
              <span className="text-primary">ΩMEGA</span>
            </h1>

            <div className="text-lg text-muted-foreground mb-4 animate-fade-in">
              by ZaneProEd
            </div>

            <h2 className="text-3xl lg:text-4xl font-heading font-semibold text-foreground mb-8 animate-fade-in">
              Next-Gen Healthcare Training Simulation
            </h2>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in">
              Master Your skills through immersive simulations and expert-guided training programs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <GlowButton
                size="lg"
                icon={<Play className="w-5 h-5" />}
                className="bg-[#b00610] hover:bg-[#b00900] text-white"
                onClick={handleStartTraining}
                disabled={loading}
              >
                {loading
                  ? 'Loading...'
                  : isAuthenticated
                  ? 'Continue Training'
                  : 'Start Training'}
              </GlowButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
