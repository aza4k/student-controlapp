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

    logAction('LAB_OPENED', 'System', 'Tarmoq laboratoriyasi ochildi');

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
    logAction('DEVICE_CREATED', name, `${name} (${type}) topologiyaga qo‘shildi`);
  };

  const deleteDevice = (device) => {
    setLinks((prev) => prev.filter((l) => l.from !== device.id && l.to !== device.id));
    setDevices((prev) => prev.filter((d) => d.id !== device.id));
    if (selectedDeviceForConnect?.id === device.id) setSelectedDeviceForConnect(null);
    if (activeConfigDevice?.id === device.id) setActiveConfigDevice(null);
    logAction('DEVICE_DELETED', device.name, `${device.name} topologiyadan o‘chirildi`);
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
    const newX = Math.max(20, Math.min(rect.width - 100, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(20, Math.min(rect.height - 100, e.clientY - rect.top - dragOffset.y));

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
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
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
    <div className="h-screen flex flex-col bg-[#EEF2F8] overflow-hidden text-[#0F172A]">
      <header className="bg-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2F8] text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-extrabold text-[#0F172A]">{assignment.title}</h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-[#545AE8]">
                Network Lab
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#545AE8]" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => addDevice('PC')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-[#545AE8]" />
              <span>+ PC</span>
            </button>
            <button
              onClick={() => addDevice('Switch')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Switch</span>
            </button>
            <button
              onClick={() => addDevice('Router')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Router className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Router</span>
            </button>
            <button
              onClick={() => addDevice('Server')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-purple-600" />
              <span>+ Server</span>
            </button>
          </div>

          <button
            onClick={runPingTest}
            className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ping Test</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Topshirish</span>
          </button>
        </div>
      </header>

      {bannerError && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 text-xs text-rose-700 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>{bannerError}</span>
          </div>
          <button onClick={() => setBannerError('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden select-none"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {links.map((link, idx) => {
              const d1 = devices.find((d) => d.id === link.from);
              const d2 = devices.find((d) => d.id === link.to);
              if (!d1 || !d2) return null;

              const x1 = d1.x + 48;
              const y1 = d1.y + 42;
              const x2 = d2.x + 48;
              const y2 = d2.y + 42;

              return (
                <g key={idx}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#545AE8"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                    strokeOpacity="0.75"
                  />
                  <circle cx={x1} cy={y1} r="4" fill="#10B981" />
                  <circle cx={x2} cy={y2} r="4" fill="#10B981" />
                </g>
              );
            })}
          </svg>

          {devices.map((device) => {
            const isSelected = selectedDeviceForConnect?.id === device.id;
            let IconComponent = Monitor;
            let iconBg = 'bg-indigo-50 text-[#545AE8]';
            if (device.type === 'Switch') {
              IconComponent = HardDrive;
              iconBg = 'bg-amber-50 text-amber-600';
            } else if (device.type === 'Router') {
              IconComponent = Router;
              iconBg = 'bg-emerald-50 text-emerald-600';
            } else if (device.type === 'Server') {
              IconComponent = Server;
              iconBg = 'bg-purple-50 text-purple-600';
            }

            return (
              <div
                key={device.id}
                onMouseDown={(e) => handleMouseDown(e, device)}
                onClick={() => handleDeviceClick(device)}
                style={{ left: device.x, top: device.y }}
                className={`absolute w-24 p-2.5 rounded-2xl bg-white border shadow-md flex flex-col items-center cursor-move transition-all z-10 ${
                  isSelected
                    ? 'border-[#545AE8] ring-2 ring-[#545AE8]/30'
                    : 'border-slate-200 hover:border-[#545AE8]/50'
                }`}
              >
                <div className={`p-2 rounded-xl mb-1.5 ${iconBg}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-[#0F172A] tracking-tight">{device.name}</span>
                {device.ip ? (
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold mt-0.5">{device.ip}</span>
                ) : (
                  device.type !== 'Switch' && (
                    <span className="text-[10px] text-rose-500 font-mono mt-0.5">IP yo‘q</span>
                  )
                )}

                <div className="mt-1.5 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveConfigDevice(device);
                    }}
                    title="IP Konfiguratsiya"
                    className="p-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF2F8] text-slate-600 border border-slate-200 cursor-pointer"
                  >
                    <Settings2 className="w-3 h-3" />
                  </button>
                  {device.type !== 'Switch' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTerminalDevice(device);
                        setCliHistory(`${device.name} CLI v2.4 (Cisco IOS)\nBuyruqlar ro‘yxati uchun "help" yozing.\n\n${device.name}> `);
                      }}
                      title="Terminal (CLI)"
                      className="p-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF2F8] text-[#545AE8] border border-slate-200 cursor-pointer"
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
                    className="p-1 rounded-lg bg-[#F8FAFC] hover:bg-rose-50 text-rose-500 border border-slate-200 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs px-4 py-2 rounded-xl text-xs text-slate-600 border border-slate-200 shadow-sm">
            <strong className="text-[#0F172A]">Qo‘llanma:</strong> Qurilmani ketma-ket bosib kabel ulang | Surish: joyini o‘zgartirish | Tishli g‘ildirak: IP sozlash
          </div>
        </div>

        <div className="w-full md:w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <Activity className="w-4 h-4 text-[#545AE8]" />
              <span>Harakatlar Jurnali</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">{logs.length} ta yozuv</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">Harakatlar kutilmoqda...</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    log.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : log.isResolved
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-[#F8FAFC] border-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                    <span className="font-bold text-[#545AE8]">{log.device}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-[#0F172A] text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#545AE8]" />
                <span>{activeConfigDevice.name} IP Sozlamalari</span>
              </h3>
              <button
                onClick={() => setActiveConfigDevice(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">IP Address</label>
                <input
                  name="ip"
                  defaultValue={activeConfigDevice.ip}
                  placeholder="192.168.1.20"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#545AE8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subnet Mask</label>
                <input
                  name="subnet"
                  defaultValue={activeConfigDevice.subnet || '255.255.255.0'}
                  placeholder="255.255.255.0"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#545AE8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Gateway</label>
                <input
                  name="gateway"
                  defaultValue={activeConfigDevice.gateway || '192.168.1.1'}
                  placeholder="192.168.1.1"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#545AE8]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveConfigDevice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-[#545AE8] hover:bg-[#4349D6] px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-[#0F172A] text-base flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#545AE8]" />
                <span>Ping Connectivity Tester</span>
              </h3>
              <button
                onClick={() => setShowPingModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-slate-500 font-bold mb-1">Manba (Source)</label>
                <select
                  value={pingSourceId}
                  onChange={(e) => setPingSourceId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#545AE8]"
                >
                  {hostDevices.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.ip || 'IP yoq'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 font-bold mb-1">Manzil (Target)</label>
                <select
                  value={pingTargetId}
                  onChange={(e) => setPingTargetId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#545AE8]"
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
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {pingStatus === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{pingStatus === 'SUCCESS' ? 'Aloqa muvaffaqiyatli o‘rnatildi (0% loss)' : 'Aloqa yo‘q (100% loss)'}</span>
              </div>
            )}

            <div className="bg-[#0F172A] rounded-2xl p-4 font-mono text-xs text-slate-100 min-h-44 whitespace-pre-wrap mb-4">
              {pingOutput}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPingModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={executePing}
                disabled={isPinging}
                className="bg-[#545AE8] hover:bg-[#4349D6] px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPinging ? 'Yuborilmoqda...' : 'Paket Jo‘natish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTerminalDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col h-96">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#545AE8]" />
                <span>{activeTerminalDevice.name} — Virtual Console (CLI)</span>
              </h3>
              <button
                onClick={() => setActiveTerminalDevice(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-[#0F172A] rounded-xl p-3 font-mono text-xs text-slate-100 overflow-y-auto whitespace-pre-wrap mb-3 custom-scrollbar">
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
                className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#545AE8]"
              />
              <button
                type="submit"
                className="bg-[#545AE8] hover:bg-[#4349D6] px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="font-extrabold text-[#0F172A] text-base">Amaliyotni yakunlaysizmi?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Topshiriq yakunlangach, barcha amaliy qadamlaringiz tahlil qilinib o‘qituvchi paneliga hisobot yuboriladi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmAndSubmit}
                className="px-5 py-2 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] text-xs font-bold text-white cursor-pointer"
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
