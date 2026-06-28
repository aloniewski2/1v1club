import { motion } from "framer-motion";
import { GraduationCap, Trophy, MapPin } from "lucide-react";

const highlights = [
  {
    icon: GraduationCap,
    title: "Muhlenberg College",
    description: "B.A. in Computer Science & Finance — GPA: 3.6, May 2027",
  },
  {
    icon: Trophy,
    title: "NCAA D3 Wrestler",
    description: "Top 10 nationally, 2025 NCAA Qualifier, 2x Scholar All-American, Team Captain & MVP",
  },
  {
    icon: MapPin,
    title: "South Plainfield, NJ",
    description: "Open to remote and on-site opportunities nationwide",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="section-padding tech-grid">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-primary font-mono font-medium tracking-widest uppercase text-xs mb-3">About</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">
            Engineer. Athlete. <span className="text-gradient">Builder.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-lg p-8 transition-colors"
            >
              <item.icon className="text-primary mb-4" size={24} />
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 glass-card rounded-lg p-8 md:p-10 transition-colors"
        >
          <h3 className="font-mono text-sm font-semibold mb-5 text-primary tracking-wider">COURSEWORK</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Data Structures & Algorithms", "Software Engineering", "Database Systems",
              "Cybersecurity", "Web Development", "Computer Organization",
              "Corporation Finance", "Statistical Analysis", "Financial Accounting",
              "Investment Strategies", "Game Programming", "Business Management",
            ].map((course) => (
              <span
                key={course}
                className="text-xs font-mono bg-secondary text-secondary-foreground px-3 py-1.5 rounded border border-border"
              >
                {course}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
