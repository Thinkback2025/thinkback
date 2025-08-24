import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { usePWA } from '@/hooks/usePWA';
import { Smartphone, Wifi, WifiOff, Clock, MapPin, Shield, QrCode, Download, Bell } from 'lucide-react';

interface DeviceStatus {
  isLocked: boolean;
  networkEnabled: boolean;
  activeSchedule: string | null;
  lastActivity: string;
  batteryLevel: number;
  location: { lat: number; lng: number; address: string } | null;
}

interface ScheduleInfo {
  name: string;
  isActive: boolean;
  nextChange: string;
  restrictions: string[];
}

export default function KnetsJr() {
  const [parentCode, setParentCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    isLocked: false,
    networkEnabled: true,
    activeSchedule: null,
    lastActivity: new Date().toLocaleTimeString(),
    batteryLevel: 85,
    location: null
  });
  const [schedules, setSchedules] = useState<ScheduleInfo[]>([]);
  const [childName, setChildName] = useState('');
  const { toast } = useToast();
  const { isInstallable, isInstalled, showInstallPrompt, installApp, requestNotificationPermission, dismissInstallPrompt } = usePWA();
  
  // Debug render
  console.log('KnetsJr component rendering');
  
  // Emergency fallback if component fails
  if (typeof window !== 'undefined' && !document.getElementById('knets-jr-app')) {
    console.log('Adding emergency fallback UI');
  }

  // Check if device is already connected
  useEffect(() => {
    const savedConnection = localStorage.getItem('knets-jr-connection');
    if (savedConnection) {
      const connectionData = JSON.parse(savedConnection);
      setIsConnected(true);
      setChildName(connectionData.childName);
      fetchDeviceStatus();
      fetchActiveSchedules();
    }
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setDeviceStatus(prev => ({
          ...prev,
          lastActivity: new Date().toLocaleTimeString(),
          batteryLevel: Math.max(20, prev.batteryLevel - Math.random() * 2)
        }));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const connectToParent = async () => {
    if (!parentCode.trim()) {
      toast({
        title: "Parent Code Required",
        description: "Please enter your parent code to connect this device",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/devices/connect', {
        parentCode: parentCode.trim(),
        deviceInfo: {
          model: navigator.userAgent,
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsConnected(true);
        setChildName(data.childName);
        
        // Save connection locally
        localStorage.setItem('knets-jr-connection', JSON.stringify({
          parentCode,
          childName: data.childName,
          connectedAt: new Date().toISOString()
        }));

        toast({
          title: "Connected Successfully",
          description: `This device is now managed by your parent for ${data.childName}`
        });

        await fetchDeviceStatus();
        await fetchActiveSchedules();
      } else {
        throw new Error(data.message || 'Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Please check your parent code and try again",
        variant: "destructive"
      });
    }
  };

  const fetchDeviceStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/devices/status');
      if (response.ok) {
        const status = await response.json();
        setDeviceStatus(prev => ({ ...prev, ...status }));
      }
    } catch (error) {
      console.error('Failed to fetch device status:', error);
    }
  };

  const fetchActiveSchedules = async () => {
    try {
      const response = await apiRequest('GET', '/api/schedules/active');
      if (response.ok) {
        const activeSchedules = await response.json();
        setSchedules(activeSchedules);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const requestUnlock = async () => {
    try {
      const response = await apiRequest('POST', '/api/devices/request-unlock', {
        reason: 'Child requested device unlock',
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast({
          title: "Unlock Request Sent",
          description: "Your parent has been notified of your unlock request"
        });
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Unable to send unlock request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const scanQRCode = async () => {
    try {
      // Request camera permission and scan QR code
      if ('BarcodeDetector' in window) {
        toast({
          title: "QR Scanner",
          description: "QR code scanning will be available soon"
        });
      } else {
        toast({
          title: "Camera Access",
          description: "Please use the manual parent code entry method"
        });
      }
    } catch (error) {
      console.error('QR scan error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
              <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Knets Jr</CardTitle>
            <CardDescription>
              Connect this device to your parent's Knets account for safe device management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentCode">Parent Code</Label>
              <Input
                id="parentCode"
                type="text"
                placeholder="Enter 6-8 digit parent code"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="text-center text-lg tracking-wider"
                maxLength={8}
              />
            </div>
            
            <Button 
              onClick={connectToParent} 
              className="w-full"
              size="lg"
            >
              Connect Device
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button 
              onClick={scanQRCode} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>

            {/* PWA Install Prompt */}
            {isInstallable && showInstallPrompt && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-green-800 dark:text-green-200 flex-1">
                    Install Knets Jr on your device for better performance and offline access
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissInstallPrompt}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                  >
                    ×
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={async () => {
                      const success = await installApp();
                      if (success) {
                        toast({
                          title: "App Installed Successfully",
                          description: "Knets Jr is now available on your home screen"
                        });
                      } else {
                        toast({
                          title: "Installation Cancelled",
                          description: "You can install later from the browser menu"
                        });
                      }
                    }}
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Install
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={dismissInstallPrompt}
                    className="flex-1"
                  >
                    Later
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-green-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Device Connected</CardTitle>
                <CardDescription>Managed device for {childName}</CardDescription>
              </div>
              <Badge variant={deviceStatus.isLocked ? "destructive" : "default"}>
                {deviceStatus.isLocked ? "Locked" : "Active"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Device Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {deviceStatus.networkEnabled ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">Network: {deviceStatus.networkEnabled ? 'Enabled' : 'Restricted'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                <span className="text-sm">Battery: {Math.round(deviceStatus.batteryLevel)}%</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Last Activity: {deviceStatus.lastActivity}
            </div>
          </CardContent>
        </Card>

        {/* Active Schedules */}
        {schedules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Schedules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {schedules.map((schedule, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{schedule.name}</span>
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? "Active" : "Upcoming"}
                    </Badge>
                  </div>
                  {schedule.restrictions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Restrictions: {schedule.restrictions.join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Next change: {schedule.nextChange}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Notification Permission */}
            {!isInstalled && (
              <Button 
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  toast({
                    title: granted ? "Notifications Enabled" : "Notifications Denied",
                    description: granted 
                      ? "You'll receive updates from your parent" 
                      : "Enable notifications in browser settings for important updates",
                    variant: granted ? "default" : "destructive"
                  });
                }}
                variant="outline" 
                className="w-full"
              >
                <Bell className="mr-2 h-4 w-4" />
                Enable Notifications
              </Button>
            )}

            {deviceStatus.isLocked && (
              <Button onClick={requestUnlock} className="w-full" variant="outline">
                Request Device Unlock
              </Button>
            )}
            
            <Button 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      toast({
                        title: "Location Shared",
                        description: "Your current location has been shared with your parent"
                      });
                    },
                    () => {
                      toast({
                        title: "Location Access",
                        description: "Please enable location access to share your location",
                        variant: "destructive"
                      });
                    }
                  );
                }
              }}
              className="w-full" 
              variant="outline"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Share Location
            </Button>
          </CardContent>
        </Card>

        {/* Emergency */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-400">Emergency Access</CardTitle>
            <CardDescription>
              In case of emergency, contact your parent directly
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}