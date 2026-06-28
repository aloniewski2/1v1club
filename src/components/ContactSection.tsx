import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Github } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="section-padding tech-grid">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-primary font-mono font-medium tracking-widest uppercase text-xs mb-3">Contact</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Let's <span className="text-gradient">Connect</span></h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Always open to new opportunities, collaborations, and conversations.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-lg p-8 md:p-10 inline-flex flex-col md:flex-row gap-8 md:gap-12 transition-colors"
        >
          <a href="mailto:aloniewski635@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group">
            <Mail size={18} className="group-hover:text-primary" />
            <span className="text-sm font-mono">aloniewski635@gmail.com</span>
          </a>
          <a href="tel:+19086740932" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group">
            <Phone size={18} className="group-hover:text-primary" />
            <span className="text-sm font-mono">(908) 674-0932</span>
          </a>
          <div className="flex items-center gap-3 text-muted-foreground">
            <MapPin size={18} />
            <span className="text-sm font-mono">South Plainfield, NJ</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-6 mt-10"
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
        </motion.div>

        <div className="mt-20 pt-8 border-t border-border">
          <p className="text-xs font-mono text-muted-foreground">
            © {new Date().getFullYear()} Andrew Loniewski — Built with React & TypeScript
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
