import projectSolveit from "@/assets/project-solveit.png";
import projectStock from "@/assets/project-stock.jpg";
import projectLeakguard from "@/assets/project-leakguard.png";
import dvScreen1 from "@/assets/dv-screen-1.png";
import dvScreen2 from "@/assets/dv-screen-2.png";
import dvScreen3 from "@/assets/dv-screen-3.png";
import dvScreen4 from "@/assets/dv-screen-4.png";
import dvScreen5 from "@/assets/dv-screen-5.png";

export interface Project {
  slug: string;
  title: string;
  description: string;
  longDescription: string[];
  tech: string[];
  github?: string;
  live?: string;
  date: string;
  thumbnail: string;
  video?: string;
  screenshots?: string[];
}

export const projects: Project[] = [
  {
    slug: "leakguard",
    title: "LeakGuard",
    description:
      "Privacy-first web app that analyzes bank statements locally in-browser to detect recurring charges, duplicate services, zombie subscriptions, and hidden price increases.",
    longDescription: [
      "Built a privacy-first web app that analyzes bank statements locally in-browser to detect recurring charges, duplicate services, zombie subscriptions, and hidden price increases.",
      "Engineered a detection engine with 150+ merchant patterns, fuzzy matching, and recurrence heuristics to classify subscriptions, bills, and variable spending.",
      "Designed a gamified 'Efficiency Score' (0–100) and insights dashboard surfacing actionable intelligence: trial traps, micro-leaks, cancellation difficulty ratings, and duplicate service alerts.",
      "Zero backend, 100% client-side processing for maximum user privacy.",
    ],
    tech: ["React", "TypeScript", "Tailwind CSS", "Framer Motion", "Recharts", "PapaParse"],
    github: "https://github.com/aloniewski2/subscription-saver",
    date: "Feb 2026",
    thumbnail: projectLeakguard,
    video: "/videos/leakguard.mp4",
  },
  {
    slug: "solveit-ai",
    title: "SolveIT AI",
    description:
      "Full-stack AI problem-solving app with Google Gemini integration, multimodal analysis, real-time web crawling, intelligent follow-ups, and native mobile deployment via Capacitor.",
    longDescription: [
      "Developed a full-stack AI problem-solving application using React + TypeScript frontend with Supabase Edge Functions (Deno) backend.",
      "Integrated Google Gemini AI for multimodal analysis — processing both images and text to diagnose real-world problems with confidence scoring.",
      "Implemented real-time web crawling via Firecrawl API to fetch verified tutorials, forums, and repair guides from Reddit, YouTube, iFixit, and StackExchange.",
      "Built an intelligent follow-up question system that dynamically generates clarifying questions when the initial input is vague or low-confidence.",
      "Created an AI-powered chatbot for contextual follow-up conversations about diagnosed problems using streaming responses.",
      "Implemented native mobile features using Capacitor — camera integration, geolocation-based professional finder, and cross-platform iOS/Android deployment.",
    ],
    tech: ["React", "TypeScript", "Supabase", "Gemini AI", "Firecrawl", "Capacitor"],
    github: "https://github.com/aloniewski2/solveit-ai-v1",
    date: "Oct 2025",
    thumbnail: projectSolveit,
    video: "/videos/solveit-ai.mp4",
  },
  {
    slug: "dinevalley",
    title: "DineValley",
    description:
      "Modern restaurant recommendation app with Google Places API integration, geolocation-based search, custom filtering, chatbot interface, and CI/CD via GitHub Actions.",
    longDescription: [
      "Developed a modern restaurant recommendation web application using a React + TypeScript frontend and a Node.js/Express backend.",
      "Integrated Google Places API to deliver real-time restaurant search, filters, and geolocation-based recommendations.",
      "Designed a clean, responsive UI with Tailwind CSS and Vite, featuring dynamic components, state management, and reusable sections.",
      "Implemented custom filtering logic for distance, cuisine type, ratings, pricing, and user-selected preferences.",
      "Built backend endpoints to handle requests, manage API keys safely, and preprocess restaurant data for improved accuracy and speed.",
      "Enhanced UX with a chatbot interface that leverages the same filtering logic to deliver personalized restaurant suggestions.",
      "Set up CI/CD workflows with GitHub Actions for automated testing and deployment.",
    ],
    tech: ["React", "TypeScript", "Node.js", "Express", "Tailwind", "Google Places API"],
    live: "https://dinevalley-frontend.onrender.com/",
    date: "Nov 2025",
    thumbnail: dvScreen1,
    screenshots: [dvScreen1, dvScreen2, dvScreen3, dvScreen4, dvScreen5],
  },
  {
    slug: "stock-predictor",
    title: "Stock Portfolio & Predictor",
    description:
      "Python Flask web app for virtual stock portfolio management with ML-powered price predictions using scikit-learn and real-time data via yfinance API.",
    longDescription: [
      "Developed a Python Flask web app enabling users to manage a virtual stock portfolio.",
      "Implemented a machine learning model using scikit-learn to predict future stock prices.",
      "Utilized yfinance API for real-time stock data and charting of historical performance.",
    ],
    tech: ["Python", "Flask", "scikit-learn", "yfinance", "Machine Learning"],
    github: "https://github.com/aloniewski2/Stock_Predictor",
    date: "Nov 2024",
    thumbnail: projectStock,
  },
];
