import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  User,
  Building2,
  LogIn,
  ShieldCheck,
  Database,
  KeyRound,
  Mail,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ROLE_DESCRIPTIONS, ROLE_DEFAULT_PERMISSIONS } from '../data/mockData';
import { UserRoleAccount } from '../types/pos';
import { createPOSClient } from '../lib/supabase';

export const LoginScreen: React.FC = () => {
  const {
    users,
    companies,
    activeCompany,
    setActiveCompanyId,
    switchActiveRoleUser,
    loginSuccess,
    supabaseConfigured,
    supabaseTablesReady,
    notify,
  } = usePOS();

  const [authTab, setAuthTab] = useState<'POS_PIN' | 'SUPABASE_AUTH'>('POS_PIN');
  const [username, setUsername] = useState('ADMINISTRADOR');
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [email, setEmail] = useState('');
  const [supaPassword, setSupaPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#34d399', '#38bdf8', '#fbbf24', '#a7f3d0'];
    const particles = Array.from({ length: 55 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.85,
      vy: (Math.random() - 0.5) * 0.85,
      r: 1.8 + Math.random() * 2.4,
      color: colors[i % colors.length],
    }));

    let t = 0;
    const draw = () => {
      t += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Animated flowing light waves
      const waveConfigs = [
        { amp: 45, freq: 0.0025, speed: 1.0, yBase: h * 0.25, color: 'rgba(52, 211, 153, 0.22)' },
        { amp: 60, freq: 0.002, speed: -0.7, yBase: h * 0.72, color: 'rgba(56, 189, 248, 0.22)' },
        { amp: 35, freq: 0.003, speed: 1.3, yBase: h * 0.85, color: 'rgba(251, 191, 36, 0.16)' },
      ];

      waveConfigs.forEach((wc) => {
        ctx.beginPath();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = wc.color;
        for (let x = 0; x <= w; x += 12) {
          const y = wc.yBase + Math.sin(x * wc.freq + t * wc.speed) * wc.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Update & draw particles + connection lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 145) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(148, 210, 255, ${(1 - dist / 145) * 0.25})`;
            ctx.lineWidth = 0.9;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.75;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handlePosLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const sb = createPOSClient();
      if (sb) {
        const { data } = await sb
          .from('pos_users')
          .select('*')
          .ilike('username', username.trim())
          .eq('active', true)
          .maybeSingle();

        if (data) {
          if (data.pin !== pinOrPassword.trim()) {
            setErrorMsg('Contraseña / PIN incorrecto.');
            setLoading(false);
            return;
          }
          const dbUser: UserRoleAccount = {
            id: data.id,
            username: data.username,
            fullName: data.full_name,
            role: data.role as UserRoleAccount['role'],
            branch: data.branch,
            active: data.active,
            pin: data.pin,
            permissions:
              Array.isArray(data.permissions) && data.permissions.length > 0
                ? data.permissions
                : ROLE_DEFAULT_PERMISSIONS[data.role as UserRoleAccount['role']] || ['ALL'],
          };
          switchActiveRoleUser(dbUser);
          loginSuccess();
          notify(`Bienvenido(a) ${dbUser.fullName} [${dbUser.role}] — Conectado a Supabase.`);
          setLoading(false);
          return;
        }
      }

      const foundUser = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.active
      );

      if (!foundUser) {
        setErrorMsg('El usuario ingresado no existe o está deshabilitado.');
        setLoading(false);
        return;
      }

      if (foundUser.pin !== pinOrPassword.trim()) {
        setErrorMsg('Contraseña / PIN incorrecto.');
        setLoading(false);
        return;
      }

      switchActiveRoleUser(foundUser);
      loginSuccess();
      notify(`Bienvenido(a) ${foundUser.fullName} [${foundUser.role}] — Smart Punto de Venta`);
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const sb = createPOSClient();
    if (!sb) {
      setLoading(false);
      setErrorMsg('El cliente de Supabase no está configurado.');
      return;
    }

    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password: supaPassword,
      });

      if (error) {
        setErrorMsg(`Supabase Auth: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        const mappedUser = {
          id: data.user.id,
          username: 'ADMINISTRADOR',
          fullName: data.user.email?.toUpperCase() || 'ADMINISTRADOR',
          role: 'ADMINISTRADOR' as const,
          branch: activeCompany.branchCode,
          active: true,
          pin: '1234',
          permissions: ['ALL'],
        };
        switchActiveRoleUser(mappedUser);
        loginSuccess();
        notify(`Sesión iniciada con Supabase Auth (${data.user.email}).`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al autenticar con Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#111c2d] flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Animated Background Image Layer (Ken Burns effect) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-kenburns pointer-events-none"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />

      {/* Real-time Interactive Canvas Animation (Waves, Nodes & Particles) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Ambient Floating Glowing Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl animate-orb-a pointer-events-none" />
      <div className="absolute -bottom-28 -right-20 w-[440px] h-[440px] rounded-full bg-sky-400/20 blur-3xl animate-orb-b pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl animate-orb-a pointer-events-none" />

      {/* Subtle Diagonal Light Sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-sweep" />
      </div>

      {/* Floating Ambient Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { left: '12%', top: '78%', delay: '0s', color: 'bg-emerald-300/60' },
          { left: '24%', top: '85%', delay: '2.2s', color: 'bg-sky-300/60' },
          { left: '38%', top: '80%', delay: '4.1s', color: 'bg-amber-300/60' },
          { left: '66%', top: '84%', delay: '1.5s', color: 'bg-emerald-300/60' },
          { left: '78%', top: '76%', delay: '3.4s', color: 'bg-sky-300/60' },
          { left: '89%', top: '82%', delay: '5.2s', color: 'bg-amber-300/60' },
        ].map((p, idx) => (
          <span
            key={idx}
            style={{ left: p.left, top: p.top, animationDelay: p.delay }}
            className={`absolute w-1.5 h-1.5 rounded-full ${p.color} blur-[0.5px] animate-particle-rise`}
          />
        ))}
      </div>

      {/* Contrast Overlay */}
      <div className="absolute inset-0 bg-[#0f172a]/20 pointer-events-none" />

      <div className="relative z-10 w-[620px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl rounded-[3px] overflow-hidden">
        {/* Window Title Bar */}
        <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span className="text-[11px] font-semibold text-slate-800">
              Iniciar Sesión - Smart Punto de Venta
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <Database className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              {supabaseConfigured
                ? supabaseTablesReady
                  ? 'Supabase PostgreSQL Activo'
                  : 'Conectado a Supabase'
                : 'Sin conexión'}
            </span>
          </div>
        </div>

        {/* Dark Navy Subheader */}
        <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white text-[11px]">
          <span className="font-bold tracking-wide text-[#fff3a1]">SMART PUNTO DE VENTA</span>
          <span className="text-[10px] text-slate-300">FACTURACIÓN Y CONTROL DE INVENTARIO</span>
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-12 gap-5 items-center bg-[#d8dfe8]">
          {/* Left Logo Card */}
          <div className="col-span-5 bg-[#d5dce6] border border-[#b8c0cc] p-4 flex flex-col items-center text-center shadow-inner">
            <img
              src="/logo.png"
              alt="Smart Punto de Venta"
              className="w-36 h-36 object-contain mb-3 drop-shadow-sm"
            />
            <div className="text-xs font-black text-slate-900 underline">{activeCompany.name}</div>
            <div className="text-[9.5px] text-slate-700 mt-1">{activeCompany.commercialName}</div>
            <div className="text-[9.5px] text-slate-600 mt-1">
              {activeCompany.address} • TEL {activeCompany.phone}
            </div>
          </div>

          {/* Right Form */}
          <div className="col-span-7 space-y-3 text-xs">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('POS_PIN');
                  setErrorMsg('');
                }}
                className={`h-7 border text-[10.5px] font-bold flex items-center justify-center gap-1 ${authTab === 'POS_PIN'
                    ? 'bg-[#fff3a1] border-[#d4b838] text-slate-900'
                    : 'bg-[#e2e6ec] border-[#a5aebc] text-slate-700'
                  }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Usuario / PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('SUPABASE_AUTH');
                  setErrorMsg('');
                }}
                className={`h-7 border text-[10.5px] font-bold flex items-center justify-center gap-1 ${authTab === 'SUPABASE_AUTH'
                    ? 'bg-[#fff3a1] border-[#d4b838] text-slate-900'
                    : 'bg-[#e2e6ec] border-[#a5aebc] text-slate-700'
                  }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Supabase Auth
              </button>
            </div>

            {/* Sucursal */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                EMPRESA / SUCURSAL
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                <select
                  value={activeCompany.id}
                  onChange={(e) => setActiveCompanyId(e.target.value)}
                  className="w-full h-6 pl-7 pr-2 bg-white border border-[#a5aebc] text-[11px] font-semibold text-slate-800"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.branchCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {authTab === 'POS_PIN' ? (
              <form onSubmit={handlePosLogin} className="space-y-2.5">
                {/* Quick Role Selector */}
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                    SELECCIONAR ROL DEL SISTEMA
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['ADMINISTRADOR', 'CAJERO', 'INVENTARIO', 'CONTABILIDAD'] as const).map((rKey) => {
                      const matchedUser = users.find((u) => u.role === rKey && u.active);
                      const targetUsername = matchedUser ? matchedUser.username : rKey;
                      const isSelected = username.toUpperCase() === targetUsername.toUpperCase();
                      return (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => {
                            setUsername(targetUsername);
                            setErrorMsg('');
                          }}
                          className={`h-6 px-2 border text-[10px] font-bold flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-[#1c2b42] text-[#fff3a1] border-[#0f172a]'
                              : 'bg-white hover:bg-[#e9eef5] text-slate-700 border-[#a5aebc]'
                          }`}
                        >
                          <span>{rKey}</span>
                          {isSelected && <span className="text-[9px]">●</span>}
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const activeRoleObj =
                      users.find((u) => u.username.toUpperCase() === username.toUpperCase())?.role ||
                      'ADMINISTRADOR';
                    return (
                      <div className="mt-1 px-2 py-1 bg-[#e6ecf4] border border-[#b8c4d4] text-[9.5px] text-slate-700 leading-tight">
                        <strong className="text-slate-900">{ROLE_DESCRIPTIONS[activeRoleObj].label}:</strong>{' '}
                        {ROLE_DESCRIPTIONS[activeRoleObj].summary}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                    USUARIO
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-6 pl-7 pr-2 bg-white border border-[#a5aebc] text-[11px] font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                    CONTRASEÑA / PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                    <input
                      type="password"
                      required
                      value={pinOrPassword}
                      onChange={(e) => setPinOrPassword(e.target.value)}
                      placeholder="Ingrese su PIN (por defecto: 1234)"
                      className="w-full h-6 pl-7 pr-2 bg-white border border-[#a5aebc] text-[11px] font-mono text-slate-800"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-1.5 bg-red-100 border border-red-400 text-red-800 text-[10px] font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-8 bg-[#1c2b42] hover:bg-[#263a59] text-[#fff3a1] font-bold text-xs border border-[#0f172a] flex items-center justify-center gap-2 shadow"
                  >
                    <LogIn className="w-4 h-4" />
                    {loading ? 'VERIFICANDO EN BASE DE DATOS...' : 'ENTRAR AL SISTEMA'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSupabaseLogin} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                    CORREO SUPABASE
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-6 pl-7 pr-2 bg-white border border-[#a5aebc] text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                    CONTRASEÑA
                  </label>
                  <input
                    type="password"
                    required
                    value={supaPassword}
                    onChange={(e) => setSupaPassword(e.target.value)}
                    className="w-full h-6 px-2 bg-white border border-[#a5aebc] text-[11px]"
                  />
                </div>
                {errorMsg && (
                  <div className="p-1.5 bg-red-100 border border-red-400 text-red-800 text-[10px] font-semibold">
                    {errorMsg}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-8 bg-[#1c2b42] text-[#fff3a1] font-bold text-xs border border-[#0f172a]"
                >
                  {loading ? 'CONECTANDO...' : 'AUTENTICAR CON SUPABASE'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
