import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { Input } from '../components/Input.js';
import { Button } from '../components/Button.js';
import { Alert } from '../components/Alert.js';
import { Truck, Lock } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@nagpurmaterials.local');
  const [password, setPassword] = useState('AdminSecurePass123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await authService.login(email, password);
      navigate('/admin');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex bg-amber-600 text-white p-3 rounded-2xl shadow-lg mb-3">
          <Truck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Operations Portal</h2>
        <p className="text-xs text-slate-400 mt-1">Nagpur Building Materials Platform — MVP</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 space-y-6">
          {errorMsg && <Alert type="error" title="Authentication Error" message={errorMsg} />}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nagpurmaterials.local"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              Sign in to Operations
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Development Seed Credentials:
            <br />
            <span className="font-mono text-slate-700">admin@nagpurmaterials.local / AdminSecurePass123!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
