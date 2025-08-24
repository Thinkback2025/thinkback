import { useState } from "react";
import { User, LogOut, Settings, Phone, Mail, MapPin, Send, CreditCard } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User as UserType } from "@shared/schema";

interface UserProfileDropdownProps {
  user: UserType;
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const { toast } = useToast();

  // Fetch payment history
  const { data: paymentHistory } = useQuery({
    queryKey: ["/api/payment/history"],
    retry: false,
    enabled: showProfileDialog, // Only fetch when dialog is open
  });

  const sendAdminCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/send-admin-code");
    },
    onSuccess: () => {
      toast({
        title: "Admin Code Sent",
        description: "Check your email for the admin secret code.",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("429:") 
        ? error.message.replace("429: ", "")
        : error.message || "Unable to send admin code. Please try again.";
      
      toast({
        title: "Unable to Send Code",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const isIndia = user?.countryCode === "+91";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.username || user?.firstName || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Your account information and details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Profile Image and Name */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {user?.username || user?.firstName || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Parent Account
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Mobile Number</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.countryCode && user?.mobileNumber 
                      ? `${user.countryCode} ${user.mobileNumber}`
                      : 'Not provided'
                    }
                  </p>
                </div>
              </div>

              {isIndia && user?.state && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">State</p>
                    <p className="text-sm text-muted-foreground">
                      {user.state}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Information */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Security Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Admin Secret Code</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono font-medium">••••</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendAdminCodeMutation.mutate()}
                      disabled={sendAdminCodeMutation.isPending}
                      className="h-6 w-6 p-0"
                      title="Send code to email"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click the arrow to receive the code to your registered email. Use this code in Knets Jr app to disable the device admin of the child device.
                </p>
              </div>
            </div>

            {/* Account Status */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Account Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profile Complete</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user?.isProfileComplete 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.isProfileComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subscription</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user?.subscriptionStatus === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : user?.subscriptionStatus === 'trial'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.subscriptionStatus || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Children Limit</span>
                  <span className="text-sm font-medium">
                    {user?.maxChildren || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment History
              </h4>
              <div className="space-y-2">
                {paymentHistory?.invoices && paymentHistory.invoices.length > 0 ? (
                  paymentHistory.invoices.map((invoice: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">Invoice #{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">Paid on {invoice.paidOn}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{invoice.amount}</p>
                        <p className="text-xs text-green-600">Paid</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No Payments to Show</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}