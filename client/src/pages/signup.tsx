import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Shield, Key, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

// Complete list of Indian states and union territories (28 states + 8 UTs)
const INDIAN_STATES = [
  // States (28)
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", 
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  
  // Union Territories (8)
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// Country codes
const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
];

// Step 1: Basic Information Schema
const basicInfoSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username too long"),
  email: z.string().email("Invalid email address"),
  countryCode: z.string().min(1, "Country code is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number too long"),
  state: z.string().optional(),
});

// Step 2: Security Schema
const securitySchema = z.object({
  deviceAdminSecretCode: z.string().length(4, "Secret code must be exactly 4 digits").regex(/^\d+$/, "Secret code must contain only numbers"),
});

type BasicInfo = z.infer<typeof basicInfoSchema>;
type SecurityInfo = z.infer<typeof securitySchema>;

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedParentCode, setGeneratedParentCode] = useState<string>("");

  // Step 1 Form
  const basicForm = useForm<BasicInfo>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      username: "",
      email: "",
      countryCode: "+91",
      mobileNumber: "",
      state: "",
    },
  });

  // Step 2 Form
  const securityForm = useForm<SecurityInfo>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      deviceAdminSecretCode: "",
    },
  });

  const countryCode = basicForm.watch("countryCode");
  const isIndia = countryCode === "+91";

  // Save basic info mutation
  const saveBasicInfoMutation = useMutation({
    mutationFn: async (data: BasicInfo) => {
      const response = await apiRequest("POST", "/api/signup/basic-info", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setBasicInfo(basicForm.getValues());
      setStep(2);
      toast({
        title: "Basic Information Saved",
        description: "Please set up your security code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete signup mutation
  const completeSignupMutation = useMutation({
    mutationFn: async (data: SecurityInfo) => {
      const response = await apiRequest("POST", "/api/signup/complete", {
        ...basicInfo,
        ...data,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedParentCode(data.parentCode);
      setIsSuccess(true);
      toast({
        title: "Account Created Successfully! ✅",
        description: `Your parent code is: ${data.parentCode}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete signup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onBasicSubmit = (data: BasicInfo) => {
    // Add state validation for India
    if (data.countryCode === "+91" && !data.state) {
      basicForm.setError("state", { message: "State is required for India" });
      return;
    }
    saveBasicInfoMutation.mutate(data);
  };

  const onSecuritySubmit = (data: SecurityInfo) => {
    completeSignupMutation.mutate(data);
  };

  const handleProceedToDashboard = () => {
    navigate("/");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Account Created Successfully!</CardTitle>
            <CardDescription>Welcome to Knets family device management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-green-800">Your Parent Code</Label>
              <div className="text-2xl font-bold text-green-600 text-center py-2">
                {generatedParentCode}
              </div>
              <p className="text-xs text-green-700 text-center">
                Save this code - you'll need it to connect your children's devices
              </p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>Username:</strong> {basicInfo?.username}</p>
              <p><strong>Email:</strong> {basicInfo?.email}</p>
              <p><strong>Mobile:</strong> {basicInfo?.countryCode} {basicInfo?.mobileNumber}</p>
              {isIndia && basicInfo?.state && (
                <p><strong>State:</strong> {basicInfo.state}</p>
              )}
            </div>
            
            <Button onClick={handleProceedToDashboard} className="w-full">
              Proceed to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {step === 1 ? "Create Your Account" : "Security Setup"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1 
              ? "Enter your details to get started with Knets" 
              : "Set up your device admin security code"
            }
          </CardDescription>
          
          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className={`w-8 h-2 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-2 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
          </div>
        </CardHeader>
        
        <CardContent>
          {step === 1 ? (
            <Form {...basicForm}>
              <form onSubmit={basicForm.handleSubmit(onBasicSubmit)} className="space-y-4">
                <FormField
                  control={basicForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={basicForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={basicForm.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRY_CODES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={basicForm.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {isIndia && (
                  <FormField
                    control={basicForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={saveBasicInfoMutation.isPending}
                >
                  {saveBasicInfoMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue to Security Setup"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...securityForm}>
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Device Admin Security</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    This 4-digit code will be required when children try to disable device admin on their phones.
                  </p>
                </div>
                
                <FormField
                  control={securityForm.control}
                  name="deviceAdminSecretCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Key className="w-4 h-4" />
                        <span>4-Digit Secret Code</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Enter 4-digit code"
                          maxLength={4}
                          {...field}
                          className="text-center text-lg tracking-widest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={completeSignupMutation.isPending}
                  >
                    {completeSignupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}