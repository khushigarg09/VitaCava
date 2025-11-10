import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Film, Utensils, MessageSquare, Settings, Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/health', label: 'Health', icon: Heart },
  { to: '/entertainment', label: 'Movies', icon: Film },
  { to: '/food', label: 'Food', icon: Utensils },
  { to: '/social', label: 'Social', icon: MessageSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Navigation() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="glass-strong border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">V</span>
              </div>
              <span className="text-xl font-bold text-foreground">VitaCava</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <NavLinks />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="w-9 h-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                U
              </AvatarFallback>
            </Avatar>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 glass-strong">
                <div className="flex flex-col gap-2 mt-8">
                  <NavLinks onClick={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
