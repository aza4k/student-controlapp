import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import confetti from 'canvas-confetti';
import {
  Monitor,
  HardDrive,
  Router,
  Server,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Settings2,
  Trash2,
  Activity,
  Send,
  X,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export default function NetworkLab({ assignment, submissionId, onBack, onComplete }) {
  const [devices, setDevices] = useState([
    { id: 'pc_1', name: 'PC1', type: 'PC', x: 120, y: 180, ip: '192.168.1.10', subnet: '255.255.255.0', gateway: '192.168.1.1' },
    { id: 'sw_1', name: 'Switch1', type: 'Switch', x: 380, y: 180, ip: '', subnet: '', gateway: '' },
    { id: 'pc_2', name: 'PC2', type: 'PC', x: 640, y: 180, ip: '', subnet: '255.255.255.0', gateway: '192.168.1.1' },
  ]);

  const [links, setLinks] = useState([
    { from: 'pc_1', to: 'sw_1' }
  ]);

  const [selectedDeviceForConnect, setSelectedDeviceForConnect] = useState(null);
  const [activeConfigDevice, setActiveConfigDevice] = useState(null);
  const [activeTerminalDevice, setActiveTerminalDevice] = useState(null);

  const [logs, setLogs] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const [showPingModal, setShowPingModal] = useState(false);
  const [pingSourceId, setPingSourceId] = useState('pc_1');
  const [pingTargetId, setPingTargetId] = useState('pc_2');
  const [pingOutput, setPingOutput] = useState('');
  const [pingStatus, setPingStatus] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState('');

  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    api.getSubmissionDetail(submissionId).then((sub) => {
      if (sub?.final_state?.devices?.length) {
        setDevices(sub.final_state.devices);
      }
      if (sub?.final_state?.connections) {
        setLinks(sub.final_state.connections);
      }
      if (sub?.work_time_seconds) {
        setElapsedSeconds(sub.work_time_seconds);
      }
    }).catch(() => {});

    logAction('LAB_OPENED', 'System', 'Talaba tarmoq laboratoriyasini ochdi');

    return () => clearInterval(timer);
  }, [submissionId]);

  const logAction = (actionType, device, details, isError = false, errorType = '', isResolved = false) => {
    const logItem = {
      id: Date.now() + Math.random(),
      seconds: elapsedSeconds,
      actionType,
      device,
      details,
      isError,
      isResolved,
    };

    setLogs((prev) => [logItem, ...prev]);

    api.logActivity(submissionId, {
      elapsed_seconds: elapsedSeconds,
      action_type: actionType,
      target_device: device,
      details,
      is_error: isError,
      error_type: errorType,
      is_resolved: isResolved,
    });
  };

  const hasNetworkPath = (startId, targetId) => {
    if (startId === targetId) return true;
    const visited = new Set([startId]);
    const queue = [startId];

    while (queue.length > 0) {
      const curr = queue.shift();
      for (const link of links) {
        const next = link.from === curr ? link.to : link.to === curr ? link.from : null;
        if (next && !visited.has(next)) {
          if (next === targetId) return true;
          const nextDev = devices.find((d) => d.id === next);
          if (nextDev && (nextDev.type === 'Switch' || nextDev.type === 'Router')) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
    }
    return false;
  };

  const isSameSubnet = (ip1, ip2) => {
    if (!ip1 || !ip2) return false;
    const p1 = ip1.split('.');
    const p2 = ip2.split('.');
    if (p1.length !== 4 || p2.length !== 4) return false;
    return p1[0] === p2[0] && p1[1] === p2[1] && p1[2] === p2[2];
  };

  const addDevice = (type) => {
    const count = devices.filter((d) => d.type === type).length + 1;
    const name = `${type}${count}`;
    const newDevice = {
      id: `${type.toLowerCase()}_${Date.now()}`,
      name,
      type,
      x: 100 + (devices.length * 60) % 400,
      y: type === 'Switch' || type === 'Router' ? 120 : 250,
      ip: '',
      subnet: '255.255.255.0',
      gateway: '192.168.1.1',
    };

    setDevices((prev) => [...prev, newDevice]);
    logAction('DEVICE_CREATED', name, `${name} (${type}) topologiyaga qo'shildi`);
  };

  const deleteDevice = (device) => {
    setLinks((prev) => prev.filter((l) => l.from !== device.id && l.to !== device.id));
    setDevices((prev) => prev.filter((d) => d.id !== device.id));
    if (selectedDeviceForConnect?.id === device.id) setSelectedDeviceForConnect(null);
    if (activeConfigDevice?.id === device.id) setActiveConfigDevice(null);
    logAction('DEVICE_DELETED', device.name, `${device.name} topologiyadan o'chirildi`);
  };

  const handleDeviceClick = (device) => {
    if (!selectedDeviceForConnect) {
      setSelectedDeviceForConnect(device);
    } else {
      if (selectedDeviceForConnect.id === device.id) {
        setSelectedDeviceForConnect(null);
        return;
      }

      const dev1 = selectedDeviceForConnect;
      const dev2 = device;

      const already = links.some(
        (l) => (l.from === dev1.id && l.to === dev2.id) || (l.from === dev2.id && l.to === dev1.id)
      );

      if (already) {
        setLinks((prev) =>
          prev.filter(
            (l) => !((l.from === dev1.id && l.to === dev2.id) || (l.from === dev2.id && l.to === dev1.id))
          )
        );
        logAction('DISCONNECTED', `${dev1.name}-${dev2.name}`, 'Qurilmalar orasidagi kabel uzildi');
      } else {
        setLinks((prev) => [...prev, { from: dev1.id, to: dev2.id }]);
        logAction('CONNECTED', `${dev1.name}-${dev2.name}`, 'FastEthernet kabel orqali ulandi');
      }
      setSelectedDeviceForConnect(null);
    }
  };

  const handleMouseDown = (e, device) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingId(device.id);
    setDragOffset({
      x: e.clientX - rect.left - device.x,
      y: e.clientY - rect.top - device.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(rect.width - 90, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(20, Math.min(rect.height - 90, e.clientY - rect.top - dragOffset.y));

    setDevices((prev) =>
      prev.map((d) => (d.id === draggingId ? { ...d, x: newX, y: newY } : d))
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const runPingTest = () => {
    const hosts = devices.filter((d) => d.type === 'PC' || d.type === 'Server');
    if (hosts.length < 2) {
      setBannerError('Kamida 2 ta PC yoki Server qurilmasi bo‘lishi kerak');
      return;
    }

    const src = hosts[0];
    const dst = hosts[1];
    setPingSourceId(src.id);
    setPingTargetId(dst.id);
    setPingStatus(null);
    setShowPingModal(true);
    setPingOutput(`Ping ${src.name} -> ${dst.name} sinoviga tayyor.\nTarget IP: ${dst.ip || 'BELGILANMAGAN'}\n`);
    setIsPinging(false);
  };

  const executePing = async () => {
    const pc1 = devices.find((d) => d.id === pingSourceId);
    const pc2 = devices.find((d) => d.id === pingTargetId);
    if (!pc1 || !pc2) return;

    setIsPinging(true);
    setPingStatus(null);
    setPingOutput(`Pinging ${pc2.ip || '0.0.0.0'} from ${pc1.ip || '0.0.0.0'} with 32 bytes of data...\n`);

    await new Promise((r) => setTimeout(r, 700));

    const pathExists = hasNetworkPath(pc1.id, pc2.id);
    const validIps = Boolean(pc1.ip && pc2.ip && pc1.ip !== pc2.ip);
    const sameSubnet = isSameSubnet(pc1.ip, pc2.ip);

    if (pathExists && validIps && sameSubnet) {
      setPingStatus('SUCCESS');
      setPingOutput((prev) => prev +
        `Reply from ${pc2.ip}: bytes=32 time=2ms TTL=128\n` +
        `Reply from ${pc2.ip}: bytes=32 time=1ms TTL=128\n` +
        `Reply from ${pc2.ip}: bytes=32 time=2ms TTL=128\n` +
        `Reply from ${pc2.ip}: bytes=32 time=1ms TTL=128\n\n` +
        `Ping statistics:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`
      );
      logAction('PING_SUCCESS', `${pc1.name}->${pc2.name}`, 'Ping muvaffaqiyatli: 4 packets sent, 4 received (0% loss)', false, '', true);
    } else {
      setPingStatus('FAILED');
      let fail = 'Request timed out.';
      if (!pathExists) fail = 'Destination host unreachable (Kabel yoki Switch/Router ulanmagan)';
      else if (!validIps || !sameSubnet) fail = `Subnet mismatch yoki noto'g'ri IP (${pc1.ip || 'yoq'} vs ${pc2.ip || 'yoq'})`;

      setPingOutput((prev) => prev +
        `${fail}\n${fail}\n${fail}\n${fail}\n\n` +
        `Ping statistics:\n    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`
      );
      logAction('PING_FAILED', `${pc1.name}->${pc2.name}`, fail, true, 'PING_UNREACHABLE');
    }
    setIsPinging(false);
  };

  const confirmAndSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const finalState = {
        devices,
        connections: links,
      };

      const res = await api.submitAssignment(submissionId, finalState, elapsedSeconds);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onComplete(res.id);
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hostDevices = devices.filter((d) => d.type === 'PC' || d.type === 'Server');

  return (
    <div className="h-screen flex flex-col bg-[#080d1e] overflow-hidden text-slate-100">
      <div className="glass-nav px-6 py-3 flex items-center justify-between border-b border-white/10 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{assignment.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Network Lab
              </span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vaqt: {formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => addDevice('PC')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>+ PC</span>
            </button>
            <button
              onClick={() => addDevice('Switch')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Switch</span>
            </button>
            <button
              onClick={() => addDevice('Router')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Router className="w-3.5 h-3.5 text-teal-400" />
              <span>+ Router</span>
            </button>
            <button
              onClick={() => addDevice('Server')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>+ Server</span>
            </button>
          </div>

          <button
            onClick={runPingTest}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ping Test</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Topshirish</span>
          </button>
        </div>
      </div>

      {bannerError && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 px-6 py-2 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{bannerError}</span>
          </div>
          <button onClick={() => setBannerError('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 relative bg-[#090e24] overflow-hidden select-none"
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {links.map((link, idx) => {
              const d1 = devices.find((d) => d.id === link.from);
              const d2 = devices.find((d) => d.id === link.to);
              if (!d1 || !d2) return null;

              const x1 = d1.x + 40;
              const y1 = d1.y + 35;
              const x2 = d2.x + 40;
              const y2 = d2.y + 35;

              return (
                <g key={idx}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    strokeOpacity="0.85"
                  />
                  <circle cx={x1} cy={y1} r="4" fill="#10b981" />
                  <circle cx={x2} cy={y2} r="4" fill="#10b981" />
                </g>
              );
            })}
          </svg>

          {devices.map((device) => {
            const isSelected = selectedDeviceForConnect?.id === device.id;
            let IconComponent = Monitor;
            let iconColor = 'text-blue-400';
            if (device.type === 'Switch') {
              IconComponent = HardDrive;
              iconColor = 'text-cyan-400';
            } else if (device.type === 'Router') {
              IconComponent = Router;
              iconColor = 'text-teal-400';
            } else if (device.type === 'Server') {
              IconComponent = Server;
              iconColor = 'text-purple-400';
            }

            return (
              <div
                key={device.id}
                onMouseDown={(e) => handleMouseDown(e, device)}
                onClick={() => handleDeviceClick(device)}
                style={{ left: device.x, top: device.y }}
                className={`absolute w-24 p-2.5 rounded-2xl glass-card flex flex-col items-center cursor-move transition-all z-10 ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'
                    : 'hover:border-cyan-500/50'
                }`}
              >
                <div className="p-2 rounded-xl bg-white/5 mb-1.5">
                  <IconComponent className={`w-6 h-6 ${iconColor}`} />
                </div>
                <span className="font-bold text-xs text-white tracking-tight">{device.name}</span>
                {device.ip ? (
                  <span className="text-[10px] font-mono text-emerald-400 mt-0.5">{device.ip}</span>
                ) : (
                  device.type !== 'Switch' && (
                    <span className="text-[9px] text-rose-400 font-mono mt-0.5">IP yo‘q</span>
                  )
                )}

                <div className="mt-1 flex items-center gap-1 opacity-80 hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveConfigDevice(device);
                    }}
                    title="IP Konfiguratsiya"
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                  >
                    <Settings2 className="w-3 h-3" />
                  </button>
                  {device.type !== 'Switch' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTerminalDevice(device);
                        setCliHistory(`${device.name} CLI v2.4 (Cisco IOS)\nType "help" for commands.\n\n${device.name}> `);
                      }}
                      title="Terminal (CLI)"
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-cyan-300 cursor-pointer"
                    >
                      <Terminal className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDevice(device);
                    }}
                    title="O'chirish"
                    className="p-1 rounded bg-white/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-4 left-4 z-10 glass-panel px-4 py-2 rounded-xl text-xs text-slate-300 border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              <strong>Qo‘llanma:</strong> Qurilmani bosing va ikkinchisini tanlang (Kabel ulash) | Sozlama tugmasi: IP kiritish
            </span>
          </div>
        </div>

        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-[#060a17]/80 backdrop-blur-xl flex flex-col z-10">
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Activity Log (Harakatlar Jurnali)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              LIVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">Harakatlar kutilmoqda...</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    log.isError
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : log.isResolved
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/5 border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                    <span className="font-bold text-cyan-400">{log.device}</span>
                    <span>{formatTime(log.seconds)}</span>
                  </div>
                  <div className="font-medium leading-relaxed">{log.details}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {activeConfigDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                <span>{activeConfigDevice.name} IP Sozlamalari</span>
              </h3>
              <button
                onClick={() => setActiveConfigDevice(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const ip = form.ip.value.trim();
                const subnet = form.subnet.value.trim();
                const gateway = form.gateway.value.trim();

                const isConflict = devices.some((d) => d.id !== activeConfigDevice.id && d.ip === ip && ip);
                const parts = ip.split('.');
                const invalid = parts.length !== 4 || parts.some((p) => p === '' || isNaN(p) || Number(p) < 0 || Number(p) > 255);

                setDevices((prev) =>
                  prev.map((d) =>
                    d.id === activeConfigDevice.id ? { ...d, ip, subnet, gateway } : d
                  )
                );

                if (invalid) {
                  logAction('CONFIG_ERROR', activeConfigDevice.name, `Noto'g'ri IP formati: ${ip}`, true, 'INVALID_IP');
                } else if (isConflict) {
                  logAction('CONFIG_ERROR', activeConfigDevice.name, `IP Conflict: ${ip} boshqa qurilmaga berilgan`, true, 'IP_CONFLICT');
                } else {
                  logAction('IP_CONFIGURED', activeConfigDevice.name, `IP belgilandi: ${ip} / ${subnet}`, false, '', true);
                }

                setActiveConfigDevice(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-slate-300 mb-1">IP Address</label>
                <input
                  name="ip"
                  defaultValue={activeConfigDevice.ip}
                  placeholder="192.168.1.20"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Subnet Mask</label>
                <input
                  name="subnet"
                  defaultValue={activeConfigDevice.subnet || '255.255.255.0'}
                  placeholder="255.255.255.0"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Default Gateway</label>
                <input
                  name="gateway"
                  defaultValue={activeConfigDevice.gateway || '192.168.1.1'}
                  placeholder="192.168.1.1"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveConfigDevice(null)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Ping Connectivity Tester</span>
              </h3>
              <button
                onClick={() => setShowPingModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Manba (Source)</label>
                <select
                  value={pingSourceId}
                  onChange={(e) => setPingSourceId(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {hostDevices.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.ip || 'IP yoq'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Manzil (Target)</label>
                <select
                  value={pingTargetId}
                  onChange={(e) => setPingTargetId(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {hostDevices.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.ip || 'IP yoq'})</option>
                  ))}
                </select>
              </div>
            </div>

            {pingStatus && (
              <div className={`mb-3 px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                pingStatus === 'SUCCESS'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}>
                {pingStatus === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{pingStatus === 'SUCCESS' ? 'Aloqa muvaffaqiyatli o‘rnatildi (0% loss)' : 'Aloqa yo‘q (100% loss)'}</span>
              </div>
            )}

            <div className="bg-[#020617] rounded-2xl p-4 font-mono text-xs text-cyan-300 min-h-44 whitespace-pre-wrap border border-white/10 mb-4">
              {pingOutput}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPingModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={executePing}
                disabled={isPinging}
                className="glass-btn-primary px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPinging ? 'Yuborilmoqda...' : 'Paket Jo‘natish (Ping)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTerminalDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col h-96">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>{activeTerminalDevice.name} - Virtual Console (CLI)</span>
              </h3>
              <button
                onClick={() => setActiveTerminalDevice(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-[#020617] rounded-xl p-3 font-mono text-xs text-cyan-300 overflow-y-auto whitespace-pre-wrap border border-white/10 mb-3">
              {cliHistory}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cmd = cliInput.trim();
                setCliInput('');
                if (!cmd) return;

                const currentDev = devices.find((d) => d.id === activeTerminalDevice.id) || activeTerminalDevice;

                let res = '';
                if (cmd === 'help') {
                  res = 'Buyruqlar ro‘yxati:\n  ipconfig       - Qurilma IP holati\n  ping <ip>      - Aloqani tekshirish\n  clear          - Ekranni tozalash\n';
                } else if (cmd === 'ipconfig') {
                  res = `FastEthernet0 IPv4: ${currentDev.ip || 'None'}\nSubnet Mask: ${currentDev.subnet}\nDefault Gateway: ${currentDev.gateway}\n`;
                } else if (cmd === 'clear') {
                  setCliHistory(`${currentDev.name}> `);
                  return;
                } else if (cmd.startsWith('ping ')) {
                  const targetIp = cmd.replace('ping ', '').trim();
                  const targetDev = devices.find((d) => d.ip === targetIp);
                  const reachable = targetDev && hasNetworkPath(currentDev.id, targetDev.id) && isSameSubnet(currentDev.ip, targetDev.ip);
                  if (reachable) {
                    res = `Pinging ${targetIp} with 32 bytes:\nReply from ${targetIp}: bytes=32 time=2ms TTL=128\nReply from ${targetIp}: bytes=32 time=1ms TTL=128\nPacket loss: 0% (OK)\n`;
                    logAction('PING_SUCCESS', `${currentDev.name}->${targetIp}`, 'CLI orqali ping muvaffaqiyatli', false, '', true);
                  } else {
                    res = `Pinging ${targetIp}:\nRequest timed out.\nDestination host unreachable.\nPacket loss: 100% (FAILED)\n`;
                    logAction('PING_FAILED', `${currentDev.name}->${targetIp}`, 'CLI ping uzilish bilan tugadi', true, 'PING_UNREACHABLE');
                  }
                } else {
                  res = `% Unrecognized command "${cmd}". Type "help".\n`;
                }

                setCliHistory((prev) => `${prev}${cmd}\n${res}\n${currentDev.name}> `);
              }}
              className="flex gap-2"
            >
              <input
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="ping 192.168.1.20 yoki ipconfig..."
                className="flex-1 glass-input rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                type="submit"
                className="glass-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Amaliyotni yakunlaysizmi?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Topshiriq yakunlangach, barcha amaliy qadamlaringiz tahlil qilinib ustoz paneliga hisobot yuboriladi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmAndSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
