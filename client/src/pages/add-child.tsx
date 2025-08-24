import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, User, Phone, Calendar, Smartphone, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

const addChildSchema = z.object({
  name: z.string().min(2, "Child name must be at least 2 characters"),
  age: z.number().min(1, "Age must be at least 1").max(18, "Age cannot exceed 18 years"),
  schoolCategory: z.string().optional(), // Optional, only for +91 India
  standard: z.string().min(1, "Please select standard"),
  type: z.string().min(1, "Please select type"),
  deviceName: z.string().min(2, "Device name must be at least 2 characters"),
  countryCode: z.string().min(1, "Please select country code"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number cannot exceed 15 digits"),
});

type AddChildForm = z.infer<typeof addChildSchema>;

export default function AddChild() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  console.log("🎯 AddChild component loaded");

  // Fetch country codes
  const { data: countryCodes = [] } = useQuery<Array<{code: string, country: string, flag: string}>>({
    queryKey: ["/api/config/country-codes"],
    enabled: isAuthenticated,
  });

  const form = useForm<AddChildForm>({
    resolver: zodResolver(addChildSchema),
    defaultValues: {
      name: "",
      age: 0,
      schoolCategory: "",
      standard: "",
      type: "",
      deviceName: "",
      countryCode: "+91",
      mobileNumber: "",
    },
  });

  const addChildMutation = useMutation({
    mutationFn: async (data: AddChildForm) => {
      const fullPhoneNumber = `${data.countryCode} ${data.mobileNumber}`;
      const response = await apiRequest("POST", "/api/children/add", {
        name: data.name,
        age: data.age,
        schoolCategory: data.schoolCategory,
        standard: data.standard,
        type: data.type,
        deviceName: data.deviceName,
        phoneNumber: fullPhoneNumber,
        countryCode: data.countryCode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Child is added successfully",
        description: `${data.child.name} has been added to your family.`,
      });
      
      // Navigate to security code setup page
      navigate(`/security-setup/${data.child.id}`);
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
      
      console.error("Add child error:", error);
      toast({
        title: "Failed to Add Child",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddChildForm) => {
    addChildMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
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
          <h1 className="text-xl font-semibold text-neutral-darker">Back to Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-600" />
              <span>Add Child</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Child Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-neutral-dark" />
                        <span>Child Name</span>
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
                          step="1"
                          placeholder="Enter age (1-18)"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(0);
                              return;
                            }
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 1 && numValue <= 18) {
                              field.onChange(numValue);
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) {
                              field.onChange(0);
                            } else if (value > 18) {
                              field.onChange(18);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Standard */}
                <FormField
                  control={form.control}
                  name="standard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-neutral-dark" />
                        <span>Standard</span>
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select standard" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LKG">LKG</SelectItem>
                            <SelectItem value="UKG">UKG</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="7">7</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                            <SelectItem value="9">9</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="11">11</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* School */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-neutral-dark" />
                        <span>School</span>
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select school type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Govt">Govt</SelectItem>
                            <SelectItem value="Private">Private</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <span>Child Mobile Name</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Sarah's iPhone"
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
                    <span>Child Mobile Number</span>
                  </FormLabel>
                  
                  <div className="flex space-x-2">
                    {/* Country Code */}
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                              <SelectContent>
                                {countryCodes.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.flag} {country.code} {country.country}
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
                              placeholder="Mobile number"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* School Category - Only for child's India (+91) mobile number */}
                {form.watch("countryCode") === "+91" && (
                  <FormField
                    control={form.control}
                    name="schoolCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-neutral-dark" />
                          <span>School Category</span>
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select school category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CBSE">CBSE</SelectItem>
                              <SelectItem value="Matriculation">Matriculation</SelectItem>
                              <SelectItem value="State Board">State Board</SelectItem>
                              <SelectItem value="Kendriya Vidyalaya">Kendriya Vidyalaya</SelectItem>
                              <SelectItem value="Navodaya Vidyalaya">Navodaya Vidyalaya</SelectItem>
                              <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addChildMutation.isPending}
                >
                  {addChildMutation.isPending ? "Adding Child..." : "Continue to Security Setup"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}