import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";

// Wagerly wager app
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
import WagerPreview from "./wager/pages/WagerPreview";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/project/:slug" element={<ProjectDetail />} />

            {/* Wagerly — P2P wagering app */}
            <Route path="/wager/auth" element={<WagerAuth />} />
            <Route path="/wager/preview" element={<WagerPreview />} />
            <Route path="/wager/join/:token" element={<JoinWager />} />
            <Route path="/wager/connect/return" element={<ConnectReturn />} />
            <Route path="/wager/connect/refresh" element={<ConnectRefresh />} />
            <Route path="/wager" element={<WagerLayout />}>
              <Route index element={<WagerDashboard />} />
              <Route path="create" element={<CreateWager />} />
              <Route path="notifications" element={<WagerNotifications />} />
              <Route path="profile" element={<WagerProfile />} />
              <Route path="wallet" element={<WagerWallet />} />
              <Route path="cashout" element={<WagerCashOut />} />
              <Route path="leaderboard" element={<WagerLeaderboard />} />
              <Route path="friends" element={<WagerAddFriend />} />
              <Route path=":id" element={<WagerDetail />} />
              <Route path=":id/pay" element={<WagerPayment />} />
              <Route path=":id/declare" element={<DeclareWinner />} />
              <Route path=":id/invite" element={<WagerInvite />} />
              <Route path=":id/payout" element={<WagerPayout />} />
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
