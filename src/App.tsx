import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";

// 1v1 Club app
import WagerAuth from "./wager/pages/WagerAuth";
import WagerLayout from "./wager/components/WagerLayout";
import WagerDashboard from "./wager/pages/WagerDashboard";
import CreateWager from "./wager/pages/CreateWager";
import WagerDetail from "./wager/pages/WagerDetail";
import WagerPayment from "./wager/pages/WagerPayment";
import JoinWager from "./wager/pages/JoinWager";
import DeclareWinner from "./wager/pages/DeclareWinner";
import ConnectReturn from "./wager/pages/ConnectReturn";
import ConnectRefresh from "./wager/pages/ConnectRefresh";
import WagerInvite from "./wager/pages/WagerInvite";
import WagerPayout from "./wager/pages/WagerPayout";
import WagerDispute from "./wager/pages/WagerDispute";
import WagerEvidence from "./wager/pages/WagerEvidence";
import WagerChat from "./wager/pages/WagerChat";
import WagerNotifications from "./wager/pages/WagerNotifications";
import WagerProfile from "./wager/pages/WagerProfile";
import WagerWallet from "./wager/pages/WagerWallet";
import WagerCashOut from "./wager/pages/WagerCashOut";
import WagerLeaderboard from "./wager/pages/WagerLeaderboard";
import WagerAddFriend from "./wager/pages/WagerAddFriend";
import AdminReview from "./wager/pages/AdminReview";
import WagerPro from "./wager/pages/WagerPro";
import DeepLinkListener from "./wager/components/DeepLinkListener";
import NativeStatusBar from "./wager/components/NativeStatusBar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NativeStatusBar />
        <BrowserRouter>
          <DeepLinkListener />
          <Routes>
            {/* Legacy portfolio site, moved off the root for the product domain. */}
            <Route path="/portfolio" element={<Index />} />
            <Route path="/project/:slug" element={<ProjectDetail />} />

            {/* 1v1 Club — the app now lives at the root. */}
            <Route path="/auth" element={<WagerAuth />} />
            <Route path="/join/:token" element={<JoinWager />} />
            <Route path="/" element={<WagerLayout />}>
              <Route index element={<WagerDashboard />} />
              <Route path="create" element={<CreateWager />} />
              <Route path="notifications" element={<WagerNotifications />} />
              <Route path="profile" element={<WagerProfile />} />
              <Route path="leaderboard" element={<WagerLeaderboard />} />
              <Route path="friends" element={<WagerAddFriend />} />
              <Route path="admin" element={<AdminReview />} />
              <Route path="pro" element={<WagerPro />} />
              <Route path=":id" element={<WagerDetail />} />
              <Route path=":id/declare" element={<DeclareWinner />} />
              <Route path=":id/invite" element={<WagerInvite />} />
              <Route path=":id/dispute" element={<WagerDispute />} />
              <Route path=":id/evidence" element={<WagerEvidence />} />
              <Route path=":id/chat" element={<WagerChat />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
