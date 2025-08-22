import { useState, useEffect } from 'react';
import { Battery, Cpu, Clock } from 'lucide-react';

export const DeviceStatus = () => {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [time, setTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState<number>(0);

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Get battery info if available
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBattery({
            level: Math.round(battery.level * 100),
            charging: battery.charging
          });

          battery.addEventListener('levelchange', () => {
            setBattery({
              level: Math.round(battery.level * 100),
              charging: battery.charging
            });
          });

          battery.addEventListener('chargingchange', () => {
            setBattery({
              level: Math.round(battery.level * 100),
              charging: battery.charging
            });
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    // Get more accurate CPU usage estimate
    const cpuInterval = setInterval(() => {
      const startTime = performance.now();
      const iterations = 100000;
      
      // Simple CPU benchmark
      let result = 0;
      for (let i = 0; i < iterations; i++) {
        result += Math.sqrt(i);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Convert execution time to a rough CPU usage percentage
      const baselineTime = 10; // ms for baseline
      const usage = Math.min(Math.max((executionTime / baselineTime) * 20, 0), 100);
      setCpuUsage(Math.round(usage));
    }, 3000);

    getBatteryInfo();

    return () => {
      clearInterval(timeInterval);
      clearInterval(cpuInterval);
    };
  }, []);

  return (
    <div className="flex items-center gap-4 text-xs text-editor-text-muted">
      {/* Time */}
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span>{time.toLocaleTimeString()}</span>
      </div>

      {/* Battery */}
      {battery && (
        <div className="flex items-center gap-1">
          <Battery className={`w-3 h-3 ${battery.charging ? 'text-green-500' : ''}`} />
          <span>{battery.level}%</span>
          {battery.charging && <span className="text-green-500">⚡</span>}
        </div>
      )}

      {/* CPU Usage */}
      <div className="flex items-center gap-1">
        <Cpu className="w-3 h-3" />
        <span>{cpuUsage}%</span>
      </div>
    </div>
  );
};