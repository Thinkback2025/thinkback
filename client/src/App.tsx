import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Signup from "@/pages/signup";
import LocationTracking from "@/pages/location";
import CompanionApp from "@/pages/companion";
import Registration from "@/pages/registration";
import ParentCodes from "@/pages/parent-codes";
import AddChild from "@/pages/add-child";
import EditChild from "@/pages/edit-child";
import SecuritySetup from "@/pages/security-setup";
import KnetsJr from "@/pages/KnetsJr";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/location" component={LocationTracking} />
          <Route path="/parent-codes" component={ParentCodes} />
          <Route path="/add-child" component={() => {
            console.log("🚀 ADD-CHILD ROUTE MATCHED!");
            return <AddChild />;
          }} />
          <Route path="/edit-child/:childId" component={EditChild} />
          <Route path="/security-setup/:childId" component={SecuritySetup} />
        </>
      )}
      <Route path="/companion" component={CompanionApp} />
      <Route path="/knets-jr" component={KnetsJr} />
      <Route path="/register" component={Registration} />
      <Route path="/signup" component={Signup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
