import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Role } from '@/types';
import { Sparkles, Shield, User, Users, ArrowLeft, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, darkMode, toggleDarkMode } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleQuickLogin = (role: Role) => {
    login(role);
    toast.success(`Logged in as ${role}`);
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'staff') navigate('/staff/calendar');
    else navigate('/consumer/book');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter an email');
    if (email.includes('admin')) handleQuickLogin('admin');
    else if (email.includes('staff') || email.includes('emma') || email.includes('mia') || email.includes('olivia') || email.includes('sophia')) handleQuickLogin('staff');
    else handleQuickLogin('consumer');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-40 border-b bg-card/80 glass">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span className="font-semibold text-sm">Staff & Admin Login</span>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full h-8 w-8">
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6 mt-8">
        <div className="text-center section-fade">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in to your portal</p>
        </div>

        <Card className="section-fade" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="text-base">Sign In</CardTitle>
            <CardDescription>Enter your credentials or use quick login</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg h-10" />
              </div>
              <Button type="submit" className="w-full rounded-full h-10">Sign In</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="section-fade" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-base">Quick Demo Login</CardTitle>
            <CardDescription>Try any portal instantly</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl hover:border-primary/30" onClick={() => handleQuickLogin('admin')}>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Admin Portal</p>
                <p className="text-xs text-muted-foreground">admin@salon.com</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl hover:border-primary/30" onClick={() => handleQuickLogin('staff')}>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Staff Portal</p>
                <p className="text-xs text-muted-foreground">emma@salon.com</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl hover:border-primary/30" onClick={() => handleQuickLogin('consumer')}>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Client Portal</p>
                <p className="text-xs text-muted-foreground">consumer@salon.com</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
