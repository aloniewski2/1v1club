import { motion } from "framer-motion";
import { ArrowDown, Github, Linkedin, Mail, Terminal, FileDown } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" id="hero">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 scanline pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-secondary/80 border border-border px-4 py-1.5 rounded-full mb-8"
        >
          <Terminal size={14} className="text-primary" />
          <span className="text-xs font-mono text-primary tracking-wider">ENGINEER · RESEARCHER · ATHLETE</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6"
        >
          Andrew{" "}
          <span className="text-gradient">Loniewski</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          CS & Finance @ Muhlenberg College. Building impactful software,
          competing at the highest level, and turning data into decisions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-4"
        >
          <a
            href="#projects"
            className="bg-primary text-primary-foreground font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            View Projects
          </a>
          <a
            href="/resume.pdf"
            download
            className="flex items-center gap-2 border border-primary/30 text-primary text-sm font-medium px-6 py-3 rounded-md hover:bg-primary/10 transition-colors"
          >
            <FileDown size={16} />
            Resume
          </a>
          <a
            href="#contact"
            className="border border-border text-foreground text-sm font-medium px-6 py-3 rounded-md hover:bg-secondary transition-colors"
          >
            Contact Me
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-6 mt-12"
        >
          <a href="https://github.com/aloniewski2" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Github size={22} />
          </a>
          <a
            href="https://www.linkedin.com/in/andrew-loniewski-132a40287/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Linkedin size={22} />
          </a>
          <a href="mailto:aloniewski635@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
            <Mail size={22} />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <a href="#about" className="text-primary/60 animate-bounce block">
            <ArrowDown size={24} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
