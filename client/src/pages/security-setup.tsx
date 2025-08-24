import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Shield, Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function SecuritySetup() {
  const [match, params] = useRoute("/security-setup/:childId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const childId = params?.childId;

  // Fetch child details
  const { data: child, isLoading } = useQuery<{
    id: number;
    name: string;
    parentCode: string;
    deviceName?: string;
    phoneNumber?: string;
  }>({
    queryKey: [`/api/children/${childId}`],
    enabled: isAuthenticated && !!childId,
  });



  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast({
        title: "Copied to Clipboard",
        description: `${type} has been copied to your clipboard.`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };



  if (!match || !childId) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-lightest p-4">
        <div className="max-w-md mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    toast({
      title: "Child Not Found",
      description: "The child you're trying to set up security for was not found.",
      variant: "destructive",
    });
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-lightest p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-neutral-darker">Security Setup</h1>
        </div>

        <div className="space-y-6">
          {/* Child Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Setting up security for {child.name}</span>
              </CardTitle>
              <CardDescription>
                Create security codes for device management
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Parent Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>Parent Code</span>
              </CardTitle>
              <CardDescription>
                Share this code with {child?.name} to connect their device to Knets Jr app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <Badge variant="outline" className="text-lg font-mono px-4 py-2">
                    {child?.parentCode || "Loading..."}
                  </Badge>
                  <p className="text-xs text-neutral-dark mt-2">
                    Your child will enter this code in the Knets Jr app
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(child?.parentCode || "", "Parent Code")}
                  className="p-2"
                >
                  {copiedCode === "Parent Code" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Complete */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Setup Complete!</h3>
                  <p className="text-green-600 dark:text-green-300 mt-2">
                    {child?.name} can now connect their device using the parent code above.
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    Device protection will use your global admin secret code from account setup.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/")}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm text-neutral-dark">
                <h4 className="font-medium text-neutral-darker">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Share the Parent Code with your child</li>
                  <li>Help them install the Knets Jr app on their device</li>
                  <li>They'll enter the Parent Code to connect to your dashboard</li>
                  <li>The app will automatically register their device IMEI</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}