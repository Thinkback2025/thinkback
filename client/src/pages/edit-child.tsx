import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, User, Smartphone, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

const editChildSchema = z.object({
  name: z.string().min(1, "Child name is required").max(50, "Name must be less than 50 characters"),
  age: z.number().min(1, "Age must be at least 1").max(18, "Age must be 18 or younger"),
  deviceName: z.string().min(1, "Device name is required").max(100, "Device name must be less than 100 characters"),
  countryCode: z.string().min(1, "Country code is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number must be less than 15 digits"),
});

type EditChildForm = z.infer<typeof editChildSchema>;

export default function EditChild() {
  const [match, params] = useRoute("/edit-child/:childId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const childId = params?.childId;

  // Fetch country codes
  const { data: countryCodes } = useQuery<{ code: string; country: string }[]>({
    queryKey: ["/api/config/country-codes"],
    enabled: isAuthenticated,
  });

  // Fetch all children and find the specific child
  const { data: allChildren, isLoading } = useQuery<{
    id: number;
    name: string;
    age: number;
    deviceName: string;
    phoneNumber: string;
    parentCode: string;
  }[]>({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  // Find the specific child from the list
  const child = allChildren?.find(c => c.id === parseInt(childId || "0"));

  const form = useForm<EditChildForm>({
    resolver: zodResolver(editChildSchema),
    defaultValues: {
      name: "",
      age: 0,
      deviceName: "",
      countryCode: "+91",
      mobileNumber: "",
    },
  });

  // Update form when child data loads
  useEffect(() => {
    if (child) {
      // Extract country code and mobile number from phoneNumber
      const phoneNumber = child.phoneNumber || "";
      const countryCodeMatch = phoneNumber.match(/^(\+\d+)\s*/);
      const countryCode = countryCodeMatch ? countryCodeMatch[1] : "+91";
      const mobileNumber = phoneNumber.replace(/^\+\d+\s*/, "");

      form.reset({
        name: child.name,
        age: child.age,
        deviceName: child.deviceName || "",
        countryCode: countryCode,
        mobileNumber: mobileNumber,
      });
    }
  }, [child, form]);

  const updateChildMutation = useMutation({
    mutationFn: async (data: EditChildForm) => {
      const response = await apiRequest("PUT", `/api/children/${childId}`, {
        name: data.name,
        age: data.age,
        deviceName: data.deviceName,
        phoneNumber: `${data.countryCode} ${data.mobileNumber}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
      
      toast({
        title: "Child Updated",
        description: `${data.child.name}'s information has been updated successfully.`,
      });
      
      navigate("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      console.error("Update child error:", error);
      toast({
        title: "Failed to Update Child",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditChildForm) => {
    if (!child) return;
    
    // Check if any values have changed
    const currentCountryCode = child.phoneNumber?.match(/^(\+\d+)\s*/)?.[1] || "+91";
    const currentMobileNumber = child.phoneNumber?.replace(/^\+\d+\s*/, "") || "";
    
    const hasChanges = 
      data.name !== child.name ||
      data.age !== child.age ||
      data.deviceName !== (child.deviceName || "") ||
      data.countryCode !== currentCountryCode ||
      data.mobileNumber !== currentMobileNumber;
    
    if (!hasChanges) {
      // No changes made, just navigate back to dashboard
      toast({
        title: "No Changes",
        description: "No changes were made to the child information.",
      });
      navigate("/");
      return;
    }
    
    // There are changes, proceed with the update
    updateChildMutation.mutate(data);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // No longer needed since we're using the children list API

  if (!match || !childId) {
    navigate("/");
    return null;
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-lightest p-4">
        <div className="max-w-md mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
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
      description: "The child you're trying to edit was not found.",
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
          <h1 className="text-xl font-semibold text-neutral-darker">Edit Child</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit {child.name}'s Information</CardTitle>
            <CardDescription>
              Update your child's device and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Child Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-neutral-dark" />
                        <span>Child's Name</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter child's name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age */}
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-neutral-dark" />
                        <span>Age (up to 18 years)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          max="18"
                          placeholder="Enter age"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Device Name */}
                <FormField
                  control={form.control}
                  name="deviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-neutral-dark" />
                        <span>Device Name</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., John's iPhone, Samsung Galaxy"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mobile Number */}
                <div className="space-y-2">
                  <FormLabel className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-neutral-dark" />
                    <span>Child's Mobile Number</span>
                  </FormLabel>
                  <div className="flex space-x-2">
                    {/* Country Code */}
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countryCodes?.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mobile Number */}
                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="Enter mobile number"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={updateChildMutation.isPending}
                  >
                    {updateChildMutation.isPending ? "Updating..." : "Save Changes"}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full"
                    disabled={updateChildMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Display Parent Code */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Parent Code</CardTitle>
            <CardDescription>
              Use this code in Knets Jr app to connect the device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <code className="text-lg font-mono font-semibold text-blue-700">
                {child.parentCode}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}