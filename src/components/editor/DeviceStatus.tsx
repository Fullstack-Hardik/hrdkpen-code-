import { useState, useEffect } from 'react';
import { Battery, Cpu, Clock, Wifi, HardDrive } from 'lucide-react';

export const DeviceStatus = () => {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [time, setTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [networkStatus, setNetworkStatus] = useState<{ online: boolean; type: string }>({ online: navigator.onLine, type: 'unknown' });
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

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

    // Monitor network status
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      setNetworkStatus({
        online: navigator.onLine,
        type: connection ? connection.effectiveType || 'unknown' : 'unknown'
      });
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    // Get memory usage if available
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const usedJSHeapSize = memInfo.usedJSHeapSize;
        const totalJSHeapSize = memInfo.totalJSHeapSize;
        const usage = (usedJSHeapSize / totalJSHeapSize) * 100;
        setMemoryUsage(Math.round(usage));
      }
    };

    // Get more accurate CPU usage estimate
    const cpuInterval = setInterval(() => {
      const startTime = performance.now();
      const iterations = 100000;
      
      // Simple CPU benchmark
      let result = 0;
      for (let i = 0; i < iterations; i++) {
        result += Math.sqrt(i) * Math.random();
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Convert execution time to a rough CPU usage percentage
      const baselineTime = 15; // ms for baseline
      const usage = Math.min(Math.max((executionTime / baselineTime) * 10, 5), 95);
      setCpuUsage(Math.round(usage));
      
      // Update memory usage
      updateMemoryUsage();
    }, 2000);

    getBatteryInfo();

    return () => {
      clearInterval(timeInterval);
      clearInterval(cpuInterval);
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 text-xs text-editor-text-muted">
      {/* Time */}
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span>{time.toLocaleTimeString()}</span>
      </div>

      {/* Battery */}
      {battery && (
        <div className="flex items-center gap-1">
          <Battery className={`w-3 h-3 ${battery.charging ? 'text-green-500' : battery.level < 20 ? 'text-red-500' : ''}`} />
          <span>{battery.level}%</span>
          {battery.charging && <span className="text-green-500">⚡</span>}
        </div>
      )}

      {/* Network Status */}
      <div className="flex items-center gap-1">
        <Wifi className={`w-3 h-3 ${networkStatus.online ? 'text-green-500' : 'text-red-500'}`} />
        <span>{networkStatus.online ? networkStatus.type : 'offline'}</span>
      </div>

      {/* CPU Usage */}
      <div className="flex items-center gap-1">
        <Cpu className={`w-3 h-3 ${cpuUsage > 80 ? 'text-red-500' : cpuUsage > 50 ? 'text-yellow-500' : 'text-green-500'}`} />
        <span>{cpuUsage}%</span>
      </div>

      {/* Memory Usage */}
      {memoryUsage > 0 && (
        <div className="flex items-center gap-1">
          <HardDrive className={`w-3 h-3 ${memoryUsage > 80 ? 'text-red-500' : memoryUsage > 50 ? 'text-yellow-500' : 'text-green-500'}`} />
          <span>{memoryUsage}%</span>
        </div>
      )}
    </div>
  );
};